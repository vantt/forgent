# Review pack: b-data-dictionary

Pack commit: d870fe07f79d115c6a4bf783a386c6f1c3bd4081

Pack id: 7469117bc94f54e1c49416f8a4bfe89fbfb546d0e7cb5e8a5c1873d36186db19

Author session: codex-session:1

## claim_4333c7a8ff0e32c7b69dc10ed113f25b

Source: docs/specs/work-state.md#data-dictionary

Target: docs/platform/work-state/spec.md#3-work-item-data-dictionary

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4333c7a8ff0e32c7b69dc10ed113f25b |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | c0b8898d1e7625e9 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | 3-work-item-data-dictionary |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H2 Data Dictionary is carried as the numbered H2 "3. Work Item Data Dictionary"; the title differs, the section scope is the same. |
| targetUnitDigest | 827361074e830d7578a9647026a99ed3 |

### Source unit

```text
## Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | size | Độ lớn, công sức của việc ('light' · 'standard' · 'heavy') để ước lượng và chia việc, không bao giờ dẫn tới model (Phase 3 tách từ tier cũ; event cũ có tier được map thành size lúc đọc ở một chỗ duy nhất) | `light` · `standard` · `heavy` | no | `standard` |
| 10b | rigor | Độ nghiêm của việc (cùng thang với step và unit), dẫn tới model qua runner.rigorToTier; discovery phán từ bằng chứng thật | `low` · `standard` · `high` · `critical` | no | vắng mặt (dispatch dùng mặc định `standard`, trừ `risk: heavy` dùng `high`) |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | workflowStep | Bước của item trong Workflow của domain nó (`domains/<domain>/workflows/*.yaml`) — chiều VĨ MÔ của vòng đời, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi bước. Danh sách bước hợp lệ, cạnh chuyển bước hợp lệ (`transitions`), skill và operation của mỗi bước nằm trong định nghĩa Workflow — KHÔNG có bản chép nào ở dispatch hay ở Work. Với domain `coding` (Workflow `coding/feature`): `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc trước khi vào executing · `executing` — sẵn sàng cho vòng thi công. `decompose` KHÔNG còn là giá trị hợp lệ: nó là tên cũ của `planning`, được Workflow khai là bí danh (`aliases`) và replay đọc lại thành `planning` ở MỘT chỗ duy nhất (xem "Đường đọc dữ liệu cũ" dưới). `clarify` và `compound-learn` cũng không còn — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | bước thỏa pha `execute` của Workflow (`executing` với coding) khi vắng mặt (item tạo qua `add` không kèm `--step`... xem Khai việc); `discovery` — bước đầu của Workflow — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối Workflow (bộ bước + chuyển-bước) và bảng vòng đời Work (status labels, parkReason, classification, role graph) của item — chiều thứ BA, song song `workflowStep` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"). `domains/<domain>/registry.yaml` khai phần vòng đời Work; các bước, `phase` (`clarify`/`discover`/`plan`/`execute` — vai trò của bước, để pool và verb chọn đúng bước), skill, operation và `transitions` nằm ở Workflow của domain; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (bước `discovery`/`exploring`/`planning`/`executing`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT bước, chỉ thỏa pha `execute` · `triage` — fixture ba bước mang tên riêng không trùng coding, thỏa pha clarify/plan/execute · `fixture-marketing` — fixture khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `workflowStep`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |
```

### Target unit

```text
## 3. Work Item Data Dictionary

| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | size | Độ lớn, công sức của việc ('light' · 'standard' · 'heavy') để ước lượng và chia việc, không bao giờ dẫn tới model (Phase 3 tách từ tier cũ; event cũ có tier được map thành size lúc đọc ở một chỗ duy nhất) | `light` · `standard` · `heavy` | no | `standard` |
| 10b | rigor | Độ nghiêm của việc (cùng thang với step và unit), dẫn tới model qua runner.rigorToTier; discovery phán từ bằng chứng thật | `low` · `standard` · `high` · `critical` | no | vắng mặt (dispatch dùng mặc định `standard`, trừ `risk: heavy` dùng `high`) |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | workflowStep | Bước của item trong Workflow của domain nó (`domains/<domain>/workflows/*.yaml`) — chiều VĨ MÔ của vòng đời, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi bước. Danh sách bước hợp lệ, cạnh chuyển bước hợp lệ (`transitions`), skill và operation của mỗi bước nằm trong định nghĩa Workflow — KHÔNG có bản chép nào ở dispatch hay ở Work. Với domain `coding` (Workflow `coding/feature`): `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc trước khi vào executing · `executing` — sẵn sàng cho vòng thi công. `decompose` KHÔNG còn là giá trị hợp lệ: nó là tên cũ của `planning`, được Workflow khai là bí danh (`aliases`) và replay đọc lại thành `planning` ở MỘT chỗ duy nhất (xem "Đường đọc dữ liệu cũ" dưới). `clarify` và `compound-learn` cũng không còn — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | bước thỏa pha `execute` của Workflow (`executing` với coding) khi vắng mặt (item tạo qua `add` không kèm `--step`... xem Khai việc); `discovery` — bước đầu của Workflow — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối Workflow (bộ bước + chuyển-bước) và bảng vòng đời Work (status labels, parkReason, classification, role graph) của item — chiều thứ BA, song song `workflowStep` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"). `domains/<domain>/registry.yaml` khai phần vòng đời Work; các bước, `phase` (`clarify`/`discover`/`plan`/`execute` — vai trò của bước, để pool và verb chọn đúng bước), skill, operation và `transitions` nằm ở Workflow của domain; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (bước `discovery`/`exploring`/`planning`/`executing`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT bước, chỉ thỏa pha `execute` · `triage` — fixture ba bước mang tên riêng không trùng coding, thỏa pha clarify/plan/execute · `fixture-marketing` — fixture khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `workflowStep`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |
```

### Unified diff

```diff
--- "docs/specs/work-state.md#data-dictionary"
+++ "docs/platform/work-state/spec.md#3-work-item-data-dictionary"
@@ -1,4 +1,4 @@
-## Data Dictionary
+## 3. Work Item Data Dictionary
 
 | # | Element | Meaning | Values | Required | Default |
 |---|-------|---------|--------|----------|---------|
```

## claim_5ba6768e5c4f7d93e77ccceda19d0103

Source: docs/specs/work-state.md#unheaded-block-4

Target: docs/platform/work-state/spec.md#unheaded-block-4

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5ba6768e5c4f7d93e77ccceda19d0103 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 1cedade3c4b6ebc1 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-4 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The 20-element work item table (lines 42-75) is carried verbatim as one block under section 3 (candidate lines 52-85). |
| targetUnitDigest | 1cedade3c4b6ebc117d2a584b597abfb |

### Source unit

```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | size | Độ lớn, công sức của việc ('light' · 'standard' · 'heavy') để ước lượng và chia việc, không bao giờ dẫn tới model (Phase 3 tách từ tier cũ; event cũ có tier được map thành size lúc đọc ở một chỗ duy nhất) | `light` · `standard` · `heavy` | no | `standard` |
| 10b | rigor | Độ nghiêm của việc (cùng thang với step và unit), dẫn tới model qua runner.rigorToTier; discovery phán từ bằng chứng thật | `low` · `standard` · `high` · `critical` | no | vắng mặt (dispatch dùng mặc định `standard`, trừ `risk: heavy` dùng `high`) |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | workflowStep | Bước của item trong Workflow của domain nó (`domains/<domain>/workflows/*.yaml`) — chiều VĨ MÔ của vòng đời, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi bước. Danh sách bước hợp lệ, cạnh chuyển bước hợp lệ (`transitions`), skill và operation của mỗi bước nằm trong định nghĩa Workflow — KHÔNG có bản chép nào ở dispatch hay ở Work. Với domain `coding` (Workflow `coding/feature`): `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc trước khi vào executing · `executing` — sẵn sàng cho vòng thi công. `decompose` KHÔNG còn là giá trị hợp lệ: nó là tên cũ của `planning`, được Workflow khai là bí danh (`aliases`) và replay đọc lại thành `planning` ở MỘT chỗ duy nhất (xem "Đường đọc dữ liệu cũ" dưới). `clarify` và `compound-learn` cũng không còn — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | bước thỏa pha `execute` của Workflow (`executing` với coding) khi vắng mặt (item tạo qua `add` không kèm `--step`... xem Khai việc); `discovery` — bước đầu của Workflow — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối Workflow (bộ bước + chuyển-bước) và bảng vòng đời Work (status labels, parkReason, classification, role graph) của item — chiều thứ BA, song song `workflowStep` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"). `domains/<domain>/registry.yaml` khai phần vòng đời Work; các bước, `phase` (`clarify`/`discover`/`plan`/`execute` — vai trò của bước, để pool và verb chọn đúng bước), skill, operation và `transitions` nằm ở Workflow của domain; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (bước `discovery`/`exploring`/`planning`/`executing`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT bước, chỉ thỏa pha `execute` · `triage` — fixture ba bước mang tên riêng không trùng coding, thỏa pha clarify/plan/execute · `fixture-marketing` — fixture khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `workflowStep`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |
```

### Target unit

```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | size | Độ lớn, công sức của việc ('light' · 'standard' · 'heavy') để ước lượng và chia việc, không bao giờ dẫn tới model (Phase 3 tách từ tier cũ; event cũ có tier được map thành size lúc đọc ở một chỗ duy nhất) | `light` · `standard` · `heavy` | no | `standard` |
| 10b | rigor | Độ nghiêm của việc (cùng thang với step và unit), dẫn tới model qua runner.rigorToTier; discovery phán từ bằng chứng thật | `low` · `standard` · `high` · `critical` | no | vắng mặt (dispatch dùng mặc định `standard`, trừ `risk: heavy` dùng `high`) |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | workflowStep | Bước của item trong Workflow của domain nó (`domains/<domain>/workflows/*.yaml`) — chiều VĨ MÔ của vòng đời, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi bước. Danh sách bước hợp lệ, cạnh chuyển bước hợp lệ (`transitions`), skill và operation của mỗi bước nằm trong định nghĩa Workflow — KHÔNG có bản chép nào ở dispatch hay ở Work. Với domain `coding` (Workflow `coding/feature`): `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc trước khi vào executing · `executing` — sẵn sàng cho vòng thi công. `decompose` KHÔNG còn là giá trị hợp lệ: nó là tên cũ của `planning`, được Workflow khai là bí danh (`aliases`) và replay đọc lại thành `planning` ở MỘT chỗ duy nhất (xem "Đường đọc dữ liệu cũ" dưới). `clarify` và `compound-learn` cũng không còn — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | bước thỏa pha `execute` của Workflow (`executing` với coding) khi vắng mặt (item tạo qua `add` không kèm `--step`... xem Khai việc); `discovery` — bước đầu của Workflow — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối Workflow (bộ bước + chuyển-bước) và bảng vòng đời Work (status labels, parkReason, classification, role graph) của item — chiều thứ BA, song song `workflowStep` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"). `domains/<domain>/registry.yaml` khai phần vòng đời Work; các bước, `phase` (`clarify`/`discover`/`plan`/`execute` — vai trò của bước, để pool và verb chọn đúng bước), skill, operation và `transitions` nằm ở Workflow của domain; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (bước `discovery`/`exploring`/`planning`/`executing`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT bước, chỉ thỏa pha `execute` · `triage` — fixture ba bước mang tên riêng không trùng coding, thỏa pha clarify/plan/execute · `fixture-marketing` — fixture khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `workflowStep`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |
```

### Unified diff

```diff
No text difference.
```

## claim_f4fb783783bb1ad062f39d73e0165f86

Source: docs/specs/work-state.md#bản-ghi-kết-quả-outcome-dự-đoán-thực-tế

Target: docs/platform/work-state/spec.md#outcome-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f4fb783783bb1ad062f39d73e0165f86 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 602d948e76f9796c |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | outcome-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 Outcome record becomes the H3 "Outcome Record" in the English-titled candidate; only the title changed. |
| targetUnitDigest | a168e3fe6dda648968686b558ed3c53a |

### Source unit

```text
### Bản ghi kết quả (outcome) — dự đoán / thực tế

Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Target unit

```text
### Outcome Record

Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |

Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bản-ghi-kết-quả-outcome-dự-đoán-thực-tế"
+++ "docs/platform/work-state/spec.md#outcome-record"
@@ -1,4 +1,4 @@
-### Bản ghi kết quả (outcome) — dự đoán / thực tế
+### Outcome Record
 
 Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
 đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
```

## claim_a9bc0a5c1e4d634958dce841f0e8c44e

Source: docs/specs/work-state.md#unheaded-block-5

Target: docs/platform/work-state/spec.md#unheaded-block-6

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a9bc0a5c1e4d634958dce841f0e8c44e |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2036267728ec19e4 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-6 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Intro paragraph on the outcome record having two halves arriving at different times is carried verbatim. |
| targetUnitDigest | 2036267728ec19e4c861fb80c37a2102 |

### Source unit

```text
Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.
```

### Target unit

```text
Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.
```

### Unified diff

```diff
No text difference.
```

## claim_ef20fa89f544c95d36bedd6842407afc

Source: docs/specs/work-state.md#unheaded-block-6

Target: docs/platform/work-state/spec.md#unheaded-block-7

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ef20fa89f544c95d36bedd6842407afc |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ff1feada8730be0c |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-7 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The O-row table of the outcome record fields (13 lines) is carried verbatim under Outcome Record. |
| targetUnitDigest | ff1feada8730be0c2c0f9dfa7c5be392 |

### Source unit

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |
```

### Target unit

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |
```

### Unified diff

```diff
No text difference.
```

## claim_5eb3738c1994942ff2c0127bd0c5144a

Source: docs/specs/work-state.md#unheaded-block-7

Target: docs/platform/work-state/spec.md#unheaded-block-8

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5eb3738c1994942ff2c0127bd0c5144a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | cf725e032c48a710 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-8 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule for items that never ran (no outcome record) is carried verbatim. |
| targetUnitDigest | cf725e032c48a71007b0fafa2a0378dd |

### Source unit

```text
Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Target unit

```text
Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
No text difference.
```

## claim_3e0b2d8ae4ea0740c26e216e927e001b

Source: docs/specs/work-state.md#bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2

Target: docs/platform/work-state/spec.md#friction-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3e0b2d8ae4ea0740c26e216e927e001b |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 35425ff8bd1cd906 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | friction-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 Friction record becomes the H3 "Friction Record"; only the title differs. |
| targetUnitDigest | ec1aa6de3ff234de129cf1ac211eea60 |

### Source unit

```text
### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)

Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |

Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).
```

### Target unit

```text
### Friction Record

Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |

Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2"
+++ "docs/platform/work-state/spec.md#friction-record"
@@ -1,4 +1,4 @@
-### Bản ghi friction — kênh 2 của capture (Phase 3 Slice 2)
+### Friction Record
 
 Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
 friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
```

## claim_45d8c9d960daf36ad9a1ff2448b77509

Source: docs/specs/work-state.md#unheaded-block-8

Target: docs/platform/work-state/spec.md#unheaded-block-9

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_45d8c9d960daf36ad9a1ff2448b77509 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 81624ef90ec06c15 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-9 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph on a friction record created when an item ends parked or halted is carried verbatim. |
| targetUnitDigest | 81624ef90ec06c15d1fe97548de6ee21 |

### Source unit

```text
Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.
```

### Target unit

```text
Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.
```

### Unified diff

```diff
No text difference.
```

## claim_2d4168e1156696a5a8708e28af6ab369

Source: docs/specs/work-state.md#unheaded-block-9

Target: docs/platform/work-state/spec.md#unheaded-block-10

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2d4168e1156696a5a8708e28af6ab369 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | cd6d9c4f74d86fed |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-10 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The F-row friction field table is carried verbatim; the mechanical locator was confirmed by line-set match against candidate block 10 (lines 122-129). |
| targetUnitDigest | cd6d9c4f74d86fedc3fd1d0bc9f150fc |

### Source unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
```

### Target unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
```

### Unified diff

```diff
No text difference.
```

## claim_27d2b4184ee135467e1305fe686ca129

Source: docs/specs/work-state.md#unheaded-block-10

Target: docs/platform/work-state/spec.md#unheaded-block-11

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_27d2b4184ee135467e1305fe686ca129 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | bd9df710198dd346 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-11 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence and backward-compat note for items that never failed (friction record) is carried verbatim. |
| targetUnitDigest | bd9df710198dd3461f8b9538bf3a16c3 |

### Source unit

```text
Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).
```

### Target unit

```text
Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).
```

### Unified diff

```diff
No text difference.
```

## claim_f7fe1d20b37bc8712bd364582e015c3b

Source: docs/specs/work-state.md#bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout

Target: docs/platform/work-state/spec.md#settlement-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f7fe1d20b37bc8712bd364582e015c3b |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 4dfcb8bd258080c6 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | settlement-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 Settlement record becomes the H3 "Settlement Record"; only the title differs. |
| targetUnitDigest | 5cb3e656cf57f4ae9600cf7a1f21d94a |

### Source unit

```text
### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)

Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |

Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.step`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.

**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).

Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.
```

### Target unit

```text
### Settlement Record

Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |

Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.step`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.

**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).

Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout"
+++ "docs/platform/work-state/spec.md#settlement-record"
@@ -1,4 +1,4 @@
-### Bản ghi settlement — kênh 1 của capture 2 kênh (Phase 3 S3-closeout)
+### Settlement Record
 
 Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
 vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
```

## claim_2a02b2bc8eb92cd35ad50762115b65e4

Source: docs/specs/work-state.md#unheaded-block-11

Target: docs/platform/work-state/spec.md#unheaded-block-12

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2a02b2bc8eb92cd35ad50762115b65e4 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | bf76999817d9cf20 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-12 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Intro paragraph defining a settlement point and the settlement record is carried verbatim. |
| targetUnitDigest | bf76999817d9cf208bb7c3634fc835e0 |

### Source unit

```text
Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.
```

### Target unit

```text
Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.
```

### Unified diff

```diff
No text difference.
```

## claim_0ca5b222fd5b2535bb36c3974551ae09

Source: docs/specs/work-state.md#unheaded-block-12

Target: docs/platform/work-state/spec.md#unheaded-block-13

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0ca5b222fd5b2535bb36c3974551ae09 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 79d33485a7951e73 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-13 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The S-row settlement field table is carried verbatim; line-set match confirms candidate block 13 (lines 144-148), not the locator hint of block 10. |
| targetUnitDigest | 79d33485a7951e73e67a2e485f8a2bbf |

### Source unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |
```

### Target unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |
```

### Unified diff

```diff
No text difference.
```

## claim_96a7c5f5dac19f6d9ff63e1dfcc28962

Source: docs/specs/work-state.md#unheaded-block-13

Target: docs/platform/work-state/spec.md#unheaded-block-14

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_96a7c5f5dac19f6d9ff63e1dfcc28962 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ba396ad09ac0efb0 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-14 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph stating the settlement record is a derived read surface over three existing settlements is carried verbatim. |
| targetUnitDigest | ba396ad09ac0efb0cc666893e0e8dd34 |

### Source unit

```text
Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.step`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.
```

### Target unit

```text
Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.step`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.
```

### Unified diff

```diff
No text difference.
```

## claim_9ffaa331817e1de82f93b7c56ff228c7

Source: docs/specs/work-state.md#unheaded-block-14

Target: docs/platform/work-state/spec.md#unheaded-block-15

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9ffaa331817e1de82f93b7c56ff228c7 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 77b57cc2fc23f47d |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-15 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Backward-compat guard for answer/close settlements keyed on the event schema version is carried verbatim. |
| targetUnitDigest | 77b57cc2fc23f47de457fcf8628c30c6 |

### Source unit

```text
**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Target unit

```text
**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
No text difference.
```

## claim_6845513e9a6cde1e5ebfde966451a579

Source: docs/specs/work-state.md#unheaded-block-15

Target: docs/platform/work-state/spec.md#unheaded-block-16

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6845513e9a6cde1e5ebfde966451a579 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e05bfd6579e6f732 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-16 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule for items that never reached a settlement is carried verbatim. |
| targetUnitDigest | e05bfd6579e6f7322e1de065ea2da563 |

### Source unit

```text
Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.
```

### Target unit

```text
Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.
```

### Unified diff

```diff
No text difference.
```

## claim_b846b2039547198ed6ff7d51f777f951

Source: docs/specs/work-state.md#danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract

Target: docs/platform/work-state/contracts/cli-io-contract.md#writer-identity

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b846b2039547198ed6ff7d51f777f951 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 23ff78de6cfd39e4 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | writer-identity |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 writer identity is moved out of the spec into the contract document as "Writer Identity" (map section 4, contract kind); the title is English in the candidate, the heading unit itself carries no claim of its own. |
| targetUnitDigest | feea2119b2cc9f32fa0ab4f059db649d |

### Source unit

```text
### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)

Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.

`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### Target unit

```text
### Writer Identity

Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.

`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:

Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:

**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#writer-identity"
@@ -1,4 +1,4 @@
-### Danh tính người ghi (writer) — cá thể, tách bạch khỏi vai (str46-io-contract)
+### Writer Identity
 
 Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
 mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
@@ -13,26 +13,12 @@ song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
 độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
 `id`:
 
-| source | Ý nghĩa | Độ tin |
-|---|---|---|
-| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
-| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
-| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
-| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |
+Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
 
-**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
-kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
-khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
-khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
-`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
-nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
-hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").
-
-Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
-và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
-(per str46-io-contract); không có validator nào đứng trên đường ghi
-`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
-— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
-danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
-Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
-tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
\ No newline at end of file
+**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
+được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
+được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
+về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
+chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
+thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
+hai nằm NGOÀI hợp đồng này.
\ No newline at end of file
```

## claim_caf68e55508f56223358d2924374d8cc

Source: docs/specs/work-state.md#unheaded-block-16

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-5

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_caf68e55508f56223358d2924374d8cc |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 7921981cad27a6f1 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-5 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Writer field description (id/source, role versus writer, latest attribution) is stated in both work-state.md and io-contract.md and the candidate carries both texts under Writer Identity; the embedded English gates\[id\] CTR004/v1 sentence is present in the same block. |
| targetUnitDigest | 7921981cad27a6f1ab7b07c1a0594ac7 |

### Source unit

```text
Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.
```

### Target unit

```text
Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.
```

### Unified diff

```diff
No text difference.
```

## claim_4d07d73af27f68f9ee6b807edba9c10f

Source: docs/specs/work-state.md#unheaded-block-17

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-6

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_4d07d73af27f68f9ee6b807edba9c10f |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 4c38a75e22d4372a |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-6 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | The writer.id and writer.source intro is stated in both sources; the candidate keeps both texts under Writer Identity (this one verbatim, plus the io-contract paragraph), nothing dropped. |
| targetUnitDigest | 4c38a75e22d4372a55c06012cac31ed3 |

### Source unit

```text
`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:
```

### Target unit

```text
`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:
```

### Unified diff

```diff
No text difference.
```

## claim_44f0caaa1a43f739279c7ae528de786a

Source: docs/specs/work-state.md#unheaded-block-18

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-9

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_44f0caaa1a43f739279c7ae528de786a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | b3d95b30cc6cd2a1 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-9 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | The four-value source trust table is stated in both sources; candidate carries the work-state wording (longer) and the io-contract list under one heading. |
| targetUnitDigest | b3d95b30cc6cd2a1b0bb6bd8bec47976 |

### Source unit

```text
| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |
```

### Target unit

```text
| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |
```

### Unified diff

```diff
No text difference.
```

## claim_a07b191015c5200e7934215d59875aa0

Source: docs/specs/work-state.md#unheaded-block-19

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-11

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a07b191015c5200e7934215d59875aa0 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 882fdc920bae5cb9 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-11 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Registry-only-correlates rule is only in work-state.md, carried verbatim into Writer Resolution Rules; no io-contract duplicate was found by grep. |
| targetUnitDigest | 882fdc920bae5cb93953dd540d22527c |

### Source unit

```text
**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").
```

### Target unit

```text
**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").
```

### Unified diff

```diff
No text difference.
```

## claim_642c9f33b6f971fbe68ee92bbf3f7be9

Source: docs/specs/work-state.md#unheaded-block-20

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-12

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_642c9f33b6f971fbe68ee92bbf3f7be9 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2d77bba4c7bc7482 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-12 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Malformed id rejection and latest-wins fold rule exist only in work-state.md; carried verbatim into the contract block (candidate lines 93-100). |
| targetUnitDigest | 2d77bba4c7bc7482c07dae5e2af85f29 |

### Source unit

```text
Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### Target unit

```text
Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### Unified diff

```diff
No text difference.
```

## claim_270cbd193260c5730c24a2c8cbbf21b6

Source: docs/specs/work-state.md#bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout

Target: docs/platform/work-state/spec.md#close-lesson-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_270cbd193260c5730c24a2c8cbbf21b6 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 8568529f121205ac |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | close-lesson-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 close lesson record becomes the H3 "Close Lesson Record"; only the title differs. |
| targetUnitDigest | f2388cf0fece03b5c1935ada5691f17b |

### Source unit

```text
### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)

Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |

Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.

Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.
```

### Target unit

```text
### Close Lesson Record

Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |

Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.

Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout"
+++ "docs/platform/work-state/spec.md#close-lesson-record"
@@ -1,4 +1,4 @@
-### Bài học lúc đóng — câu-6 tự động (Phase 3 S3-closeout)
+### Close Lesson Record
 
 Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
 `doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
```

## claim_93255b1a693bc8ecf8b8c2a3f4142d23

Source: docs/specs/work-state.md#unheaded-block-21

Target: docs/platform/work-state/spec.md#unheaded-block-17

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_93255b1a693bc8ecf8b8c2a3f4142d23 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ed3f6a8a9333f6cb |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-17 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph on the lesson record generated when an item reaches done through any entry is carried verbatim. |
| targetUnitDigest | ed3f6a8a9333f6cbfdb1187f55a82008 |

### Source unit

```text
Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).
```

### Target unit

```text
Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).
```

### Unified diff

```diff
No text difference.
```

## claim_a26454c04b35c87528dd999234ba8454

Source: docs/specs/work-state.md#unheaded-block-22

Target: docs/platform/work-state/spec.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a26454c04b35c87528dd999234ba8454 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 0681984fac4769d4 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-18 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The L-row lesson field table is carried verbatim; line-set match confirms block 18 (lines 177-181), not the locator hint of block 10. |
| targetUnitDigest | 0681984fac4769d49011b503c68adca7 |

### Source unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |
```

### Target unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |
```

### Unified diff

```diff
No text difference.
```

## claim_bf6de92ca9b78df2593568bab051a27f

Source: docs/specs/work-state.md#unheaded-block-23

Target: docs/platform/work-state/spec.md#unheaded-block-19

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_bf6de92ca9b78df2593568bab051a27f |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e3a661dc407ab6eb |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-19 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Minimal-but-real lesson for items closed with no prior outcome/friction/settlement is carried verbatim. |
| targetUnitDigest | e3a661dc407ab6ebaf346d91bd15be94 |

### Source unit

```text
Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.
```

### Target unit

```text
Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.
```

### Unified diff

```diff
No text difference.
```

## claim_075dc0205dabeaa5646879d220249ce1

Source: docs/specs/work-state.md#unheaded-block-24

Target: docs/platform/work-state/spec.md#unheaded-block-20

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_075dc0205dabeaa5646879d220249ce1 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 99b20d7c04511246 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-20 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule for items that never closed (no lesson record) is carried verbatim. |
| targetUnitDigest | 99b20d7c045112465b1d253548fc4859 |

### Source unit

```text
Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.
```

### Target unit

```text
Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.
```

### Unified diff

```diff
No text difference.
```

## claim_e9322d0e436e48b5d231ccd1b8bd441d

Source: docs/specs/work-state.md#bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc

Target: docs/platform/work-state/spec.md#human-gate-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e9322d0e436e48b5d231ccd1b8bd441d |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2961cc00969bd31a |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | human-gate-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 human gate record becomes the H3 "Human Gate Record"; only the title differs. |
| targetUnitDigest | 2904ab915782c373f2b068423862e8bb |

### Source unit

```text
### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc

Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |

Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).
```

### Target unit

```text
### Human Gate Record

Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.

| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |

Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc"
+++ "docs/platform/work-state/spec.md#human-gate-record"
@@ -1,4 +1,4 @@
-### Bản ghi cổng-người (gate) — câu hỏi / câu trả lời / ảnh chụp gốc
+### Human Gate Record
 
 Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
 chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
```

## claim_e9dddaee950b4f57b89587a1087c3ed1

Source: docs/specs/work-state.md#unheaded-block-25

Target: docs/platform/work-state/spec.md#unheaded-block-21

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e9dddaee950b4f57b89587a1087c3ed1 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 3f166793a6f5bfa2 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-21 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Intro on the gate record carried by items that passed a human-wait gate is carried verbatim. |
| targetUnitDigest | 3f166793a6f5bfa2554d671367e7edd5 |

### Source unit

```text
Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.
```

### Target unit

```text
Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.
```

### Unified diff

```diff
No text difference.
```

## claim_0735ed9860115c04597c2ce9dab4dbfc

Source: docs/specs/work-state.md#unheaded-block-26

Target: docs/platform/work-state/spec.md#unheaded-block-22

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0735ed9860115c04597c2ce9dab4dbfc |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 896856e1509a8492 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-22 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The G-row gate field table is carried verbatim; line-set match gives block 22 (lines 199-204), not the locator hint of block 7. |
| targetUnitDigest | 896856e1509a84929acc35bbf336ab20 |

### Source unit

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```

### Target unit

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status CHÍNH item ngay trước khi vào chờ (`todo` hay `doing`) — mốc `answer` đọc lại để biết resume về đâu (claim-lock §5.1: một claim `doing` đang giữ lúc hỏi phải resume về `doing`, không rớt xuống `todo` trần); KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```

### Unified diff

```diff
No text difference.
```

## claim_fefa9cbccf0ff78f6ab65866bf0419a0

Source: docs/specs/work-state.md#unheaded-block-27

Target: docs/platform/work-state/spec.md#unheaded-block-23

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fefa9cbccf0ff78f6ab65866bf0419a0 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 809b90b8be2eb5c5 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-23 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule and note for items that never entered a human-wait gate is carried verbatim. |
| targetUnitDigest | 809b90b8be2eb5c55bb312e2db97291c |

### Source unit

```text
Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).
```

### Target unit

```text
Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).
```

### Unified diff

```diff
No text difference.
```

## claim_eb9f287c141e9c763699b81d466f8561

Source: docs/specs/work-state.md#work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ

Target: docs/platform/work-state/spec.md#workflow-step-replaces-stage

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_eb9f287c141e9c763699b81d466f8561 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 1a2872c3adf3b233 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | workflow-step-replaces-stage |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 about work no longer carrying stage becomes "Workflow Step Replaces Stage"; title changed. |
| targetUnitDigest | 4b198e448003e829b23d32152cf3d518 |

### Source unit

```text
### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)

Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
operation mỗi bước cho phép, `transitions` hợp lệ, `aliases` tên cũ, `statusSkills`)
nằm trong định nghĩa Workflow (`domains/<domain>/workflows/*.yaml`,
`src/workflow/definition.mjs`), đọc qua `src/state/domain-registry.mjs`. Dispatch
không tra bước nào cả: tầng Work tra operation/skill/executor của bước rồi TRUYỀN
vào (xem spec Runner).

Phiên bản view: `VIEW_SCHEMA_VERSION` = 4 (view không còn `stage`). Snapshot cũ lệch
phiên bản → fold lại từ đầu log; reader Rust (`packages/work-state/rust`) chỉ đọc đúng
phiên bản 4 và bỏ qua view cũ.

**MỘT đường đọc dữ liệu cũ** (`src/state/replay.mjs`, `foldLegacyStage`/`canonicalStep`):
sự kiện `work.add`/`work.edit` mang `stage`, và sự kiện `work.stage` (một binary cũ ở
project khác vẫn có thể ghi) đều được đọc thành `workflowStep`; tên bước cũ `decompose`
đọc thành `planning` qua `aliases` của Workflow. Cửa ghi từ chối `stage` (`work.stage is
retired`). Sự kiện mới ghi là `work.step`.

Tên đã đổi trên bề mặt: field `workflowStep` (thay `stage`), `workflowStepEffective`
(thay `stageEffective`), `stepByItem` (thay `stageByItem`), `fgos add --step`,
`fgos ready --phase clarify|plan|execute` (thay `--step Clarify|Divide|Execute`),
`fgos workflow operations --step`, kiểm doctor `work-step-vocabulary`.
```

### Target unit

```text
### Workflow Step Replaces Stage

Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
operation mỗi bước cho phép, `transitions` hợp lệ, `aliases` tên cũ, `statusSkills`)
nằm trong định nghĩa Workflow (`domains/<domain>/workflows/*.yaml`,
`src/workflow/definition.mjs`), đọc qua `src/state/domain-registry.mjs`. Dispatch
không tra bước nào cả: tầng Work tra operation/skill/executor của bước rồi TRUYỀN
vào (xem spec Runner).

Phiên bản view: `VIEW_SCHEMA_VERSION` = 4 (view không còn `stage`). Snapshot cũ lệch
phiên bản → fold lại từ đầu log; reader Rust (`packages/work-state/rust`) chỉ đọc đúng
phiên bản 4 và bỏ qua view cũ.

**MỘT đường đọc dữ liệu cũ** (`src/state/replay.mjs`, `foldLegacyStage`/`canonicalStep`):
sự kiện `work.add`/`work.edit` mang `stage`, và sự kiện `work.stage` (một binary cũ ở
project khác vẫn có thể ghi) đều được đọc thành `workflowStep`; tên bước cũ `decompose`
đọc thành `planning` qua `aliases` của Workflow. Cửa ghi từ chối `stage` (`work.stage is
retired`). Sự kiện mới ghi là `work.step`.

Tên đã đổi trên bề mặt: field `workflowStep` (thay `stage`), `workflowStepEffective`
(thay `stageEffective`), `stepByItem` (thay `stageByItem`), `fgos add --step`,
`fgos ready --phase clarify|plan|execute` (thay `--step Clarify|Divide|Execute`),
`fgos workflow operations --step`, kiểm doctor `work-step-vocabulary`.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ"
+++ "docs/platform/work-state/spec.md#workflow-step-replaces-stage"
@@ -1,4 +1,4 @@
-### Work không còn `stage` — bước đến từ Workflow (đường đọc dữ liệu cũ)
+### Workflow Step Replaces Stage
 
 Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
 của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
```

## claim_04a1bb7bd0c04178542bfa2a14329e4d

Source: docs/specs/work-state.md#unheaded-block-28

Target: docs/platform/work-state/spec.md#unheaded-block-28

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_04a1bb7bd0c04178542bfa2a14329e4d |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 4c51cdea46faa785 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-28 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that an item carries workflowStep rather than stage is carried verbatim. |
| targetUnitDigest | 4c51cdea46faa78544375c980fc34c07 |

### Source unit

```text
Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
operation mỗi bước cho phép, `transitions` hợp lệ, `aliases` tên cũ, `statusSkills`)
nằm trong định nghĩa Workflow (`domains/<domain>/workflows/*.yaml`,
`src/workflow/definition.mjs`), đọc qua `src/state/domain-registry.mjs`. Dispatch
không tra bước nào cả: tầng Work tra operation/skill/executor của bước rồi TRUYỀN
vào (xem spec Runner).
```

### Target unit

```text
Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
operation mỗi bước cho phép, `transitions` hợp lệ, `aliases` tên cũ, `statusSkills`)
nằm trong định nghĩa Workflow (`domains/<domain>/workflows/*.yaml`,
`src/workflow/definition.mjs`), đọc qua `src/state/domain-registry.mjs`. Dispatch
không tra bước nào cả: tầng Work tra operation/skill/executor của bước rồi TRUYỀN
vào (xem spec Runner).
```

### Unified diff

```diff
No text difference.
```

## claim_cac64e9c719a1d145d2fcf014695434a

Source: docs/specs/work-state.md#unheaded-block-29

Target: docs/platform/work-state/spec.md#unheaded-block-29

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_cac64e9c719a1d145d2fcf014695434a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 332cc03c0827f2cb |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-29 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | VIEW\_SCHEMA\_VERSION = 4 note (no stage in the view, old snapshots refolded) is carried verbatim. |
| targetUnitDigest | 332cc03c0827f2cbfab57ea56e59828a |

### Source unit

```text
Phiên bản view: `VIEW_SCHEMA_VERSION` = 4 (view không còn `stage`). Snapshot cũ lệch
phiên bản → fold lại từ đầu log; reader Rust (`packages/work-state/rust`) chỉ đọc đúng
phiên bản 4 và bỏ qua view cũ.
```

### Target unit

```text
Phiên bản view: `VIEW_SCHEMA_VERSION` = 4 (view không còn `stage`). Snapshot cũ lệch
phiên bản → fold lại từ đầu log; reader Rust (`packages/work-state/rust`) chỉ đọc đúng
phiên bản 4 và bỏ qua view cũ.
```

### Unified diff

```diff
No text difference.
```

## claim_b5dc9a45ef1f87d4eb34401d878d9aae

Source: docs/specs/work-state.md#unheaded-block-30

Target: docs/platform/work-state/spec.md#unheaded-block-30

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b5dc9a45ef1f87d4eb34401d878d9aae |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 509d6750254a6802 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-30 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The single legacy read path (replay.mjs foldLegacyStage/canonicalStep) paragraph is carried verbatim. |
| targetUnitDigest | 509d6750254a6802e862d838af1177d1 |

### Source unit

```text
**MỘT đường đọc dữ liệu cũ** (`src/state/replay.mjs`, `foldLegacyStage`/`canonicalStep`):
sự kiện `work.add`/`work.edit` mang `stage`, và sự kiện `work.stage` (một binary cũ ở
project khác vẫn có thể ghi) đều được đọc thành `workflowStep`; tên bước cũ `decompose`
đọc thành `planning` qua `aliases` của Workflow. Cửa ghi từ chối `stage` (`work.stage is
retired`). Sự kiện mới ghi là `work.step`.
```

### Target unit

```text
**MỘT đường đọc dữ liệu cũ** (`src/state/replay.mjs`, `foldLegacyStage`/`canonicalStep`):
sự kiện `work.add`/`work.edit` mang `stage`, và sự kiện `work.stage` (một binary cũ ở
project khác vẫn có thể ghi) đều được đọc thành `workflowStep`; tên bước cũ `decompose`
đọc thành `planning` qua `aliases` của Workflow. Cửa ghi từ chối `stage` (`work.stage is
retired`). Sự kiện mới ghi là `work.step`.
```

### Unified diff

```diff
No text difference.
```

## claim_337c33a9b9d06d358bee210ba002a8df

Source: docs/specs/work-state.md#unheaded-block-31

Target: docs/platform/work-state/spec.md#unheaded-block-31

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_337c33a9b9d06d358bee210ba002a8df |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 26c7bc289872ab33 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-31 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Rename list (workflowStep, workflowStepEffective, stepByItem) is carried verbatim. |
| targetUnitDigest | 26c7bc289872ab33201af4b02bb9b649 |

### Source unit

```text
Tên đã đổi trên bề mặt: field `workflowStep` (thay `stage`), `workflowStepEffective`
(thay `stageEffective`), `stepByItem` (thay `stageByItem`), `fgos add --step`,
`fgos ready --phase clarify|plan|execute` (thay `--step Clarify|Divide|Execute`),
`fgos workflow operations --step`, kiểm doctor `work-step-vocabulary`.
```

### Target unit

```text
Tên đã đổi trên bề mặt: field `workflowStep` (thay `stage`), `workflowStepEffective`
(thay `stageEffective`), `stepByItem` (thay `stageByItem`), `fgos add --step`,
`fgos ready --phase clarify|plan|execute` (thay `--step Clarify|Divide|Execute`),
`fgos workflow operations --step`, kiểm doctor `work-step-vocabulary`.
```

### Unified diff

```diff
No text difference.
```

## claim_0c44dd8aa02800039adbb9c39e5a11c7

Source: docs/specs/work-state.md#giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring

Target: docs/platform/work-state/spec.md#discovery-and-exploring-stages

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0c44dd8aa02800039adbb9c39e5a11c7 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 64d0a5ff2b07f4c1 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | discovery-and-exploring-stages |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 on the discovery and exploring stages becomes "Discovery And Exploring Stages"; title changed. |
| targetUnitDigest | fd8dbb8574d07360d5c80574ef2031a6 |

### Source unit

```text
### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)

Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.

**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-step-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.

Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.

- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.step` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.

**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).

**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).
```

### Target unit

```text
### Discovery And Exploring Stages

Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.

**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-step-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.

Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.

- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.step` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.

**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).

**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring"
+++ "docs/platform/work-state/spec.md#discovery-and-exploring-stages"
@@ -1,4 +1,4 @@
-### Giai đoạn Soi-rõ (bước discovery) và Đào-sâu (bước exploring)
+### Discovery And Exploring Stages
 
 Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
 — trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
```

## claim_87c97f553a4be174e760b6ac1d2b37ea

Source: docs/specs/work-state.md#unheaded-block-32

Target: docs/platform/work-state/spec.md#unheaded-block-32

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_87c97f553a4be174e760b6ac1d2b37ea |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 3ef0991bbca1a01f |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-32 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph on workflowStep running alongside status is carried verbatim. |
| targetUnitDigest | 3ef0991bbca1a01f425854ee2163524c |

### Source unit

```text
Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.
```

### Target unit

```text
Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.
```

### Unified diff

```diff
No text difference.
```

## claim_f264a15a6f892e76499a4c229b253533

Source: docs/specs/work-state.md#unheaded-block-33

Target: docs/platform/work-state/spec.md#unheaded-block-33

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f264a15a6f892e76499a4c229b253533 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 023a0fbc2a4e4f7f |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-33 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that clarify is no longer a stage (clarify now at Init) is carried verbatim. |
| targetUnitDigest | 023a0fbc2a4e4f7fb07374d8652f2cc3 |

### Source unit

```text
**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-step-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.
```

### Target unit

```text
**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-step-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.
```

### Unified diff

```diff
No text difference.
```

## claim_eabba66d92b6698280157a68ce6db216

Source: docs/specs/work-state.md#unheaded-block-34

Target: docs/platform/work-state/spec.md#unheaded-block-34

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_eabba66d92b6698280157a68ce6db216 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 58e2979350417bb9 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-34 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Context-discovery paragraph for items entering discovery is carried verbatim. |
| targetUnitDigest | 58e2979350417bb923ddde74629df8f6 |

### Source unit

```text
Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.
```

### Target unit

```text
Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.
```

### Unified diff

```diff
No text difference.
```

## claim_e16f4959b70560b663e9a81c3c5556b4

Source: docs/specs/work-state.md#unheaded-block-35

Target: docs/platform/work-state/spec.md#unheaded-block-35

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e16f4959b70560b663e9a81c3c5556b4 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e179ab994ffccea2 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-35 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Clear/unclear verdict bullets (discovery to planning or exploring) are carried verbatim. |
| targetUnitDigest | e179ab994ffccea20065605932a825cd |

### Source unit

```text
- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.step` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.
```

### Target unit

```text
- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.step` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.
```

### Unified diff

```diff
No text difference.
```

## claim_9aa212c8f3269e0c3e14cbfdec685caf

Source: docs/specs/work-state.md#unheaded-block-36

Target: docs/platform/work-state/spec.md#unheaded-block-36

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9aa212c8f3269e0c3e14cbfdec685caf |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 534a5eb27e492a38 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-36 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Discovery context (reads description and refs, STR30) paragraph is carried verbatim. |
| targetUnitDigest | 534a5eb27e492a380e76da117108b0c9 |

### Source unit

```text
**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).
```

### Target unit

```text
**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).
```

### Unified diff

```diff
No text difference.
```

## claim_e2caa35f52aff74de3e25b4a30ea81cd

Source: docs/specs/work-state.md#unheaded-block-37

Target: docs/platform/work-state/spec.md#unheaded-block-37

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_e2caa35f52aff74de3e25b4a30ea81cd |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | f19a83a8922ba1a5 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-37 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Who runs context-discovery and when (two call points) is carried verbatim. |
| targetUnitDigest | f19a83a8922ba1a536d6698b742a5836 |

### Source unit

```text
**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).
```

### Target unit

```text
**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).
```

### Unified diff

```diff
No text difference.
```

## claim_8ddaf275a9286c13d4d7b21c67477ef4

Source: docs/specs/work-state.md#bản-ghi-cổng-discovery

Target: docs/platform/work-state/spec.md#discovery-gate-record

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8ddaf275a9286c13d4d7b21c67477ef4 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 59597f01695814b2 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | discovery-gate-record |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 discovery gate record becomes "Discovery Gate Record"; title changed. |
| targetUnitDigest | b54621bc3c29c78c30db728bd1946889 |

### Source unit

```text
### Bản ghi cổng discovery

Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |

Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).
```

### Target unit

```text
### Discovery Gate Record

Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.

| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |

Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#bản-ghi-cổng-discovery"
+++ "docs/platform/work-state/spec.md#discovery-gate-record"
@@ -1,4 +1,4 @@
-### Bản ghi cổng discovery
+### Discovery Gate Record
 
 Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
 discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
```

## claim_7553a4868205098ba82d4c03382acce2

Source: docs/specs/work-state.md#unheaded-block-38

Target: docs/platform/work-state/spec.md#unheaded-block-24

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_7553a4868205098ba82d4c03382acce2 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 5c9201d70578877a |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-24 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph that every context-discovery pass writes a discovery record is carried verbatim; block lies under Discovery Gate Record (candidate lines 216-221). |
| targetUnitDigest | 5c9201d70578877abf44602c087ab21d |

### Source unit

```text
Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.
```

### Target unit

```text
Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.
```

### Unified diff

```diff
No text difference.
```

## claim_d0ae088797942a95c43f0ca52517d9bc

Source: docs/specs/work-state.md#unheaded-block-39

Target: docs/platform/work-state/spec.md#unheaded-block-25

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d0ae088797942a95c43f0ca52517d9bc |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 4f6b857125193bca |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-25 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The C-row discovery field table is carried verbatim; line-set match gives block 25 (lines 223-227), not the locator hint of block 10. |
| targetUnitDigest | 4f6b857125193bca6a36ed7697dfb8ee |

### Source unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |
```

### Target unit

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |
```

### Unified diff

```diff
No text difference.
```

## claim_a87d58b31ca7cf73cb343cadbde4b654

Source: docs/specs/work-state.md#unheaded-block-40

Target: docs/platform/work-state/spec.md#unheaded-block-26

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a87d58b31ca7cf73cb343cadbde4b654 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | a8677c227421e6f9 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-26 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule for items with no discovery pass is carried verbatim. |
| targetUnitDigest | a8677c227421e6f9687f292d21ccebfb |

### Source unit

```text
Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).
```

### Target unit

```text
Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
No text difference.
```

## claim_44e9aa951025f9b7e71066c325ec7df1

Source: docs/specs/work-state.md#giai-đoạn-lập-kế-hoạch-stage-planning

Target: docs/platform/work-state/spec.md#planning-stage

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_44e9aa951025f9b7e71066c325ec7df1 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e9ddd76efbdba56b |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | planning-stage |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 on the planning stage becomes "Planning Stage"; title changed. |
| targetUnitDigest | ad4b3ce7e44af669b6d5a850c82c1127 |

### Source unit

```text
### Giai đoạn Lập-kế-hoạch (stage planning)

Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.

**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.

Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.

- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.

**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.

**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.

Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).
```

### Target unit

```text
### Planning Stage

Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.

**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.

Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.

- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.

**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.

**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.

Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#giai-đoạn-lập-kế-hoạch-stage-planning"
+++ "docs/platform/work-state/spec.md#planning-stage"
@@ -1,4 +1,4 @@
-### Giai đoạn Lập-kế-hoạch (stage planning)
+### Planning Stage
 
 Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
 `exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
```

## claim_2bd0e21953de64329d9feda590cd9ed0

Source: docs/specs/work-state.md#unheaded-block-41

Target: docs/platform/work-state/spec.md#unheaded-block-38

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2bd0e21953de64329d9feda590cd9ed0 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e2481ec8c1277897 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-38 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that every item leaving discovery meets at planning is carried verbatim. |
| targetUnitDigest | e2481ec8c127789704ae95a8a010c633 |

### Source unit

```text
Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.
```

### Target unit

```text
Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.
```

### Unified diff

```diff
No text difference.
```

## claim_05086f8eb3a7fe8c76475c68250251ce

Source: docs/specs/work-state.md#unheaded-block-42

Target: docs/platform/work-state/spec.md#unheaded-block-39

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_05086f8eb3a7fe8c76475c68250251ce |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | fadda0c2061d00de |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-39 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | decompose as a drain-only legacy alias paragraph is carried verbatim. |
| targetUnitDigest | fadda0c2061d00de158fb62f8d16aba1 |

### Source unit

```text
**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.
```

### Target unit

```text
**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.
```

### Unified diff

```diff
No text difference.
```

## claim_279762092baa449be7ad373bf71de87e

Source: docs/specs/work-state.md#unheaded-block-43

Target: docs/platform/work-state/spec.md#unheaded-block-40

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_279762092baa449be7ad373bf71de87e |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | b92d70625fb3063d |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-40 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Decomposition judgment on items entering planning is carried verbatim. |
| targetUnitDigest | b92d70625fb3063d776322ca266f0138 |

### Source unit

```text
Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.
```

### Target unit

```text
Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.
```

### Unified diff

```diff
No text difference.
```

## claim_3bc58175c497e265863a431437a26a14

Source: docs/specs/work-state.md#unheaded-block-44

Target: docs/platform/work-state/spec.md#unheaded-block-41

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3bc58175c497e265863a431437a26a14 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 6fd1889b01d12af0 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-41 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Pass-through and split outcomes of the planning judgment (31 lines) are carried verbatim. |
| targetUnitDigest | 6fd1889b01d12af05ea88205763f14af |

### Source unit

```text
- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.
```

### Target unit

```text
- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.
```

### Unified diff

```diff
No text difference.
```

## claim_d151153b93496051a7f37890910a941f

Source: docs/specs/work-state.md#unheaded-block-45

Target: docs/platform/work-state/spec.md#unheaded-block-42

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d151153b93496051a7f37890910a941f |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 86cba6c33b5a8fe9 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-42 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Who runs the decomposition judgment and when (fgos plan, sync mode) is carried verbatim. |
| targetUnitDigest | 86cba6c33b5a8fe95261ed07c3e670db |

### Source unit

```text
**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.
```

### Target unit

```text
**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.
```

### Unified diff

```diff
No text difference.
```

## claim_0fb104a786e5dd82b98f0d9c61a4dc30

Source: docs/specs/work-state.md#unheaded-block-46

Target: docs/platform/work-state/spec.md#unheaded-block-43

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_0fb104a786e5dd82b98f0d9c61a4dc30 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 86aefb98f6caa2bf |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-43 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Lineage (parent) versus deps paragraph is carried verbatim. |
| targetUnitDigest | 86aefb98f6caa2bf4768e5d81ec4fdf6 |

### Source unit

```text
**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.
```

### Target unit

```text
**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.
```

### Unified diff

```diff
No text difference.
```

## claim_606f88cc7605c316e1b735724ed595f9

Source: docs/specs/work-state.md#unheaded-block-47

Target: docs/platform/work-state/spec.md#unheaded-block-44

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_606f88cc7605c316e1b735724ed595f9 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ffb0d2ad1ac7bdf6 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-44 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Absence rule for items without a parent is carried verbatim. |
| targetUnitDigest | ffb0d2ad1ac7bdf66ed226440e16fe3d |

### Source unit

```text
Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).
```

### Target unit

```text
Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).
```

### Unified diff

```diff
No text difference.
```

## claim_79b8aa6e1e59ca0593c2e3f1a409a459

Source: docs/specs/work-state.md#mô-hình-domain-base-workflow-domain-extension

Target: docs/platform/work-state/spec.md#6-domain-model

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_79b8aa6e1e59ca0593c2e3f1a409a459 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | a90d38d0af33deb5 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | 6-domain-model |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 domain model becomes the numbered H2 "6. Domain Model"; level and title changed, same scope. |
| targetUnitDigest | 4b12f710732bcb366502200ee43245c3 |

### Source unit

```text
### Mô hình domain (base-workflow + domain-extension)

Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.

Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:

- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.

Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).

**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.

Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.

Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.

**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.

Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.

Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).
```

### Target unit

```text
## 6. Domain Model

Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.

Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:

- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.

Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).

**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.

Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.

Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.

**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.

Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.

Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#mô-hình-domain-base-workflow-domain-extension"
+++ "docs/platform/work-state/spec.md#6-domain-model"
@@ -1,4 +1,4 @@
-### Mô hình domain (base-workflow + domain-extension)
+## 6. Domain Model
 
 Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
 `planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
```

## claim_da3d8025b23815d0c6645830b5cb9ff8

Source: docs/specs/work-state.md#unheaded-block-48

Target: docs/platform/work-state/spec.md#unheaded-block-45

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_da3d8025b23815d0c6645830b5cb9ff8 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | feed8c8b2f035f91 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-45 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Domain model opening (base-workflow plus domain extension, 16 lines) is carried verbatim. |
| targetUnitDigest | feed8c8b2f035f912247b8dfe19899b6 |

### Source unit

```text
Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.
```

### Target unit

```text
Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.
```

### Unified diff

```diff
No text difference.
```

## claim_a15768b48d9cf3023d96e63365674b27

Source: docs/specs/work-state.md#unheaded-block-49

Target: docs/platform/work-state/spec.md#unheaded-block-46

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a15768b48d9cf3023d96e63365674b27 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ff1cf9a54d7cc40a |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-46 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that the registry has four domains and coding is the only production one is carried verbatim. |
| targetUnitDigest | ff1cf9a54d7cc40a4006675ccdb21f00 |

### Source unit

```text
Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:
```

### Target unit

```text
Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:
```

### Unified diff

```diff
No text difference.
```

## claim_726c1f9d57c58c41a038e7f8150d23bb

Source: docs/specs/work-state.md#unheaded-block-50

Target: docs/platform/work-state/spec.md#unheaded-block-47

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_726c1f9d57c58c41a038e7f8150d23bb |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | bce9d9e284ba2841 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-47 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Per-domain stage bullets (synthetic and others) are carried verbatim. |
| targetUnitDigest | bce9d9e284ba2841c098c5258894d6fd |

### Source unit

```text
- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.
```

### Target unit

```text
- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.
```

### Unified diff

```diff
No text difference.
```

## claim_8dd85ee8dcda8f6914207ed85be88040

Source: docs/specs/work-state.md#unheaded-block-51

Target: docs/platform/work-state/spec.md#unheaded-block-48

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_8dd85ee8dcda8f6914207ed85be88040 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | b4fd3392f55abbea |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-48 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that all four dispatch through one registry and one execution path is carried verbatim. |
| targetUnitDigest | b4fd3392f55abbeae560ec53ebb763fd |

### Source unit

```text
Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).
```

### Target unit

```text
Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).
```

### Unified diff

```diff
No text difference.
```

## claim_419ab4fb5b449c511e9dfb616e074a8d

Source: docs/specs/work-state.md#unheaded-block-52

Target: docs/platform/work-state/spec.md#unheaded-block-49

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_419ab4fb5b449c511e9dfb616e074a8d |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2c3f5010803fe3d7 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-49 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | compound-learn is no longer a stage (it moved to status retrospective) paragraph is carried verbatim. |
| targetUnitDigest | 2c3f5010803fe3d713f8b30038cc78b8 |

### Source unit

```text
**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.
```

### Target unit

```text
**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.
```

### Unified diff

```diff
No text difference.
```

## claim_843ed209b05a1ea29568bfa9215da324

Source: docs/specs/work-state.md#unheaded-block-53

Target: docs/platform/work-state/spec.md#unheaded-block-50

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_843ed209b05a1ea29568bfa9215da324 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 80c14ec598a82f09 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-50 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Domain skills layer (str89) paragraph reading the domain field is carried verbatim. |
| targetUnitDigest | 80c14ec598a82f09f8da9596853c9e1c |

### Source unit

```text
Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.
```

### Target unit

```text
Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.
```

### Unified diff

```diff
No text difference.
```

## claim_a1109777c368dc5834c63a5934b8fd69

Source: docs/specs/work-state.md#unheaded-block-54

Target: docs/platform/work-state/spec.md#unheaded-block-51

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a1109777c368dc5834c63a5934b8fd69 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | b0d658bc1e149399 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-51 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | The retrospective status key in the same table is carried verbatim. |
| targetUnitDigest | b0d658bc1e1493990ff4c2e5d0a83aaa |

### Source unit

```text
Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.
```

### Target unit

```text
Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.
```

### Unified diff

```diff
No text difference.
```

## claim_5390e705c15f6a42a817fe0329064073

Source: docs/specs/work-state.md#unheaded-block-55

Target: docs/platform/work-state/spec.md#unheaded-block-52

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5390e705c15f6a42a817fe0329064073 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 621c91d31cc07f4e |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-52 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | A domain need not satisfy all 5 base-workflow steps; consequence paragraph carried verbatim. |
| targetUnitDigest | 621c91d31cc07f4e090993c8b83d5b3f |

### Source unit

```text
**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.
```

### Target unit

```text
**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.
```

### Unified diff

```diff
No text difference.
```

## claim_9432efe67b01c2c7e33c093ec71102e1

Source: docs/specs/work-state.md#unheaded-block-56

Target: docs/platform/work-state/spec.md#unheaded-block-53

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9432efe67b01c2c7e33c093ec71102e1 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | ad648524d48fcbd3 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-53 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Narrowed-limit paragraph (the two engines no longer fixed to stage names) is carried verbatim. |
| targetUnitDigest | ad648524d48fcbd3683cb44c82929a17 |

### Source unit

```text
Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.
```

### Target unit

```text
Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.
```

### Unified diff

```diff
No text difference.
```

## claim_5430b3f4676f8ecc0c94b8f0680f45c6

Source: docs/specs/work-state.md#unheaded-block-57

Target: docs/platform/work-state/spec.md#unheaded-block-54

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5430b3f4676f8ecc0c94b8f0680f45c6 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | fcc3b5bc63c02eeb |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-54 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Lazy default coding for items without a domain field is carried verbatim. |
| targetUnitDigest | fcc3b5bc63c02eeb3180877c80fe6e2d |

### Source unit

```text
Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).
```

### Target unit

```text
Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).
```

### Unified diff

```diff
No text difference.
```

## claim_34205657a84c4f1e6610db2ea48aecde

Source: docs/specs/work-state.md#cửa-pull-giaonhận-việc-takereturn

Target: docs/platform/work-state/spec.md#7-pull-door-take-and-return

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_34205657a84c4f1e6610db2ea48aecde |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | a5dd45a68b5d8603 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | 7-pull-door-take-and-return |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 pull door becomes the numbered H2 "7. Pull Door Take And Return"; level and title changed. |
| targetUnitDigest | 69eb01f3f5134b71523424d41de4c6e5 |

### Source unit

```text
### Cửa pull giao–nhận việc (take/return)

Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.

- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.

`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
```

### Target unit

```text
## 7. Pull Door Take And Return

Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.

- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.

`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#cửa-pull-giaonhận-việc-takereturn"
+++ "docs/platform/work-state/spec.md#7-pull-door-take-and-return"
@@ -1,4 +1,4 @@
-### Cửa pull giao–nhận việc (take/return)
+## 7. Pull Door Take And Return
 
 Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
 **cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
```

## claim_be95c2d548d7fa5a1d2406be5584a36a

Source: docs/specs/work-state.md#unheaded-block-58

Target: docs/platform/work-state/spec.md#unheaded-block-55

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_be95c2d548d7fa5a1d2406be5584a36a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 4b215c2fd35cfdf4 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-55 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Opening paragraph defining the pull door alongside the runner is carried verbatim. |
| targetUnitDigest | 4b215c2fd35cfdf4e6786cf9adbb44f0 |

### Source unit

```text
Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.
```

### Target unit

```text
Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.
```

### Unified diff

```diff
No text difference.
```

## claim_d3260e19b2405cb88b80137d2765db86

Source: docs/specs/work-state.md#unheaded-block-59

Target: docs/platform/work-state/spec.md#unheaded-block-56

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d3260e19b2405cb88b80137d2765db86 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | e56d40369e1c3ef2 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-56 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | take/return verb bullets (33 lines) are carried verbatim. |
| targetUnitDigest | e56d40369e1c3ef2d969b256915fe94a |

### Source unit

```text
- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.
```

### Target unit

```text
- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.
```

### Unified diff

```diff
No text difference.
```

## claim_f6857f25bdb3f59d3afcd03e2089ed74

Source: docs/specs/work-state.md#unheaded-block-60

Target: docs/platform/work-state/spec.md#unheaded-block-57

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f6857f25bdb3f59d3afcd03e2089ed74 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | b6f12056369ca7e5 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-57 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Statement that return only completes a take is carried verbatim. |
| targetUnitDigest | b6f12056369ca7e5650f2f58f585a9df |

### Source unit

```text
`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
```

### Target unit

```text
`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
```

### Unified diff

```diff
No text difference.
```

## claim_d2b3576164c7a12b25979e8dfb68d7b5

Source: docs/specs/work-state.md#cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ

Target: docs/platform/work-state/spec.md#branch-proposal-completion

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_d2b3576164c7a12b25979e8dfb68d7b5 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 22ca034a916c92fe |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | branch-proposal-completion |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H4 on completing a parked branch proposal becomes the H3 "Branch Proposal Completion"; level and title changed. |
| targetUnitDigest | 7949ca542ba953e6f041b76bd0440493 |

### Source unit

```text
#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ

Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:

- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.
```

### Target unit

```text
### Branch Proposal Completion

Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:

- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.
```

### Unified diff

```diff
--- "docs/specs/work-state.md#cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ"
+++ "docs/platform/work-state/spec.md#branch-proposal-completion"
@@ -1,4 +1,4 @@
-#### Cửa pull mở rộng: hoàn tất một đề xuất nguồn-nhánh bị đỗ
+### Branch Proposal Completion
 
 Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
 chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
```

## claim_59a22b2c3443dfe4e6a316c584d885a8

Source: docs/specs/work-state.md#unheaded-block-61

Target: docs/platform/work-state/spec.md#unheaded-block-58

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_59a22b2c3443dfe4e6a316c584d885a8 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 169457cec66b3a78 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-58 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Paragraph on a blocked item carrying a live proposal branch fgw/\<id\> is carried verbatim. |
| targetUnitDigest | 169457cec66b3a789d636951cf5ce82e |

### Source unit

```text
Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:
```

### Target unit

```text
Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:
```

### Unified diff

```diff
No text difference.
```

## claim_f3ac7531969ff1ba2b8080d6fc83bd1a

Source: docs/specs/work-state.md#unheaded-block-62

Target: docs/platform/work-state/spec.md#unheaded-block-59

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f3ac7531969ff1ba2b8080d6fc83bd1a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 6bdca3cb587dc58c |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-59 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | take/return behavior bullets for blocked items with a live branch (28 lines) are carried verbatim. |
| targetUnitDigest | 6bdca3cb587dc58cb5388b2a2e34d929 |

### Source unit

```text
- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.
```

### Target unit

```text
- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.
```

### Unified diff

```diff
No text difference.
```

## claim_2b2aa99a73a8e330673e26d15ac171e3

Source: docs/specs/work-state.md#phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa

Target: docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_2b2aa99a73a8e330673e26d15ac171e3 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 69ec031b67cb5fcd |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | envelope-shape |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 envelope becomes "Envelope Shape" under the contract document (map section 4); title changed and the claim kind is contract, not specification. |
| targetUnitDigest | 66e458351046f7cb0b354aed583e73c7 |

### Source unit

```text
### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)

**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
```

### Target unit

````text
### Envelope Shape

**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.

Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:

```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```

`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
````

### Unified diff

````diff
--- "docs/specs/work-state.md#phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape"
@@ -1,4 +1,4 @@
-### Phong bì output (envelope) — chuẩn máy-đọc của MỌI verb (per D b2d18cc7, b0da87aa)
+### Envelope Shape
 
 **Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
 thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
@@ -12,13 +12,15 @@ verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết qu
 regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
 nào lọt lưới và không có hai cách in khác nhau.
 
-**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
-khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
-(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
-không phải bằng việc dò nội dung phong bì.
+Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
+`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
+`stdout`:
 
-**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
-mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
-dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
-thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
-Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
\ No newline at end of file
+```
+{ contract: 'fgos.v1', generated_at, data_hash, data }
+```
+
+`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
+người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
+trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
+bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
\ No newline at end of file
````

## claim_6dfbaa59a2f49bc668d9729fed01878a

Source: docs/specs/work-state.md#unheaded-block-63

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-14

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6dfbaa59a2f49bc668d9729fed01878a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 8b3e099723160029 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-14 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Four-field envelope description is stated in both sources; candidate carries the work-state block (this one) plus the io-contract block (lines 49-60 of io) under Envelope Shape, nothing dropped. |
| targetUnitDigest | 8b3e099723160029770c62469f14db6c |

### Source unit

```text
**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.
```

### Target unit

```text
**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.
```

### Unified diff

```diff
No text difference.
```

## claim_140216d27eb5609e8b5d51f718ecf493

Source: docs/specs/work-state.md#unheaded-block-64

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-18

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_140216d27eb5609e8b5d51f718ecf493 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 5d70ebc5bbf14b46 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-18 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Error path not enveloped (stderr, exit code) is carried verbatim as its own block under Error Path Is Not Enveloped; io-contract states the same claim inside its envelope unit, so it also exists elsewhere in that heading, but this block was not merged. |
| targetUnitDigest | 5d70ebc5bbf14b4604424fe9dc4e05c7 |

### Source unit

```text
**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

### Target unit

```text
**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

### Unified diff

```diff
No text difference.
```

## claim_52b54d49826d7ff8fd38f29925505f2a

Source: docs/specs/work-state.md#unheaded-block-65

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-19

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_52b54d49826d7ff8fd38f29925505f2a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 75bf5b6af00287e0 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-19 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Runner single-line envelope rule is stated in both sources; candidate carries both texts under Runner Stdout Envelope. |
| targetUnitDigest | 75bf5b6af00287e081d243556f44f8e1 |

### Source unit

```text
**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
```

### Target unit

```text
**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
```

### Unified diff

```diff
No text difference.
```

## claim_9c6c68acbcd413ec5d826804b07650c0

Source: docs/specs/work-state.md#sổ-verb-máy-đọc-manifest---help---json

Target: docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9c6c68acbcd413ec5d826804b07650c0 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 9dcfe09c6bf68c7b |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | manifest-shape |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 manifest becomes "Manifest Shape" in the contract document; title changed. |
| targetUnitDigest | f7201259d68259d70be0b14e5989837d |

### Source unit

```text
### Sổ verb máy-đọc (manifest) — `--help --json`

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.

**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### Target unit

```text
### Manifest Shape

CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).

`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### Unified diff

```diff
--- "docs/specs/work-state.md#sổ-verb-máy-đọc-manifest---help---json"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape"
@@ -1,4 +1,4 @@
-### Sổ verb máy-đọc (manifest) — `--help --json`
+### Manifest Shape
 
 CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
 máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
@@ -16,50 +16,7 @@ dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thà
 "required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
 nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
 
-**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
-đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
-lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
-PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
-fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
-(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
-`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
-`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
-cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
-phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
-(backlog STR38).
-
-**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
-scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
-MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
-`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
-verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
-truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
-dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
-`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
-fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
-đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
-`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
-`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
-`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
-thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
-theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
-`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
-đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
-hoàn toàn** —
-người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
-tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
-tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
-lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
-(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
-(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
-một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
-
-**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
-trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
-số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
-mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
-`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
-`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
-bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
-không có trường này.
\ No newline at end of file
+`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
+toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
+thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
+vì trường `access` bị xoá). Mỗi mục verb mang:
\ No newline at end of file
```

## claim_9959e82e2874baeb627a8441faa07e9a

Source: docs/specs/work-state.md#unheaded-block-66

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-29

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9959e82e2874baeb627a8441faa07e9a |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | a2e6a5ffa58ec1f1 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-29 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Manifest fields (schema\_version 2.0, commands) are stated in both sources; candidate carries both texts, the work-state one adds the positional-parameter rule. |
| targetUnitDigest | a2e6a5ffa58ec1f13d1321cf4b14d70b |

### Source unit

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

### Target unit

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

### Unified diff

```diff
No text difference.
```

## claim_ce947d10ed900598bde4df5b552e0265

Source: docs/specs/work-state.md#unheaded-block-67

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_ce947d10ed900598bde4df5b552e0265 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | c219ee825c3475e6 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-31 |
| claimKind | contract |
| disposition | supersede |
| reviewStatus | pending |
| rationale | Code is truth for both effect axes and the whole source field definition. Owner A15 resolves SC-1: the stale exclusive only-review-and-approve assertion is superseded by the current registry contract and a run example, not coordination. Actual --help --json exposes 15 externalEffect verbs including run and no coordination verb. The candidate preserves the source field definitions and corrects its obsolete enumeration; independent review of this changed binding is pending. |
| targetUnitDigest | 97e661532202da60735c985f4cda6302e805d100441b148cd8b0ff05c9c914b2 |

### Source unit

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

### Target unit

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#unheaded-block-67"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31"
@@ -4,8 +4,7 @@ lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó
 PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
 fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
 (verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
-có bao giờ gọi một dịch vụ ngoài fgOS hay không — hôm nay chỉ `review` và
-`approve` mang `externalEffect: true`, đúng chế độ `--github` của chúng;
+có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
 `review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
 cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
 phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
```

## claim_15a24dbb1f2d0470f04cdf8900da67a0

Source: docs/specs/work-state.md#unheaded-block-68

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_15a24dbb1f2d0470f04cdf8900da67a0 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2140755c1b59f62f |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-26 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | Cursor pagination superset (adds permanent list --all --json exception and side-log narrowing) is carried verbatim; the io-contract short text follows it in the same section, so both sources are present. |
| targetUnitDigest | 2140755c1b59f62f147ba030e77aa0c2 |

### Source unit

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

### Target unit

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

### Unified diff

```diff
No text difference.
```

## claim_5dcb56608e17caeb53c197186ae33827

Source: docs/specs/work-state.md#unheaded-block-69

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5dcb56608e17caeb53c197186ae33827 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 3964ac136b9bb85d |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-34 |
| claimKind | contract |
| disposition | merge |
| reviewStatus | pending |
| rationale | csv versus json-array multiValueFormat rule is stated in both sources; candidate carries both texts under the H2 8. |
| targetUnitDigest | 3964ac136b9bb85d72cec95fd1ff5748 |

### Source unit

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### Target unit

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

### Unified diff

```diff
No text difference.
```

## claim_522c26efde7ef029b3ce6e25829a8915

Source: docs/specs/work-state.md#trợ-giúp-theo-từng-verb-fgos---help

Target: docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_522c26efde7ef029b3ce6e25829a8915 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | aadcac783bf59267 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | 9-per-verb-help |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 per-verb help becomes the numbered H2 "9. Per-Verb Help" in the contract document; level and title changed. |
| targetUnitDigest | c57c03b28277a6a6bb5608ca73c026fa |

### Source unit

```text
### Trợ giúp theo từng verb — `fgos <verb> --help`

Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.

- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### Target unit

```text
## 9. Per-Verb Help

Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.

- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#trợ-giúp-theo-từng-verb-fgos---help"
+++ "docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help"
@@ -1,4 +1,4 @@
-### Trợ giúp theo từng verb — `fgos <verb> --help`
+## 9. Per-Verb Help
 
 Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
 --help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
```

## claim_f1eca3e6fcc3886007fa5de37d686e54

Source: docs/specs/work-state.md#unheaded-block-70

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-36

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_f1eca3e6fcc3886007fa5de37d686e54 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 49da8c71336ea054 |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-36 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Per-verb --help intro is carried verbatim into the contract document; only in work-state.md. |
| targetUnitDigest | 49da8c71336ea054dce887759a9eea0e |

### Source unit

```text
Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.
```

### Target unit

```text
Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.
```

### Unified diff

```diff
No text difference.
```

## claim_6fe86521fead9cec7253443e3275a3cf

Source: docs/specs/work-state.md#unheaded-block-71

Target: docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-37

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_6fe86521fead9cec7253443e3275a3cf |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | a1c9e2ebc2ba7e6a |
| targetOwner | docs/platform/work-state/contracts/cli-io-contract.md |
| targetAnchor | unheaded-block-37 |
| claimKind | contract |
| disposition | promote |
| reviewStatus | pending |
| rationale | Runs-when / Blocked-when bullets of per-verb help are carried verbatim; kept as contract since it is a CLI surface guarantee. |
| targetUnitDigest | a1c9e2ebc2ba7e6a03ed7483b533c63f |

### Source unit

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### Target unit

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

### Unified diff

```diff
No text difference.
```

## claim_a374334e7c5dc565cac42c0fa641f78f

Source: docs/specs/work-state.md#sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện

Target: docs/platform/work-state/spec.md#registry-projection-and-registration-standard

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_a374334e7c5dc565cac42c0fa641f78f |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 7f649852cab8e814 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | registry-projection-and-registration-standard |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 tool registry becomes "Registry Projection And Registration Standard"; title changed. |
| targetUnitDigest | bd97137715f092dd3d8e4496cf57d1da |

### Source unit

```text
### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"

Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).

- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).
```

### Target unit

```text
### Registry Projection And Registration Standard

Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).

- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện"
+++ "docs/platform/work-state/spec.md#registry-projection-and-registration-standard"
@@ -1,4 +1,4 @@
-### Sổ đăng ký công cụ (tool registry) — hai chiều, tách chuẩn "đăng ký" khỏi "đang hiện diện"
+### Registry Projection And Registration Standard
 
 Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
 repository-harness's tool-registry-capability — xem
```

## claim_3a86c90c7384251f37bec19876c084db

Source: docs/specs/work-state.md#unheaded-block-72

Target: docs/platform/work-state/spec.md#unheaded-block-61

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_3a86c90c7384251f37bec19876c084db |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | acb4c4f353694a46 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-61 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Opening on the ported distillery tool-registry capability (tsk-1dj) is carried verbatim. |
| targetUnitDigest | acb4c4f353694a4680b5527ac1a9d33e |

### Source unit

```text
Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).
```

### Target unit

```text
Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).
```

### Unified diff

```diff
No text difference.
```

## claim_712d6e9b9a98f37be1985d416565b2b5

Source: docs/specs/work-state.md#unheaded-block-73

Target: docs/platform/work-state/spec.md#unheaded-block-62

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_712d6e9b9a98f37be1985d416565b2b5 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 19368a15d5d1a609 |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-62 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | view.tools projection and registration standard bullets (26 lines) are carried verbatim. |
| targetUnitDigest | 19368a15d5d1a609f1138d1fe8c79a53 |

### Source unit

```text
- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).
```

### Target unit

```text
- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).
```

### Unified diff

```diff
No text difference.
```

## claim_07b1d2ac34bdddeb8112613640a65ab5

Source: docs/specs/work-state.md#đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove

Target: docs/platform/work-state/spec.md#tool-registry-verbs

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_07b1d2ac34bdddeb8112613640a65ab5 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 5622ec7819b82b1f |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | tool-registry-verbs |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Source H3 on tool register/check/query/remove becomes "Tool Registry Verbs"; title changed. |
| targetUnitDigest | 5dff99d34cce8282fc33c703b20af8a5 |

### Source unit

```text
### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)

- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).
```

### Target unit

```text
### Tool Registry Verbs

- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).
```

### Unified diff

```diff
--- "docs/specs/work-state.md#đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove"
+++ "docs/platform/work-state/spec.md#tool-registry-verbs"
@@ -1,4 +1,4 @@
-### Đăng ký/gỡ/probe/hỏi công cụ (tool register / check / query / remove)
+### Tool Registry Verbs
 
 - **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
   ...`.
```

## claim_fcf82f5b62ebf92bd2bd6adf11cea633

Source: docs/specs/work-state.md#unheaded-block-74

Target: docs/platform/work-state/spec.md#unheaded-block-63

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_fcf82f5b62ebf92bd2bd6adf11cea633 |
| authoredBy | codex-session:1@2026-10-09 |
| sourceUnitDigest | 2b77791d889b05af |
| targetOwner | docs/platform/work-state/spec.md |
| targetAnchor | unheaded-block-63 |
| claimKind | specification |
| disposition | promote |
| reviewStatus | pending |
| rationale | Runs-when / Blocked-when bullets of the tool verbs (28 lines) are carried verbatim. |
| targetUnitDigest | 2b77791d889b05af4bf68e9d0af5f3a7 |

### Source unit

```text
- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).
```

### Target unit

```text
- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).
```

### Unified diff

```diff
No text difference.
```

## Unmatched candidate units

### docs/platform/work-state/contracts/cli-io-contract.md#cli-io-contract

````text
# CLI I/O Contract

```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-1

````text
```txt
Document type: Contract
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Owns the input and output contract of the fgOS CLI door and the stdout surface of fgos-runner: writer identity, envelope, exit codes, pagination, verb manifest and version tokens.
Design status: Candidate
Last reviewed: 2026-10-06
Added in candidate: the headings Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope and Entry Fields And Effect Axes subdivide sections of the sources that have no heading of their own; the text under them is carried from the sources.
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/spec.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/contracts/cli-io-contract.md#1-purpose-and-scope

```text
## 1. Purpose And Scope

Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.

**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-2

```text
Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-3

```text
**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

### docs/platform/work-state/contracts/cli-io-contract.md#2-input-direction-verb-and-identity

```text
## 2. Input Direction Verb And Identity
```

### docs/platform/work-state/contracts/cli-io-contract.md#single-write-door

```text
### Single Write Door

Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-4

```text
Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-7

```text
Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-8

```text
**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

### docs/platform/work-state/contracts/cli-io-contract.md#writer-source-trust-levels

```text
### Writer Source Trust Levels

| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |

- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10

```text
- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

### docs/platform/work-state/contracts/cli-io-contract.md#writer-resolution-rules

```text
### Writer Resolution Rules

**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").

Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

### docs/platform/work-state/contracts/cli-io-contract.md#caller-role

```text
### Caller Role

Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13

```text
Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

### docs/platform/work-state/contracts/cli-io-contract.md#3-output-direction-unified-envelope

```text
## 3. Output Direction Unified Envelope
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-15

```text
Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-16

````text
```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```
````

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-17

```text
`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
```

### docs/platform/work-state/contracts/cli-io-contract.md#error-path-is-not-enveloped

```text
### Error Path Is Not Enveloped

**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

### docs/platform/work-state/contracts/cli-io-contract.md#runner-stdout-envelope

```text
### Runner Stdout Envelope

**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).

**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-20

```text
**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

### docs/platform/work-state/contracts/cli-io-contract.md#recognizing-a-real-envelope

```text
### Recognizing A Real Envelope

**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-21

```text
**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

### docs/platform/work-state/contracts/cli-io-contract.md#4-exit-codes

```text
## 4. Exit Codes

`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-22

```text
`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

### docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions

```text
## 5. Reasoned Envelope Exceptions

Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:

1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.

**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-23

```text
Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24

```text
1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-25

```text
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

### docs/platform/work-state/contracts/cli-io-contract.md#6-cursor-pagination

```text
## 6. Cursor Pagination

**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.

Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.

Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-27

```text
Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-28

```text
Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

### docs/platform/work-state/contracts/cli-io-contract.md#7-machine-readable-verb-registry

```text
## 7. Machine-Readable Verb Registry
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

### docs/platform/work-state/contracts/cli-io-contract.md#entry-fields-and-effect-axes

```text
### Entry Fields And Effect Axes

**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — xem `fgos --help --json` cho danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).

- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `run` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.

Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Xem `fgos --help --json` cho
  danh sách hiện hành mang `externalEffect: true` (ví dụ `review`, `approve`,
  `run` — dispatch executor thật tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33

```text
Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

### docs/platform/work-state/contracts/cli-io-contract.md#8-multi-value-flag-convention

```text
## 8. Multi-Value Flag Convention

**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.

Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35

```text
Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

### docs/platform/work-state/contracts/cli-io-contract.md#10-version-tokens

```text
## 10. Version Tokens

Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.

| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |

CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-38

```text
Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-39

```text
| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40

```text
CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

### docs/platform/work-state/contracts/cli-io-contract.md#11-scope-boundary

```text
## 11. Scope Boundary

STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:

- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.

Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.

Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-41

```text
STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-42

```text
- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-43

```text
Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-44

```text
Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

### docs/platform/work-state/contracts/cli-io-contract.md#12-references

```text
## 12. References

`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-45

```text
`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

### docs/platform/work-state/contracts/cli-io-contract.md#13-related-files

```text
## 13. Related Files

- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
```

### docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-46

```text
- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
```

### docs/platform/work-state/spec.md#work-state-specification

````text
# Work State Specification

```txt
Document type: Spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/spec.md#unheaded-block-1

````text
```txt
Document type: Spec
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Own the observable behavior, state model, records, stages, verbs and rules of the work state area.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/contracts/cli-io-contract.md
- docs/platform/work-state/architecture/implementation-pointers.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/platform/work-state/history/multi-role-harness-distill-record.md
- docs/specs/work-state.md
- docs/io-contract.md
```
````

### docs/platform/work-state/spec.md#1-purpose-and-scope

```text
## 1. Purpose And Scope

Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.
```

### docs/platform/work-state/spec.md#unheaded-block-2

```text
Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.
```

### docs/platform/work-state/spec.md#2-entry-points-and-triggers

```text
## 2. Entry Points And Triggers

- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng); đồng thời quét READ-ONLY project tìm marker của harness agent khác đã có mặt (thư mục dấu ấn như `.bee/`, `.claude/`, `.codex/`, `.cursor/`, và khối managed trong `AGENTS.md` khi file đó tồn tại — `init` không bao giờ tạo/sửa `AGENTS.md`), ghi kết quả phát hiện ra output + vào manifest `.fgos/coexistence.json`; lỗi phát hiện không bao giờ chặn `init` (fail-safe), re-init lặp lại ghi manifest nhất quán (idempotent) — doctrine đầy đủ: `docs/coexistence.md`
- `fgos submit "<mô tả tự do>" [--async|--unattended] [--deps <id1,id2,...>]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); toàn văn mô tả gốc được giữ nguyên trên trường `description` (Data Dictionary #17, per discovery-context STR30) — nguồn ngữ cảnh đầy đủ cho context-discovery đọc lại sau, không bị cắt gọn như `title`; `verify` nhận placeholder cố định chờ bổ sung sau; `--deps` (tùy chọn, mirror hệt `add`'s `deps` sẵn có) ghi trực tiếp danh sách id phụ thuộc, đi qua ĐÚNG cửa ghi/kiểm chu trình mà mọi verb khác dùng — vắng cờ này thì `deps` rỗng, byte-identical hành vi trước đây (per str83-fgos-slash-commands / 757e5dd7); kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời; nếu item có `parent`, `ask` còn chụp thêm một ảnh `{id, title, status}` của gốc lúc này làm mốc so sánh sau (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng); item `awaiting-human` có `parent` còn kèm thêm `awaitingContext` — gốc hiện tại để neo ngữ cảnh, cộng phần đổi-từ-lúc-hỏi nếu có (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)), khóa này vắng mặt hoàn toàn khi không có item nào thuộc diện đó
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã ngã-ngũ, đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `discovery`/`exploring`/`planning`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này. "Ngã-ngũ" ở đây tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy — nghĩa là code đã vào cây chính là đủ mở dep, không phải chờ hết cả phần đuôi tổng-hợp/thu-hồi (xem RUL12 (frontier dẫn xuất))
- `fgos discover <id> [--verdict clear|unclear]` → chạy context-discovery cho một item đang ở stage `discovery` hoặc `exploring`, mang theo verdict của chính người gọi — đọc gì trước "Giai đoạn Soi-rõ (stage discovery) và Đào-sâu (stage exploring)" dưới; item ở stage lập-kế-hoạch dùng `plan`, không dùng verb này
- `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]` → chạy phán chia-việc cho một item đang ở stage `planning` (hoặc bí danh di sản `decompose`) — verb RIÊNG, tách bạch khỏi `discover`, xem "Giai đoạn Lập-kế-hoạch" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos repair` → sửa CHỈ MỘT hình dạng hỏng hẹp của nhật ký sự kiện: dòng cuối bị cắt cụt (crash giữa lúc append). Trước khi cắt, sao lưu nguyên trạng nhật ký hỏng ra file backup có dấu thời gian; sau khi cắt, tự đọc lại kiểm chứng nhật ký sạch trước khi báo thành công. Hỏng hình dạng khác (giữa file, nhiều dòng hỏng, hoặc nhật ký vốn đã sạch) đều bị từ chối rõ lý do, KHÔNG đụng file — cửa fail-closed cho `corrupt-log` (mã thoát 5) không bị nới, chỉ có đúng một khe hẹp này được vá tay bởi người vận hành. **Yêu cầu KHÔNG-tiến-trình-song-song (per fgos-multi-session-checkout Epic 3):** `repair` là ghi-đè-cả-file (`writeFileSync` sau khi sao lưu) và CỐ Ý không lấy `.fgos/events.lock` của `appendEvent` — nó phải chỉ chạy khi KHÔNG có tiến trình fgos nào đang sống, vì một `appendEvent` chen vào giữa lúc đọc và lúc ghi-đè của repair sẽ bị âm thầm nuốt mất (drop). Đây là thao tác hiếm, người vận hành chủ động gọi, không nằm trên đường append thường; bảo vệ repair khỏi ca đó là ngoài phạm vi, chỉ ghi nhận yêu cầu chứ không cưỡng chế
- `fgos metrics outcomes [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- `fgos rollup <id>` → đọc bản chiếu, in một item gốc (title/status) kèm đếm con theo status (`k/n done`) và liệt kê từng con trực tiếp (qua `parent`, dựng từ STR16 decompose) cùng status của nó; item không con in `0/0 done` + ghi rõ "không có con"; id không tồn tại báo lỗi `validation` — thao tác ĐỌC thuần, không sự kiện mới
- `fgos triage` → đọc bản chiếu, xếp hạng mọi item CHƯA `done` theo số item khác (cũng chưa `done`) đang phụ thuộc vào nó qua đồ thị hợp nhất `deps` + `parent` (`blocks`; một parent được tính cả từ con còn mở, không chỉ `deps`), giảm dần rồi id tăng dần (tie-break); mỗi dòng còn kèm `blockedBy` — chiều ngược lại, danh sách id mà CHÍNH dòng này còn đang chờ (unmet `deps`, cộng con còn mở nếu dòng là parent); backlog-triage impact ranking (STR21), tách bạch khỏi phân loại rủi ro/lane lúc intake (STR14 `classify.mjs`) — thao tác ĐỌC thuần, không sự kiện mới
- `fgos take [--id <id>] [--role human|session]` → **cửa pull giao–nhận việc** (bên ngoài vòng runner): một tác nhân ngoài (người mặc định, hoặc một phiên đang sống) cầm đúng một item từ ĐÚNG tập frontier runner dispatch-được — xem "Cửa pull giao–nhận việc" dưới
- `fgos return <id> [--timeout <ms>]` → trả kết quả cho một item đã `take` — verb tự đo tiến độ thật (tree sạch + HEAD tiến + verify thật), KHÔNG tin lời người gọi — xem "Cửa pull giao–nhận việc" dưới
- `fgos pick [id]` → **cửa pull giao–nhận việc CỘNG dựng workspace**, một lệnh kết hợp `take` + tạo/tái dùng worktree cho item claim được: không truyền `id` thì cầm đầu frontier (giống `take`), truyền `id` thì cầm đúng item đó (kể cả đường tái claim `blocked→doing` mang nhánh sống, giống `take`) — role LUÔN `session`, không có cờ `--role` (khác `take`); sau khi claim thành công, dựng (hoặc tái dùng) một worktree + nhánh `fgw/<id>` qua CHÍNH `createWorktree` mà vòng tự hành dùng (xem spec Runner Data Dictionary #2) — xem "Cầm việc + dựng workspace (pick)" dưới
- `fgos retrospective` → quét cơ học MỌI item đang `delivered` và chuyển từng cái sang `retrospective` — không nhận id, không phán xét, chạy lại nhiều lần vẫn ra cùng kết quả; đây là cửa vào của chặng tổng hợp sau-thi-công
- `fgos compound <id>` → GẮN NHÃN tài liệu lên bản ghi capture của một item đang ở status `retrospective` — item ở status khác bị từ chối rõ lý do, không sự kiện nào ghi thêm. Verb này KHÔNG còn chuyển stage: stage `compound-learn` mà nó từng mở lối vào đã rút, nên nó chỉ ghi outcome. Cờ tùy chọn `--doc-type <quadrant>` ghi nhãn Diataxis, cờ tùy chọn `--doc-path <path>` ghi con trỏ nguồn↔tài liệu (linkage) lên cùng outcome — xem RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)/RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)
- `fgos cleanup <id>` → đóng chặng cuối: đòi item đang ở status `cleanup`, chạy phép kiểm thu-hồi (TTL toàn cục đã trôi qua, và merge của item vẫn còn giải được) rồi mới cho `cleanup → done`; không đạt thì item rẽ `cleanup → blocked` nêu rõ lý do. Là harness thuần — KHÔNG skill nào nạp cho chặng này
- `fgos docs-index` → sinh chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối (manifest `docs/enduser-docs-index.json`) — verb ĐỌC-THUẦN (quyền `read`): không ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào; enumerate các quadrant Diataxis trên đĩa và truy ngược mỗi tài liệu về capture đã sinh nó — chi tiết hành vi + hình dạng manifest ở area `enduser-docs-index` (per bước-3 compound-learn-enduser-docs)
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` → cổng duyệt PR nội bộ, MỘT cổng cho mọi đề xuất `awaiting-approval` bất kể nguồn (runner hay pull-door) — bề mặt CLI này sống ở đây (cửa lệnh `fgos` một cửa), nhưng cơ chế merge/verify đầy đủ được đặc tả ở spec Runner "Cổng duyệt PR nội bộ"
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại); cửa pull `take`/`return` ghi hai nửa này trực tiếp, cùng khuôn
```

### docs/platform/work-state/spec.md#unheaded-block-3

```text
- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng); đồng thời quét READ-ONLY project tìm marker của harness agent khác đã có mặt (thư mục dấu ấn như `.bee/`, `.claude/`, `.codex/`, `.cursor/`, và khối managed trong `AGENTS.md` khi file đó tồn tại — `init` không bao giờ tạo/sửa `AGENTS.md`), ghi kết quả phát hiện ra output + vào manifest `.fgos/coexistence.json`; lỗi phát hiện không bao giờ chặn `init` (fail-safe), re-init lặp lại ghi manifest nhất quán (idempotent) — doctrine đầy đủ: `docs/coexistence.md`
- `fgos submit "<mô tả tự do>" [--async|--unattended] [--deps <id1,id2,...>]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); toàn văn mô tả gốc được giữ nguyên trên trường `description` (Data Dictionary #17, per discovery-context STR30) — nguồn ngữ cảnh đầy đủ cho context-discovery đọc lại sau, không bị cắt gọn như `title`; `verify` nhận placeholder cố định chờ bổ sung sau; `--deps` (tùy chọn, mirror hệt `add`'s `deps` sẵn có) ghi trực tiếp danh sách id phụ thuộc, đi qua ĐÚNG cửa ghi/kiểm chu trình mà mọi verb khác dùng — vắng cờ này thì `deps` rỗng, byte-identical hành vi trước đây (per str83-fgos-slash-commands / 757e5dd7); kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời; nếu item có `parent`, `ask` còn chụp thêm một ảnh `{id, title, status}` của gốc lúc này làm mốc so sánh sau (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng); item `awaiting-human` có `parent` còn kèm thêm `awaitingContext` — gốc hiện tại để neo ngữ cảnh, cộng phần đổi-từ-lúc-hỏi nếu có (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)), khóa này vắng mặt hoàn toàn khi không có item nào thuộc diện đó
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã ngã-ngũ, đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `discovery`/`exploring`/`planning`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này. "Ngã-ngũ" ở đây tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy — nghĩa là code đã vào cây chính là đủ mở dep, không phải chờ hết cả phần đuôi tổng-hợp/thu-hồi (xem RUL12 (frontier dẫn xuất))
- `fgos discover <id> [--verdict clear|unclear]` → chạy context-discovery cho một item đang ở stage `discovery` hoặc `exploring`, mang theo verdict của chính người gọi — đọc gì trước "Giai đoạn Soi-rõ (stage discovery) và Đào-sâu (stage exploring)" dưới; item ở stage lập-kế-hoạch dùng `plan`, không dùng verb này
- `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]` → chạy phán chia-việc cho một item đang ở stage `planning` (hoặc bí danh di sản `decompose`) — verb RIÊNG, tách bạch khỏi `discover`, xem "Giai đoạn Lập-kế-hoạch" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos repair` → sửa CHỈ MỘT hình dạng hỏng hẹp của nhật ký sự kiện: dòng cuối bị cắt cụt (crash giữa lúc append). Trước khi cắt, sao lưu nguyên trạng nhật ký hỏng ra file backup có dấu thời gian; sau khi cắt, tự đọc lại kiểm chứng nhật ký sạch trước khi báo thành công. Hỏng hình dạng khác (giữa file, nhiều dòng hỏng, hoặc nhật ký vốn đã sạch) đều bị từ chối rõ lý do, KHÔNG đụng file — cửa fail-closed cho `corrupt-log` (mã thoát 5) không bị nới, chỉ có đúng một khe hẹp này được vá tay bởi người vận hành. **Yêu cầu KHÔNG-tiến-trình-song-song (per fgos-multi-session-checkout Epic 3):** `repair` là ghi-đè-cả-file (`writeFileSync` sau khi sao lưu) và CỐ Ý không lấy `.fgos/events.lock` của `appendEvent` — nó phải chỉ chạy khi KHÔNG có tiến trình fgos nào đang sống, vì một `appendEvent` chen vào giữa lúc đọc và lúc ghi-đè của repair sẽ bị âm thầm nuốt mất (drop). Đây là thao tác hiếm, người vận hành chủ động gọi, không nằm trên đường append thường; bảo vệ repair khỏi ca đó là ngoài phạm vi, chỉ ghi nhận yêu cầu chứ không cưỡng chế
- `fgos metrics outcomes [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- `fgos rollup <id>` → đọc bản chiếu, in một item gốc (title/status) kèm đếm con theo status (`k/n done`) và liệt kê từng con trực tiếp (qua `parent`, dựng từ STR16 decompose) cùng status của nó; item không con in `0/0 done` + ghi rõ "không có con"; id không tồn tại báo lỗi `validation` — thao tác ĐỌC thuần, không sự kiện mới
- `fgos triage` → đọc bản chiếu, xếp hạng mọi item CHƯA `done` theo số item khác (cũng chưa `done`) đang phụ thuộc vào nó qua đồ thị hợp nhất `deps` + `parent` (`blocks`; một parent được tính cả từ con còn mở, không chỉ `deps`), giảm dần rồi id tăng dần (tie-break); mỗi dòng còn kèm `blockedBy` — chiều ngược lại, danh sách id mà CHÍNH dòng này còn đang chờ (unmet `deps`, cộng con còn mở nếu dòng là parent); backlog-triage impact ranking (STR21), tách bạch khỏi phân loại rủi ro/lane lúc intake (STR14 `classify.mjs`) — thao tác ĐỌC thuần, không sự kiện mới
- `fgos take [--id <id>] [--role human|session]` → **cửa pull giao–nhận việc** (bên ngoài vòng runner): một tác nhân ngoài (người mặc định, hoặc một phiên đang sống) cầm đúng một item từ ĐÚNG tập frontier runner dispatch-được — xem "Cửa pull giao–nhận việc" dưới
- `fgos return <id> [--timeout <ms>]` → trả kết quả cho một item đã `take` — verb tự đo tiến độ thật (tree sạch + HEAD tiến + verify thật), KHÔNG tin lời người gọi — xem "Cửa pull giao–nhận việc" dưới
- `fgos pick [id]` → **cửa pull giao–nhận việc CỘNG dựng workspace**, một lệnh kết hợp `take` + tạo/tái dùng worktree cho item claim được: không truyền `id` thì cầm đầu frontier (giống `take`), truyền `id` thì cầm đúng item đó (kể cả đường tái claim `blocked→doing` mang nhánh sống, giống `take`) — role LUÔN `session`, không có cờ `--role` (khác `take`); sau khi claim thành công, dựng (hoặc tái dùng) một worktree + nhánh `fgw/<id>` qua CHÍNH `createWorktree` mà vòng tự hành dùng (xem spec Runner Data Dictionary #2) — xem "Cầm việc + dựng workspace (pick)" dưới
- `fgos retrospective` → quét cơ học MỌI item đang `delivered` và chuyển từng cái sang `retrospective` — không nhận id, không phán xét, chạy lại nhiều lần vẫn ra cùng kết quả; đây là cửa vào của chặng tổng hợp sau-thi-công
- `fgos compound <id>` → GẮN NHÃN tài liệu lên bản ghi capture của một item đang ở status `retrospective` — item ở status khác bị từ chối rõ lý do, không sự kiện nào ghi thêm. Verb này KHÔNG còn chuyển stage: stage `compound-learn` mà nó từng mở lối vào đã rút, nên nó chỉ ghi outcome. Cờ tùy chọn `--doc-type <quadrant>` ghi nhãn Diataxis, cờ tùy chọn `--doc-path <path>` ghi con trỏ nguồn↔tài liệu (linkage) lên cùng outcome — xem RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)/RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)
- `fgos cleanup <id>` → đóng chặng cuối: đòi item đang ở status `cleanup`, chạy phép kiểm thu-hồi (TTL toàn cục đã trôi qua, và merge của item vẫn còn giải được) rồi mới cho `cleanup → done`; không đạt thì item rẽ `cleanup → blocked` nêu rõ lý do. Là harness thuần — KHÔNG skill nào nạp cho chặng này
- `fgos docs-index` → sinh chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối (manifest `docs/enduser-docs-index.json`) — verb ĐỌC-THUẦN (quyền `read`): không ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào; enumerate các quadrant Diataxis trên đĩa và truy ngược mỗi tài liệu về capture đã sinh nó — chi tiết hành vi + hình dạng manifest ở area `enduser-docs-index` (per bước-3 compound-learn-enduser-docs)
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` → cổng duyệt PR nội bộ, MỘT cổng cho mọi đề xuất `awaiting-approval` bất kể nguồn (runner hay pull-door) — bề mặt CLI này sống ở đây (cửa lệnh `fgos` một cửa), nhưng cơ chế merge/verify đầy đủ được đặc tả ở spec Runner "Cổng duyệt PR nội bộ"
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại); cửa pull `take`/`return` ghi hai nửa này trực tiếp, cùng khuôn
```

### docs/platform/work-state/spec.md#4-capture-and-evidence-records

```text
## 4. Capture And Evidence Records

Subsections: Outcome Record, Friction Record, Settlement Record, Close Lesson Record, Human Gate Record, Discovery Gate Record.
```

### docs/platform/work-state/spec.md#unheaded-block-5

```text
Subsections: Outcome Record, Friction Record, Settlement Record, Close Lesson Record, Human Gate Record, Discovery Gate Record.
```

### docs/platform/work-state/spec.md#5-workflow-step-and-stage-model

```text
## 5. Workflow Step And Stage Model

Subsections: Workflow Step Replaces Stage, Discovery And Exploring Stages, Planning Stage.
```

### docs/platform/work-state/spec.md#unheaded-block-27

```text
Subsections: Workflow Step Replaces Stage, Discovery And Exploring Stages, Planning Stage.
```

### docs/platform/work-state/spec.md#8-tool-registry

```text
## 8. Tool Registry

Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
```

### docs/platform/work-state/spec.md#unheaded-block-60

```text
Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
```

### docs/platform/work-state/spec.md#9-behaviors-and-operations

```text
## 9. Behaviors And Operations
```

### docs/platform/work-state/spec.md#init-verb

```text
### Init Verb

- **Runs when:** người/agent gọi `fgos init` tại thư mục làm việc — bước đầu
  tiên trước khi bất kỳ verb nào khác dùng được kho work-state.
- **Blocked when:** không có điều kiện chặn — `init` luôn thành công bất kể
  phát hiện gì (per install-coexistence / f1715488).
- **What changes:** tạo `.fgos/` rỗng (nhật ký rỗng + bản chiếu rỗng) tại cwd
  nếu chưa có; quét READ-ONLY project tìm marker của harness agent khác đã có
  mặt (thư mục dấu ấn — `.bee/`, `.claude/`, `.codex/`, `.cursor/` là tập khởi
  đầu, mở rộng được — và khối managed trong `AGENTS.md` của host nếu file đó
  tồn tại); ghi kết quả phát hiện vào `.fgos/coexistence.json` (manifest v1:
  `territory` {data, worktrees {descriptor, resolved}, branches} +
  `detected_harnesses`), và in ra output những gì phát hiện được.
- Cộng thêm, phi-chặn: `init` còn tự kiểm project directory có phải một repo
  git với HEAD resolve được hay không (`git rev-parse --verify --quiet HEAD`,
  bọc try/catch fail-safe — git vắng mặt hay repo chưa có commit nào đều rơi
  cùng một nhánh, không phân biệt); khi KHÔNG resolve được, kết quả trả về
  mang thêm trường `gitHeadless: true` — một trường dữ liệu cộng-thêm trên
  phong bì `fgos.v1` sẵn có, không banner riêng, không đổi mã thoát, không
  chặn `init` (per D ecfd0d1a). Repo có ≥1 commit: không mang trường này
  (vắng mặt, không phải `false`) — hành vi/hình dạng output không đổi cho case
  đã có từ trước.
- **Side effects:** không ghi/sửa/xóa bất kỳ file nào thuộc harness khác —
  host không có `AGENTS.md` thì `init` bỏ qua bước đó, không tự tạo.
  Lỗi đọc một marker (vd `AGENTS.md` hỏng quyền) không chặn `init` — ghi nhận
  lỗi vào manifest, `init` vẫn thành công (fail-safe).
- **Afterwards:** re-init trên cùng project ghi lại manifest nhất quán
  (idempotent — không tích lũy/trùng lặp entry qua nhiều lần chạy). Doctrine
  đầy đủ (lãnh địa, một-nhạc-trưởng-mỗi-phiên, Known Gaps): `docs/coexistence.md`.
```

### docs/platform/work-state/spec.md#unheaded-block-64

```text
- **Runs when:** người/agent gọi `fgos init` tại thư mục làm việc — bước đầu
  tiên trước khi bất kỳ verb nào khác dùng được kho work-state.
- **Blocked when:** không có điều kiện chặn — `init` luôn thành công bất kể
  phát hiện gì (per install-coexistence / f1715488).
- **What changes:** tạo `.fgos/` rỗng (nhật ký rỗng + bản chiếu rỗng) tại cwd
  nếu chưa có; quét READ-ONLY project tìm marker của harness agent khác đã có
  mặt (thư mục dấu ấn — `.bee/`, `.claude/`, `.codex/`, `.cursor/` là tập khởi
  đầu, mở rộng được — và khối managed trong `AGENTS.md` của host nếu file đó
  tồn tại); ghi kết quả phát hiện vào `.fgos/coexistence.json` (manifest v1:
  `territory` {data, worktrees {descriptor, resolved}, branches} +
  `detected_harnesses`), và in ra output những gì phát hiện được.
- Cộng thêm, phi-chặn: `init` còn tự kiểm project directory có phải một repo
  git với HEAD resolve được hay không (`git rev-parse --verify --quiet HEAD`,
  bọc try/catch fail-safe — git vắng mặt hay repo chưa có commit nào đều rơi
  cùng một nhánh, không phân biệt); khi KHÔNG resolve được, kết quả trả về
  mang thêm trường `gitHeadless: true` — một trường dữ liệu cộng-thêm trên
  phong bì `fgos.v1` sẵn có, không banner riêng, không đổi mã thoát, không
  chặn `init` (per D ecfd0d1a). Repo có ≥1 commit: không mang trường này
  (vắng mặt, không phải `false`) — hành vi/hình dạng output không đổi cho case
  đã có từ trước.
- **Side effects:** không ghi/sửa/xóa bất kỳ file nào thuộc harness khác —
  host không có `AGENTS.md` thì `init` bỏ qua bước đó, không tự tạo.
  Lỗi đọc một marker (vd `AGENTS.md` hỏng quyền) không chặn `init` — ghi nhận
  lỗi vào manifest, `init` vẫn thành công (fail-safe).
- **Afterwards:** re-init trên cùng project ghi lại manifest nhất quán
  (idempotent — không tích lũy/trùng lặp entry qua nhiều lần chạy). Doctrine
  đầy đủ (lãnh địa, một-nhạc-trưởng-mỗi-phiên, Known Gaps): `docs/coexistence.md`.
```

### docs/platform/work-state/spec.md#add-verb

```text
### Add Verb

`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.

- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại, `--domain` không khớp domain nào trong sổ đăng ký — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding` (mặc
    định lazy). `add` KHÔNG truyền `--stage` — vắng mặt `stage` tự đọc ra
    stage thỏa bước Thực-thi của domain đó (per "Mô hình domain" trên), nên
    một item `add --domain synthetic` (domain chỉ có một stage, thỏa Thực-thi)
    sẵn sàng dispatch ngay, không cần qua context-discovery/chia-việc.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'` (mảng `{text,evidence}`,
    Data Dictionary #24); giá trị hỏng dạng (không parse được, không phải
    mảng, một clause thiếu/rỗng `text`) bị chặn ở `validation` (mã 4) trước
    khi merge, cùng khuôn mọi trường khác của `add`; vắng cờ thì
    `item.acceptance` vắng mặt hoàn toàn, không mặc định mảng rỗng (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)).
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.
```

### docs/platform/work-state/spec.md#unheaded-block-65

```text
`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi tự điền mọi trường (kể cả tự đặt id kebab-case), khác hẳn UX "nộp rồi đi"
của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp (9 file) tiếp tục dùng nguyên trạng; tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.
```

### docs/platform/work-state/spec.md#unheaded-block-66

```text
- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại, `--domain` không khớp domain nào trong sổ đăng ký — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding` (mặc
    định lazy). `add` KHÔNG truyền `--stage` — vắng mặt `stage` tự đọc ra
    stage thỏa bước Thực-thi của domain đó (per "Mô hình domain" trên), nên
    một item `add --domain synthetic` (domain chỉ có một stage, thỏa Thực-thi)
    sẵn sàng dispatch ngay, không cần qua context-discovery/chia-việc.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'` (mảng `{text,evidence}`,
    Data Dictionary #24); giá trị hỏng dạng (không parse được, không phải
    mảng, một clause thiếu/rỗng `text`) bị chặn ở `validation` (mã 4) trước
    khi merge, cùng khuôn mọi trường khác của `add`; vắng cờ thì
    `item.acceptance` vắng mặt hoàn toàn, không mặc định mảng rỗng (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)).
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.
```

### docs/platform/work-state/spec.md#submit-verb

```text
### Submit Verb

- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended] [--domain <tên>] [--deps <id1,id2,...>] [--tier <bậc>] [--kind <loại>] [--risk <mức>]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi; `--deps` trỏ một id không tồn tại —
  `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, KHÔNG sự kiện nào được
  ghi. Không có điều kiện chặn nào khác — mọi mô tả không khớp từ khóa phân
  loại nào vẫn tạo item thành công (rơi về mặc định an toàn), đúng tinh thần
  "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — mặc định suy bằng cách đếm các từ khóa rủi ro/loại-việc
    xuất hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp
    từ khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Ba cờ tùy chọn `--tier`/`--kind`/`--risk` (str51-llm-assist-classify)
    GHI ĐÈ suy luận cơ học TỪNG TRƯỜNG MỘT khi có mặt — cờ nào vắng thì
    trường đó vẫn suy như cũ, không phụ thuộc các cờ khác có mặt hay không
    (per RUL60 (submit — ba cờ ghi-đè tier/kind/risk, độc lập từng trường) dưới). Luôn ghi đè được bằng một sửa (`edit`) sau đó dù trường
    đến từ suy luận hay từ cờ tường minh.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - **deps** — tùy chọn qua `--deps <id1,id2,...>`, mirror HỆT cách `add` đã xử
    lý deps từ trước: mỗi id được kiểm tồn tại + kiểm chu trình qua ĐÚNG cửa
    ghi `addWork` mọi verb khác dùng, không cửa ghi mới; vắng cờ → `deps: []`,
    y hệt hành vi `submit` trước khi cờ này tồn tại (per str83-fgos-slash-commands / 757e5dd7).
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding`.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'`, mirror HỆT `add`
    (Data Dictionary #24, RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)): cùng kiểm hỏng-dạng, cùng khuôn vắng-cờ-là-
    vắng-mặt, không mặc định mảng rỗng.
  - **stage** — stage của domain đó thỏa bước Làm-rõ, nếu domain đó có (per
    "Mô hình domain" trên); với `coding` (mặc định/vắng mặt) là `discovery`,
    stage đầu chuỗi (xem "Giai đoạn Soi-rõ" dưới) — item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng. Một domain KHÔNG có stage nào thỏa bước Làm-rõ (vd
    `synthetic`) nhận stage đầu tiên trong danh sách khai của domain đó thay
    thế — bỏ qua context-discovery hoàn toàn (per R-domain-1 trên); `submit`
    cho một domain như vậy chưa có proof thật (`verify` vẫn là placeholder
    của `submit`, không ai điền lại) — dùng `add --domain <tên> --verify ...`
    cho một domain bỏ-qua-discovery thay vì `submit`.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `discovery`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery VÀ phán chia-việc.
```

### docs/platform/work-state/spec.md#unheaded-block-67

```text
- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended] [--domain <tên>] [--deps <id1,id2,...>] [--tier <bậc>] [--kind <loại>] [--risk <mức>]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi; `--deps` trỏ một id không tồn tại —
  `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, KHÔNG sự kiện nào được
  ghi. Không có điều kiện chặn nào khác — mọi mô tả không khớp từ khóa phân
  loại nào vẫn tạo item thành công (rơi về mặc định an toàn), đúng tinh thần
  "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — mặc định suy bằng cách đếm các từ khóa rủi ro/loại-việc
    xuất hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp
    từ khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Ba cờ tùy chọn `--tier`/`--kind`/`--risk` (str51-llm-assist-classify)
    GHI ĐÈ suy luận cơ học TỪNG TRƯỜNG MỘT khi có mặt — cờ nào vắng thì
    trường đó vẫn suy như cũ, không phụ thuộc các cờ khác có mặt hay không
    (per RUL60 (submit — ba cờ ghi-đè tier/kind/risk, độc lập từng trường) dưới). Luôn ghi đè được bằng một sửa (`edit`) sau đó dù trường
    đến từ suy luận hay từ cờ tường minh.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - **deps** — tùy chọn qua `--deps <id1,id2,...>`, mirror HỆT cách `add` đã xử
    lý deps từ trước: mỗi id được kiểm tồn tại + kiểm chu trình qua ĐÚNG cửa
    ghi `addWork` mọi verb khác dùng, không cửa ghi mới; vắng cờ → `deps: []`,
    y hệt hành vi `submit` trước khi cờ này tồn tại (per str83-fgos-slash-commands / 757e5dd7).
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding`.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'`, mirror HỆT `add`
    (Data Dictionary #24, RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)): cùng kiểm hỏng-dạng, cùng khuôn vắng-cờ-là-
    vắng-mặt, không mặc định mảng rỗng.
  - **stage** — stage của domain đó thỏa bước Làm-rõ, nếu domain đó có (per
    "Mô hình domain" trên); với `coding` (mặc định/vắng mặt) là `discovery`,
    stage đầu chuỗi (xem "Giai đoạn Soi-rõ" dưới) — item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng. Một domain KHÔNG có stage nào thỏa bước Làm-rõ (vd
    `synthetic`) nhận stage đầu tiên trong danh sách khai của domain đó thay
    thế — bỏ qua context-discovery hoàn toàn (per R-domain-1 trên); `submit`
    cho một domain như vậy chưa có proof thật (`verify` vẫn là placeholder
    của `submit`, không ai điền lại) — dùng `add --domain <tên> --verify ...`
    cho một domain bỏ-qua-discovery thay vì `submit`.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `discovery`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery VÀ phán chia-việc.
```

### docs/platform/work-state/spec.md#discover-verb

```text
### Discover Verb

- **Runs when:** người/agent gọi
  `fgos discover <id> [--verdict clear|unclear] [--tier <bậc>] [--kind <loại>] [--risk <mức>]`
  — điểm gọi tay/phiên-sống (mode `sync`). Verb này phục vụ ĐÚNG hai stage đầu
  chuỗi (`discovery`, `exploring`); item ở stage lập-kế-hoạch dùng verb `plan`
  riêng bên dưới, KHÔNG dispatch chéo. Vòng tự hành cũng quét đúng hai stage
  này mỗi lượt chạy (xem spec Runner) — cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`; item đang ở stage mà
  verb này không phục vụ — báo rõ và chỉ sang verb đúng, không âm thầm làm
  việc khác. Người gọi tương tác KHÔNG cung cấp verdict cũng bị từ chối, trừ
  khi tín hiệu tin-cậy (artifact quyết định đã commit dưới `docsRef`) trả lời
  thay: engine không bao giờ tự đoán verdict hộ.
- **What changes:** một bản ghi discovery (xem trên); rồi HOẶC một sự kiện
  đổi-stage `discovery → planning` (verdict `clear`, kèm `verify` thật) hoặc
  `discovery → exploring` (verdict `unclear`) hoặc `exploring → planning`
  (đã chốt xong), HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu
  hỏi) khi còn cần người quyết. Kèm theo, khi người gọi có truyền
  `--tier`/`--kind`/`--risk`: một bản vá phân loại lên chính item — đây là
  chỗ `tier`/`kind`/`risk` được phán LẠI sau khi có bằng chứng, thay
  cho giá trị đếm-từ-khoá mà `submit` gán lúc sinh. Ba cờ đều tùy chọn và
  độc lập từng trường.
- **Side effects:** không có lời gọi model nào từ bên trong verb. Phán-quan
  lồng bên trong đã rút — lập luận nằm ở người gọi, verb chỉ áp dụng verdict
  nhận được. Bản vá phân loại đi qua ĐÚNG một chốt chặn dùng chung với đường
  headless của runner: chỉ áp dụng khi cả kết cục lẫn verdict đều `clear`,
  nên một verdict `unclear` (hay một tranh chấp `verify` đang park) không bao
  giờ ghi phân loại; và một giá trị ngoài từ vựng của domain bị từ chối
  TRƯỚC khi verb ghi bất cứ thứ gì. Trước đây chỉ đường headless có hợp đồng
  dữ liệu này còn đường tương tác chỉ có prose ("skill tự nhớ gọi `fgos
  edit`") — hai đường nay dùng chung một cửa.
- **Afterwards:** verdict `clear` → item sang `planning` (chưa lọt `ready` —
  còn một giai đoạn nữa phải qua) với `verify` thật, không còn placeholder;
  verdict `unclear` → item sang `exploring`; cần người → item xuất hiện trong
  `list` ở `awaiting-human` kèm câu hỏi, y hệt mọi cổng chờ-người khác. Mọi
  nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng tự
  hành tự quét) sẽ soi lại.
```

### docs/platform/work-state/spec.md#unheaded-block-68

```text
- **Runs when:** người/agent gọi
  `fgos discover <id> [--verdict clear|unclear] [--tier <bậc>] [--kind <loại>] [--risk <mức>]`
  — điểm gọi tay/phiên-sống (mode `sync`). Verb này phục vụ ĐÚNG hai stage đầu
  chuỗi (`discovery`, `exploring`); item ở stage lập-kế-hoạch dùng verb `plan`
  riêng bên dưới, KHÔNG dispatch chéo. Vòng tự hành cũng quét đúng hai stage
  này mỗi lượt chạy (xem spec Runner) — cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`; item đang ở stage mà
  verb này không phục vụ — báo rõ và chỉ sang verb đúng, không âm thầm làm
  việc khác. Người gọi tương tác KHÔNG cung cấp verdict cũng bị từ chối, trừ
  khi tín hiệu tin-cậy (artifact quyết định đã commit dưới `docsRef`) trả lời
  thay: engine không bao giờ tự đoán verdict hộ.
- **What changes:** một bản ghi discovery (xem trên); rồi HOẶC một sự kiện
  đổi-stage `discovery → planning` (verdict `clear`, kèm `verify` thật) hoặc
  `discovery → exploring` (verdict `unclear`) hoặc `exploring → planning`
  (đã chốt xong), HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu
  hỏi) khi còn cần người quyết. Kèm theo, khi người gọi có truyền
  `--tier`/`--kind`/`--risk`: một bản vá phân loại lên chính item — đây là
  chỗ `tier`/`kind`/`risk` được phán LẠI sau khi có bằng chứng, thay
  cho giá trị đếm-từ-khoá mà `submit` gán lúc sinh. Ba cờ đều tùy chọn và
  độc lập từng trường.
- **Side effects:** không có lời gọi model nào từ bên trong verb. Phán-quan
  lồng bên trong đã rút — lập luận nằm ở người gọi, verb chỉ áp dụng verdict
  nhận được. Bản vá phân loại đi qua ĐÚNG một chốt chặn dùng chung với đường
  headless của runner: chỉ áp dụng khi cả kết cục lẫn verdict đều `clear`,
  nên một verdict `unclear` (hay một tranh chấp `verify` đang park) không bao
  giờ ghi phân loại; và một giá trị ngoài từ vựng của domain bị từ chối
  TRƯỚC khi verb ghi bất cứ thứ gì. Trước đây chỉ đường headless có hợp đồng
  dữ liệu này còn đường tương tác chỉ có prose ("skill tự nhớ gọi `fgos
  edit`") — hai đường nay dùng chung một cửa.
- **Afterwards:** verdict `clear` → item sang `planning` (chưa lọt `ready` —
  còn một giai đoạn nữa phải qua) với `verify` thật, không còn placeholder;
  verdict `unclear` → item sang `exploring`; cần người → item xuất hiện trong
  `list` ở `awaiting-human` kèm câu hỏi, y hệt mọi cổng chờ-người khác. Mọi
  nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng tự
  hành tự quét) sẽ soi lại.
```

### docs/platform/work-state/spec.md#plan-verb

```text
### Plan Verb

- **Runs when:** người/agent gọi
  `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]`
  — verb RIÊNG cho stage `planning` (và bí danh di sản `decompose`), tách bạch
  khỏi `discover` ở trên: một item đứng sai stage bị từ chối rõ lý do thay vì
  được dispatch nhầm phép phán. Vòng tự hành quét bước này NGAY SAU lượt quét
  soi-rõ và TRƯỚC khi giao việc thi công.
- **Blocked when:** item không tồn tại — `validation`; item không ở stage
  lập-kế-hoạch — chỉ sang `discover`. Verdict chia mà có bất kỳ con nào thiếu
  `verify` thật là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item
  ở nguyên trạng cho lượt sau (fail-safe, không bao giờ throw).
- **What changes:** HOẶC một sự kiện đổi-stage `planning → executing`
  (pass-through, hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-con cộng sự
  kiện đổi-stage của gốc (verdict chia), HOẶC một sự kiện đổi-status sang
  `awaiting-human` mang đề xuất chia (cần người quyết), HOẶC không gì cả nếu
  verdict không hợp lệ (xem "Giai đoạn Lập-kế-hoạch" trên).
- **Side effects:** không có lời gọi model nào từ bên trong verb — cùng lý do
  với `discover` ở trên. Khi item tới `executing`, verb NHẢ luôn claim của
  item về `todo`: phiên nào cầm tiếp việc thi công phải claim lại qua cửa pull.
- **Afterwards:** pass-through hoặc chia xong → item/gốc sang `executing`,
  xuất hiện trong `ready` khi deps/lineage cũng đã mở; cần người quyết →
  `awaiting-human` mang đề xuất chia, trả lời xong thì phán lại từ đầu.
```

### docs/platform/work-state/spec.md#unheaded-block-69

```text
- **Runs when:** người/agent gọi
  `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]`
  — verb RIÊNG cho stage `planning` (và bí danh di sản `decompose`), tách bạch
  khỏi `discover` ở trên: một item đứng sai stage bị từ chối rõ lý do thay vì
  được dispatch nhầm phép phán. Vòng tự hành quét bước này NGAY SAU lượt quét
  soi-rõ và TRƯỚC khi giao việc thi công.
- **Blocked when:** item không tồn tại — `validation`; item không ở stage
  lập-kế-hoạch — chỉ sang `discover`. Verdict chia mà có bất kỳ con nào thiếu
  `verify` thật là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item
  ở nguyên trạng cho lượt sau (fail-safe, không bao giờ throw).
- **What changes:** HOẶC một sự kiện đổi-stage `planning → executing`
  (pass-through, hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-con cộng sự
  kiện đổi-stage của gốc (verdict chia), HOẶC một sự kiện đổi-status sang
  `awaiting-human` mang đề xuất chia (cần người quyết), HOẶC không gì cả nếu
  verdict không hợp lệ (xem "Giai đoạn Lập-kế-hoạch" trên).
- **Side effects:** không có lời gọi model nào từ bên trong verb — cùng lý do
  với `discover` ở trên. Khi item tới `executing`, verb NHẢ luôn claim của
  item về `todo`: phiên nào cầm tiếp việc thi công phải claim lại qua cửa pull.
- **Afterwards:** pass-through hoặc chia xong → item/gốc sang `executing`,
  xuất hiện trong `ready` khi deps/lineage cũng đã mở; cần người quyết →
  `awaiting-human` mang đề xuất chia, trả lời xong thì phán lại từ đầu.
```

### docs/platform/work-state/spec.md#move-verb

```text
### Move Verb

- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→delivered`, `doing→awaiting-approval`, `awaiting-approval→delivered`, `delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`, `awaiting-approval→todo` (bắt buộc lý do), `awaiting-approval→blocked` (bắt buộc lý do — per pr-lifecycle / 1359ab5e, cạnh gate duyệt gãy: merge conflict hoặc verify đỏ sau merge, xem spec Runner "Cổng duyệt PR nội bộ"), `todo/doing→blocked`, `blocked→todo/doing`, `blocked→awaiting-approval` (per fan-out-parallel — cạnh cơ học, KHÔNG bắt buộc lý do, dành riêng cho một lần đồng bộ-lại/catch-up sạch, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)"), `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `awaiting-approval→todo` hoặc cạnh gate-gãy `awaiting-approval→blocked` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3; (d) **`--to delivered` khi nhánh `fgw/<id>` tồn tại mà CHƯA reachable từ trunk** (per tsk-5dk — `git merge-base --is-ancestor`, đo trực tiếp trong `case 'move'`, không tái dùng đường suy-luận-từ-git của cleanup-harness) — trả `validation` (mã 4), TRỪ KHI cờ `--override-reason "<lý do>"` được truyền kèm giá trị không rỗng; item không có nhánh `fgw/<id>` (item pull/legacy, hoặc fixture trạng thái thuần) hoặc có nhánh nhưng ĐÃ reachable không bị chặn — xem Data Dictionary #28/#29. Bốn trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không, TRỪ đường override ở (d) — khi `--override-reason` cho phép một `--to delivered` vượt qua kiểm reachability, một bản ghi `decision` (kind `engine`) được ghi TRƯỚC sự kiện chuyển-trạng-thái, mang chính lý do đó làm `rationale` — luôn kiểm được sau này qua nhật ký quyết định của item, không âm thầm.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`; nay chỉ tới được `done` qua đúng một cạnh `cleanup→done`, sau khi item đã đi hết chuỗi đuôi `delivered → retrospective → cleanup`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp. Cạnh `awaiting-approval→todo` (reject) hoặc `awaiting-approval→blocked` (gate gãy) mang `reason`: giá trị MỚI NHẤT còn được fold thêm lên chính item (`item.reason`, Data Dictionary #18, latest-wins) — không chỉ nằm trong nhật ký sự kiện, để consumer sau (prompt worker, người đọc `list`) thấy lý do mới nhất mà không cần lục nhật ký (per worker-execution STR33 / 396d9d9e, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)). Cạnh `blocked→awaiting-approval` (per fan-out-parallel) là cạnh DUY NHẤT rời `blocked` không mang `reason` và không đi qua `doing` — dành riêng cho một lần đồng bộ-lại (catch-up) sạch, phân biệt với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, đi qua chống-lặp bình thường như mọi lần nhận việc khác); xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)".
```

### docs/platform/work-state/spec.md#unheaded-block-70

```text
- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→delivered`, `doing→awaiting-approval`, `awaiting-approval→delivered`, `delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`, `awaiting-approval→todo` (bắt buộc lý do), `awaiting-approval→blocked` (bắt buộc lý do — per pr-lifecycle / 1359ab5e, cạnh gate duyệt gãy: merge conflict hoặc verify đỏ sau merge, xem spec Runner "Cổng duyệt PR nội bộ"), `todo/doing→blocked`, `blocked→todo/doing`, `blocked→awaiting-approval` (per fan-out-parallel — cạnh cơ học, KHÔNG bắt buộc lý do, dành riêng cho một lần đồng bộ-lại/catch-up sạch, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)"), `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `awaiting-approval→todo` hoặc cạnh gate-gãy `awaiting-approval→blocked` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3; (d) **`--to delivered` khi nhánh `fgw/<id>` tồn tại mà CHƯA reachable từ trunk** (per tsk-5dk — `git merge-base --is-ancestor`, đo trực tiếp trong `case 'move'`, không tái dùng đường suy-luận-từ-git của cleanup-harness) — trả `validation` (mã 4), TRỪ KHI cờ `--override-reason "<lý do>"` được truyền kèm giá trị không rỗng; item không có nhánh `fgw/<id>` (item pull/legacy, hoặc fixture trạng thái thuần) hoặc có nhánh nhưng ĐÃ reachable không bị chặn — xem Data Dictionary #28/#29. Bốn trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không, TRỪ đường override ở (d) — khi `--override-reason` cho phép một `--to delivered` vượt qua kiểm reachability, một bản ghi `decision` (kind `engine`) được ghi TRƯỚC sự kiện chuyển-trạng-thái, mang chính lý do đó làm `rationale` — luôn kiểm được sau này qua nhật ký quyết định của item, không âm thầm.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`; nay chỉ tới được `done` qua đúng một cạnh `cleanup→done`, sau khi item đã đi hết chuỗi đuôi `delivered → retrospective → cleanup`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp. Cạnh `awaiting-approval→todo` (reject) hoặc `awaiting-approval→blocked` (gate gãy) mang `reason`: giá trị MỚI NHẤT còn được fold thêm lên chính item (`item.reason`, Data Dictionary #18, latest-wins) — không chỉ nằm trong nhật ký sự kiện, để consumer sau (prompt worker, người đọc `list`) thấy lý do mới nhất mà không cần lục nhật ký (per worker-execution STR33 / 396d9d9e, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)). Cạnh `blocked→awaiting-approval` (per fan-out-parallel) là cạnh DUY NHẤT rời `blocked` không mang `reason` và không đi qua `doing` — dành riêng cho một lần đồng bộ-lại (catch-up) sạch, phân biệt với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, đi qua chống-lặp bình thường như mọi lần nhận việc khác); xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)".
```

### docs/platform/work-state/spec.md#edit-verb

```text
### Edit Verb

`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`, `acceptance` (per str73-done-flip-cos-check — Data Dictionary #24,
RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done); ghi qua `JSON.parse`, không phải `parseListFlag` của `refs`/`deps`,
vì text clause có thể chứa dấu phẩy), `priority`, `intent` (per str7-str8-priority-intent —
Data Dictionary #25/#26; `--priority` ép kiểu số nguyên không âm, `--intent` ép
kiểu số nguyên bất kỳ dấu; truyền cờ KHÔNG kèm giá trị theo sau bị chặn tường
minh — không bao giờ âm thầm biến thành số nhờ ép kiểu boolean). Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.

- **Blocked when:** id không tồn tại — `validation` (mã 4); patch rỗng
  (không cờ `--<field>` nào được truyền) — `validation`; patch chứa một
  trường ngoài danh sách ở trên (kể cả cố tình truyền `id`/`status`/
  `stage`/`domain`) — `validation`, bị chặn TRƯỚC khi merge vào bản ghi; giá
  trị sau merge không qua được `validateWork` (vd `--tier` ngoài domain,
  `--deps` trỏ id không tồn tại, `--priority` âm) — `validation`; `--priority`/
  `--intent` truyền không kèm giá trị — `validation`, không bao giờ ghi `1`.
  Cả các trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện `work.edit` mang patch (CHỈ những trường
  thật sự đổi, không phải toàn bộ bản ghi) vào nhật ký; bản chiếu gộp thêm
  (Object.assign) đúng những trường đó lên item — additive, không bao giờ
  ghi đè lại một sự kiện cũ (per RUL11 (tiến hóa schema)).
- **Side effects:** không.
- **Afterwards:** hai lần `edit` liên tiếp trên cùng item đều đọng lại —
  patch sau không xóa mất trường patch trước đã đổi (mỗi lần chỉ gộp đúng
  các key nó mang). Bỏ qua một cờ `--refs`/`--deps` giữ nguyên trường đó;
  truyền cờ với giá trị rỗng (`--refs ''`) XÓA trường về `[]` — hai trường
  hợp này phân biệt được, không lẫn vào nhau (cùng cơ chế `parseListFlag`
  `add` đã dùng). `edit --acceptance '<json>'` GHI ĐÈ TOÀN MẢNG mỗi lần
  (latest-wins), cùng ý nghĩa nhưng qua `JSON.parse` riêng — không có cơ chế
  sửa-từng-clause (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)). `edit` chạy được y hệt bất kể `status` hiện tại của item
  là gì — verb này không bao giờ tự đổi `status`. Không có cơ chế CAS/
  `--expect` ở slice này (mỗi `edit` đã là một sự kiện cộng thêm nên giá trị
  cũ luôn phục hồi được qua nhật ký, không như một ghi-đè thật trong kho có
  thể biến đổi).
```

### docs/platform/work-state/spec.md#unheaded-block-71

```text
`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`, `acceptance` (per str73-done-flip-cos-check — Data Dictionary #24,
RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done); ghi qua `JSON.parse`, không phải `parseListFlag` của `refs`/`deps`,
vì text clause có thể chứa dấu phẩy), `priority`, `intent` (per str7-str8-priority-intent —
Data Dictionary #25/#26; `--priority` ép kiểu số nguyên không âm, `--intent` ép
kiểu số nguyên bất kỳ dấu; truyền cờ KHÔNG kèm giá trị theo sau bị chặn tường
minh — không bao giờ âm thầm biến thành số nhờ ép kiểu boolean). Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.
```

### docs/platform/work-state/spec.md#unheaded-block-72

```text
- **Blocked when:** id không tồn tại — `validation` (mã 4); patch rỗng
  (không cờ `--<field>` nào được truyền) — `validation`; patch chứa một
  trường ngoài danh sách ở trên (kể cả cố tình truyền `id`/`status`/
  `stage`/`domain`) — `validation`, bị chặn TRƯỚC khi merge vào bản ghi; giá
  trị sau merge không qua được `validateWork` (vd `--tier` ngoài domain,
  `--deps` trỏ id không tồn tại, `--priority` âm) — `validation`; `--priority`/
  `--intent` truyền không kèm giá trị — `validation`, không bao giờ ghi `1`.
  Cả các trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện `work.edit` mang patch (CHỈ những trường
  thật sự đổi, không phải toàn bộ bản ghi) vào nhật ký; bản chiếu gộp thêm
  (Object.assign) đúng những trường đó lên item — additive, không bao giờ
  ghi đè lại một sự kiện cũ (per RUL11 (tiến hóa schema)).
- **Side effects:** không.
- **Afterwards:** hai lần `edit` liên tiếp trên cùng item đều đọng lại —
  patch sau không xóa mất trường patch trước đã đổi (mỗi lần chỉ gộp đúng
  các key nó mang). Bỏ qua một cờ `--refs`/`--deps` giữ nguyên trường đó;
  truyền cờ với giá trị rỗng (`--refs ''`) XÓA trường về `[]` — hai trường
  hợp này phân biệt được, không lẫn vào nhau (cùng cơ chế `parseListFlag`
  `add` đã dùng). `edit --acceptance '<json>'` GHI ĐÈ TOÀN MẢNG mỗi lần
  (latest-wins), cùng ý nghĩa nhưng qua `JSON.parse` riêng — không có cơ chế
  sửa-từng-clause (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)). `edit` chạy được y hệt bất kể `status` hiện tại của item
  là gì — verb này không bao giờ tự đổi `status`. Không có cơ chế CAS/
  `--expect` ở slice này (mỗi `edit` đã là một sự kiện cộng thêm nên giá trị
  cũ luôn phục hồi được qua nhật ký, không như một ghi-đè thật trong kho có
  thể biến đổi).
```

### docs/platform/work-state/spec.md#decision-verb

```text
### Decision Verb

- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.
```

### docs/platform/work-state/spec.md#unheaded-block-73

```text
- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.
```

### docs/platform/work-state/spec.md#ask-verb

```text
### Ask Verb

- **Runs when:** người/agent gọi `fgos ask <id> --text "..."` để đậu một việc lại chờ người quyết.
- **Blocked when:** item không ở `todo`/`doing` (cạnh vào chờ không hợp lệ) — `precondition`; câu hỏi thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu hỏi vào nhật ký; item sang `awaiting-human`, bản chiếu gộp câu hỏi vào bản ghi cổng của item (theo id).
- **Side effects:** không.
- **Afterwards:** `list` hiện item ở `awaiting-human` kèm câu hỏi; `ready` không còn liệt kê item; mọi việc khác vẫn chạy bình thường — cổng bất đồng bộ, không chặn tiến trình khác. Việc đậu vô thời hạn cho tới khi có người trả lời.
```

### docs/platform/work-state/spec.md#unheaded-block-74

```text
- **Runs when:** người/agent gọi `fgos ask <id> --text "..."` để đậu một việc lại chờ người quyết.
- **Blocked when:** item không ở `todo`/`doing` (cạnh vào chờ không hợp lệ) — `precondition`; câu hỏi thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu hỏi vào nhật ký; item sang `awaiting-human`, bản chiếu gộp câu hỏi vào bản ghi cổng của item (theo id).
- **Side effects:** không.
- **Afterwards:** `list` hiện item ở `awaiting-human` kèm câu hỏi; `ready` không còn liệt kê item; mọi việc khác vẫn chạy bình thường — cổng bất đồng bộ, không chặn tiến trình khác. Việc đậu vô thời hạn cho tới khi có người trả lời.
```

### docs/platform/work-state/spec.md#answer-verb

```text
### Answer Verb

- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa). Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường). Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```

### docs/platform/work-state/spec.md#unheaded-block-75

```text
- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về status trước lúc `ask` đậu nó (`statusAtAsk`, ghi lúc `ask`, mặc định `todo` khi vắng — log cũ/gate không mang field này) — **`todo`** nếu item chưa bị cầm claim lúc hỏi, hoặc **`doing`** nếu một claim `pick`/`take` đang sống lúc hỏi (claim-lock §5.1: trước đây LUÔN về `todo` trần, làm rớt claim đang giữ nếu `ask` xảy ra giữa lúc item `doing` — đã sửa). Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item lại actionable — về `todo` thì xuất hiện trong `ready` khi deps đủ điều kiện; về `doing` thì KHÔNG xuất hiện trong `ready` (claim vẫn đang giữ, chờ `fgos return` như bình thường). Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```

### docs/platform/work-state/spec.md#outcome-recording

```text
### Outcome Recording

- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.
```

### docs/platform/work-state/spec.md#unheaded-block-76

```text
- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.
```

### docs/platform/work-state/spec.md#check-verb

```text
### Check Verb

- **Runs when:** người/agent gọi `fgos check [id]`.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** truyền id → in đúng một khối cho item đó, mỗi nửa (dự đoán/thực tế) in giá trị thật nếu đã có, hoặc thông báo "chưa có dữ liệu" nếu nửa đó chưa tới; không truyền id → in một khối cho mỗi item ĐANG có ít nhất một nửa outcome; kho/log không mang bản ghi outcome nào → in đúng một dòng "chưa có dữ liệu" — thành công, không phải lỗi.
```

### docs/platform/work-state/spec.md#unheaded-block-77

```text
- **Runs when:** người/agent gọi `fgos check [id]`.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** truyền id → in đúng một khối cho item đó, mỗi nửa (dự đoán/thực tế) in giá trị thật nếu đã có, hoặc thông báo "chưa có dữ liệu" nếu nửa đó chưa tới; không truyền id → in một khối cho mỗi item ĐANG có ít nhất một nửa outcome; kho/log không mang bản ghi outcome nào → in đúng một dòng "chưa có dữ liệu" — thành công, không phải lỗi.
```

### docs/platform/work-state/spec.md#docs-index-verb

```text
### Docs Index Verb

- **Runs when:** người/agent gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng — verb đọc-thuần với trạng thái item (quyền `read`): nó đọc bản chiếu outcome để truy ngược linkage và đọc cây tài liệu trên đĩa; nhật ký hỏng thì tầng đọc chung báo `corrupt-log` như mọi bên đọc. Không bao giờ ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào.
- **What changes:** ghi/ghi-đè đúng một tệp manifest `docs/enduser-docs-index.json` — một artifact dẫn xuất, không phải sự kiện hay bản chiếu trạng thái.
- **Afterwards:** manifest liệt kê mỗi tài liệu người-dùng-cuối tìm thấy dưới các thư mục quadrant, kèm linkage ngược về capture đã sinh nó (hoặc `null` cho tài liệu di sản chưa có linkage). Cơ chế đầy đủ (hình dạng manifest, ánh xạ quadrant→mục-đích/đối-tượng, cách truy linkage, tính idempotent, dung sai thư mục quadrant vắng) đặc tả ở area **`enduser-docs-index`** — bề mặt CLI sống ở đây (cửa lệnh `fgos` một cửa), hành vi chi tiết sống ở spec area đó, cùng khuôn `review`/`approve` trỏ sang spec Runner.
```

### docs/platform/work-state/spec.md#unheaded-block-78

```text
- **Runs when:** người/agent gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng — verb đọc-thuần với trạng thái item (quyền `read`): nó đọc bản chiếu outcome để truy ngược linkage và đọc cây tài liệu trên đĩa; nhật ký hỏng thì tầng đọc chung báo `corrupt-log` như mọi bên đọc. Không bao giờ ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào.
- **What changes:** ghi/ghi-đè đúng một tệp manifest `docs/enduser-docs-index.json` — một artifact dẫn xuất, không phải sự kiện hay bản chiếu trạng thái.
- **Afterwards:** manifest liệt kê mỗi tài liệu người-dùng-cuối tìm thấy dưới các thư mục quadrant, kèm linkage ngược về capture đã sinh nó (hoặc `null` cho tài liệu di sản chưa có linkage). Cơ chế đầy đủ (hình dạng manifest, ánh xạ quadrant→mục-đích/đối-tượng, cách truy linkage, tính idempotent, dung sai thư mục quadrant vắng) đặc tả ở area **`enduser-docs-index`** — bề mặt CLI sống ở đây (cửa lệnh `fgos` một cửa), hành vi chi tiết sống ở spec area đó, cùng khuôn `review`/`approve` trỏ sang spec Runner.
```

### docs/platform/work-state/spec.md#rollup-verb

```text
### Rollup Verb

- **Runs when:** người/agent gọi `fgos rollup <id>` để hỏi "việc tôi nộp tới đâu rồi" cho một item gốc (per stage-clarify / STR24).
- **Blocked when:** thiếu id — `validation`; id không tồn tại trong bản chiếu — `validation`, cùng khuôn `requireField`/not-found với `review`/`approve`. Không bao giờ ghi gì — đọc thuần, cùng họ với `check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in item gốc (title + status), rồi đếm con TRỰC TIẾP (qua `parent`, dựng từ STR16 decompose) đã `done` trên tổng số con (`k/n done`), rồi liệt kê từng con kèm status riêng của nó; item gốc không có con nào vẫn in `0/0 done` cộng một ghi chú rõ ràng "không có con" — không throw, không coi là lỗi.
```

### docs/platform/work-state/spec.md#unheaded-block-79

```text
- **Runs when:** người/agent gọi `fgos rollup <id>` để hỏi "việc tôi nộp tới đâu rồi" cho một item gốc (per stage-clarify / STR24).
- **Blocked when:** thiếu id — `validation`; id không tồn tại trong bản chiếu — `validation`, cùng khuôn `requireField`/not-found với `review`/`approve`. Không bao giờ ghi gì — đọc thuần, cùng họ với `check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in item gốc (title + status), rồi đếm con TRỰC TIẾP (qua `parent`, dựng từ STR16 decompose) đã `done` trên tổng số con (`k/n done`), rồi liệt kê từng con kèm status riêng của nó; item gốc không có con nào vẫn in `0/0 done` cộng một ghi chú rõ ràng "không có con" — không throw, không coi là lỗi.
```

### docs/platform/work-state/spec.md#triage-verb

```text
### Triage Verb

- **Runs when:** người/agent gọi `fgos triage` để hỏi "việc nào nổi lên chú ý" — cửa 2 của triage, phân biệt với STR14 intake-triage (cửa 1, phân loại rủi ro/lane lúc submit) — per deep-dive work-item-management.md, STR21.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `rollup`/`check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in mọi item CHƯA `done`, xếp hạng theo `blocks` — số item khác CŨNG CHƯA `done` đang liệt kê id đó trong `deps` — giảm dần, tie-break id tăng dần; item `done` không bao giờ xuất hiện trong danh sách VÀ không bao giờ được đếm vào `blocks` của item khác (một dep đã `done` không còn "chặn" ai); backlog rỗng hoặc mọi item đã `done` → một dòng thông báo rõ ràng, không throw. `blocks` là một proxy tác động (fan-out chặn), KHÔNG phải trường `priority` trên schema (đó là phạm vi STR7/STR8, còn `awaiting-approval`) — một derive thuần trên `deps` sẵn có, cùng tinh thần với `frontier.mjs`'s derive trên `parent`.
```

### docs/platform/work-state/spec.md#unheaded-block-80

```text
- **Runs when:** người/agent gọi `fgos triage` để hỏi "việc nào nổi lên chú ý" — cửa 2 của triage, phân biệt với STR14 intake-triage (cửa 1, phân loại rủi ro/lane lúc submit) — per deep-dive work-item-management.md, STR21.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `rollup`/`check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in mọi item CHƯA `done`, xếp hạng theo `blocks` — số item khác CŨNG CHƯA `done` đang liệt kê id đó trong `deps` — giảm dần, tie-break id tăng dần; item `done` không bao giờ xuất hiện trong danh sách VÀ không bao giờ được đếm vào `blocks` của item khác (một dep đã `done` không còn "chặn" ai); backlog rỗng hoặc mọi item đã `done` → một dòng thông báo rõ ràng, không throw. `blocks` là một proxy tác động (fan-out chặn), KHÔNG phải trường `priority` trên schema (đó là phạm vi STR7/STR8, còn `awaiting-approval`) — một derive thuần trên `deps` sẵn có, cùng tinh thần với `frontier.mjs`'s derive trên `parent`.
```

### docs/platform/work-state/spec.md#take-verb

```text
### Take Verb

- **Runs when:** một tác nhân ngoài runner gọi `fgos take [--id <id>] [--role human|session]`.
- **Blocked when:** `--role` khác `human`/`session` — `validation`; không truyền `--id` và frontier rỗng — `validation`; `--id` truyền một id không tồn tại — `validation`; `--id` truyền một item còn `todo` nhưng CHƯA nằm trong frontier (stage/deps/lineage chưa mở) — `validation`, thông điệp nói rõ "take chỉ mở đúng tập runner dispatch-được"; `--id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3). Mọi nhánh chặn KHÔNG ghi sự kiện nào.
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role` (`human`), `headAtTake` (Data Dictionary #14/#15), `preClaimStatus` (`todo` hoặc `blocked`), `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); trạng thái bền giữ nguyên pre-claim, trạng thái hiệu lực hiển thị `doing` qua lớp phủ runtime (`buildEffectiveView`). Một sự kiện outcome nửa DỰ ĐOÁN (tier/số dep/số lần nhận trước đó) được ghi cho cùng item — đối xứng claim của runner (xem spec Runner).
- **Side effects:** không.
- **Afterwards:** item hiển thị trạng thái hiệu lực `doing`, biến mất khỏi frontier (giống mọi claim khác); `fgos check` đọc được nửa dự đoán ngay; item chờ một `fgos return` để tới kết cục.
```

### docs/platform/work-state/spec.md#unheaded-block-81

```text
- **Runs when:** một tác nhân ngoài runner gọi `fgos take [--id <id>] [--role human|session]`.
- **Blocked when:** `--role` khác `human`/`session` — `validation`; không truyền `--id` và frontier rỗng — `validation`; `--id` truyền một id không tồn tại — `validation`; `--id` truyền một item còn `todo` nhưng CHƯA nằm trong frontier (stage/deps/lineage chưa mở) — `validation`, thông điệp nói rõ "take chỉ mở đúng tập runner dispatch-được"; `--id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3). Mọi nhánh chặn KHÔNG ghi sự kiện nào.
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role` (`human`), `headAtTake` (Data Dictionary #14/#15), `preClaimStatus` (`todo` hoặc `blocked`), `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); trạng thái bền giữ nguyên pre-claim, trạng thái hiệu lực hiển thị `doing` qua lớp phủ runtime (`buildEffectiveView`). Một sự kiện outcome nửa DỰ ĐOÁN (tier/số dep/số lần nhận trước đó) được ghi cho cùng item — đối xứng claim của runner (xem spec Runner).
- **Side effects:** không.
- **Afterwards:** item hiển thị trạng thái hiệu lực `doing`, biến mất khỏi frontier (giống mọi claim khác); `fgos check` đọc được nửa dự đoán ngay; item chờ một `fgos return` để tới kết cục.
```

### docs/platform/work-state/spec.md#pick-verb

```text
### Pick Verb

- **Runs when:** một tác nhân ngoài runner gọi `fgos pick [id]` — cùng cửa pull với `take`/`return`, nhưng gộp thêm bước dựng workspace trong MỘT lệnh.
- **Blocked when:** không truyền `id` và frontier rỗng — `validation` (no-id mở frontier-head như `take`); `id` truyền một id không tồn tại — `validation`; `id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3) — HỆT `take`, không có cờ `--role` (role LUÔN `session`, không đọc/chấp nhận cờ đó). **Khác `take`: explicit `--id` không kiểm frontier** (claim-lock §3a) — `pick` nên cầm item ở BẤT KỲ stage nào nếu còn `status: 'todo'` (item đang ở `discovery`/`exploring`/`planning` đều được), miễn status chưa thay (CAS trong `moveWork` là guard thật).
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role: 'session'` + `headAtTake` (hoặc `branchHeadAtTake` cho đường nguồn-nhánh), `preClaimStatus`, `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký (*new claims do not durably write into doing*); trạng thái bền giữ pre-claim, trạng thái hiệu lực hiển thị `doing`. Một sự kiện outcome nửa DỰ ĐOÁN được ghi cho cùng item, HỆT `take`. NGAY SAU claim thành công, một worktree + nhánh `fgw/<id>` được dựng (hoặc tái dùng nếu đã sống) qua CHÍNH `createWorktree` vòng tự hành dùng — không đường dựng workspace riêng.
- **Side effects:** nếu dựng workspace thất bại SAU KHI claim đã thành công, lỗi đó lộ ra nguyên vẹn cho người gọi — claim KHÔNG bao giờ bị âm thầm hoàn tác (không rollback tự động); item ở lại trạng thái hiệu lực `doing`, không worktree.
- **Afterwards:** người/phiên thấy item vừa claim VÀ đường dẫn worktree + tên nhánh của nó; item biến mất khỏi frontier như mọi claim khác; item chờ một `fgos return` để tới kết cục — HỆT vòng đời của một claim qua `take` (per str83-fgos-slash-commands / 757e5dd7).
```

### docs/platform/work-state/spec.md#unheaded-block-82

```text
- **Runs when:** một tác nhân ngoài runner gọi `fgos pick [id]` — cùng cửa pull với `take`/`return`, nhưng gộp thêm bước dựng workspace trong MỘT lệnh.
- **Blocked when:** không truyền `id` và frontier rỗng — `validation` (no-id mở frontier-head như `take`); `id` truyền một id không tồn tại — `validation`; `id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3) — HỆT `take`, không có cờ `--role` (role LUÔN `session`, không đọc/chấp nhận cờ đó). **Khác `take`: explicit `--id` không kiểm frontier** (claim-lock §3a) — `pick` nên cầm item ở BẤT KỲ stage nào nếu còn `status: 'todo'` (item đang ở `discovery`/`exploring`/`planning` đều được), miễn status chưa thay (CAS trong `moveWork` là guard thật).
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role: 'session'` + `headAtTake` (hoặc `branchHeadAtTake` cho đường nguồn-nhánh), `preClaimStatus`, `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký (*new claims do not durably write into doing*); trạng thái bền giữ pre-claim, trạng thái hiệu lực hiển thị `doing`. Một sự kiện outcome nửa DỰ ĐOÁN được ghi cho cùng item, HỆT `take`. NGAY SAU claim thành công, một worktree + nhánh `fgw/<id>` được dựng (hoặc tái dùng nếu đã sống) qua CHÍNH `createWorktree` vòng tự hành dùng — không đường dựng workspace riêng.
- **Side effects:** nếu dựng workspace thất bại SAU KHI claim đã thành công, lỗi đó lộ ra nguyên vẹn cho người gọi — claim KHÔNG bao giờ bị âm thầm hoàn tác (không rollback tự động); item ở lại trạng thái hiệu lực `doing`, không worktree.
- **Afterwards:** người/phiên thấy item vừa claim VÀ đường dẫn worktree + tên nhánh của nó; item biến mất khỏi frontier như mọi claim khác; item chờ một `fgos return` để tới kết cục — HỆT vòng đời của một claim qua `take` (per str83-fgos-slash-commands / 757e5dd7).
```

### docs/platform/work-state/spec.md#return-verb

```text
### Return Verb

- **Runs when:** người/phiên đang cầm một item qua `take` gọi `fgos return <id> [--timeout <ms>]`.
- **Blocked when:** item không tồn tại — `validation`; item không mang trạng thái hiệu lực `doing` — `validation`; item mang trạng thái hiệu lực `doing` nhưng `claimRole` không phải `human`/`session` (claim của runner) — `validation`, `return` chỉ hoàn tất một `take`; item thiếu `headAtTake` (claim di sản/không qua `take`) — `validation`; working tree host repo KHÔNG sạch (loại trừ `.fgos/` — store sống tự mutate bởi chính `return`, không bao giờ tính là bẩn) — `validation`; HEAD chưa tiến so `headAtTake` — `validation`; `--timeout` không phải số dương — `validation`. KHÔNG có nhánh chặn nào ghi sự kiện.
- **What changes:** verb TỰ CHẠY `verify` thật của item (goal-check) tại HEAD hiện hành, trong thư mục làm việc hiện hành — không bao giờ tin lời người gọi. Verify xanh: `settleClaim` chuyển bền trực tiếp từ `preClaimStatus → awaiting-approval` (mang thêm `headAtReturn`, Data Dictionary #16, per pr-lifecycle / 1359ab5e), giải phóng claim file, cộng một sự kiện outcome nửa THỰC TẾ (kết cục `awaiting-approval`, đạt goal-check, số commit kể từ `headAtTake`). Verify đỏ: `settleClaim` chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`), giải phóng claim file, cộng nửa thực tế (kết cục `blocked`, không đạt), cộng một bản ghi friction lớp `verification`.
- **Side effects:** một tiến trình con chạy `verify` của item (shell, trong `cwd` hiện hành).
- **Afterwards:** verify xanh → item ở `awaiting-approval` mang `headAtReturn`, chờ người duyệt qua cổng `review`/`approve`/`reject` như mọi đề xuất khác (xem spec Runner "Cổng duyệt PR nội bộ" — dải `headAtTake→headAtReturn` là nguồn diff của một đề xuất pull-door) — KHÔNG sinh settlement ở bước này (settlement thuộc cạnh `→done`); verify đỏ → item ở `blocked`, mang một bản ghi friction verification, đi lại đường `blocked → todo` thường như mọi item đỗ khác.
```

### docs/platform/work-state/spec.md#unheaded-block-83

```text
- **Runs when:** người/phiên đang cầm một item qua `take` gọi `fgos return <id> [--timeout <ms>]`.
- **Blocked when:** item không tồn tại — `validation`; item không mang trạng thái hiệu lực `doing` — `validation`; item mang trạng thái hiệu lực `doing` nhưng `claimRole` không phải `human`/`session` (claim của runner) — `validation`, `return` chỉ hoàn tất một `take`; item thiếu `headAtTake` (claim di sản/không qua `take`) — `validation`; working tree host repo KHÔNG sạch (loại trừ `.fgos/` — store sống tự mutate bởi chính `return`, không bao giờ tính là bẩn) — `validation`; HEAD chưa tiến so `headAtTake` — `validation`; `--timeout` không phải số dương — `validation`. KHÔNG có nhánh chặn nào ghi sự kiện.
- **What changes:** verb TỰ CHẠY `verify` thật của item (goal-check) tại HEAD hiện hành, trong thư mục làm việc hiện hành — không bao giờ tin lời người gọi. Verify xanh: `settleClaim` chuyển bền trực tiếp từ `preClaimStatus → awaiting-approval` (mang thêm `headAtReturn`, Data Dictionary #16, per pr-lifecycle / 1359ab5e), giải phóng claim file, cộng một sự kiện outcome nửa THỰC TẾ (kết cục `awaiting-approval`, đạt goal-check, số commit kể từ `headAtTake`). Verify đỏ: `settleClaim` chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`), giải phóng claim file, cộng nửa thực tế (kết cục `blocked`, không đạt), cộng một bản ghi friction lớp `verification`.
- **Side effects:** một tiến trình con chạy `verify` của item (shell, trong `cwd` hiện hành).
- **Afterwards:** verify xanh → item ở `awaiting-approval` mang `headAtReturn`, chờ người duyệt qua cổng `review`/`approve`/`reject` như mọi đề xuất khác (xem spec Runner "Cổng duyệt PR nội bộ" — dải `headAtTake→headAtReturn` là nguồn diff của một đề xuất pull-door) — KHÔNG sinh settlement ở bước này (settlement thuộc cạnh `→done`); verify đỏ → item ở `blocked`, mang một bản ghi friction verification, đi lại đường `blocked → todo` thường như mọi item đỗ khác.
```

### docs/platform/work-state/spec.md#rebuild-verb

```text
### Rebuild Verb

- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.
```

### docs/platform/work-state/spec.md#unheaded-block-84

```text
- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.
```

### docs/platform/work-state/spec.md#list-and-ready-verbs

```text
### List And Ready Verbs

- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep đã ngã-ngũ thật, tức từ `delivered` trở đi hoặc đã hủy + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `awaiting-approval`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `discovery`/`exploring`/`planning` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.
- **Thứ tự sẵn-sàng là một HỢP ĐỒNG CÓ VERSION (STR43 S4, nâng lên v2 bởi str7-str8-priority-intent).** Thứ tự `ready` trả về là hợp đồng phân-thứ-tự có tên, có số phiên bản — v2 hiện hành: khóa 1 `priority` ASC (Data Dictionary #25, vắng mặt xếp cuối) → khóa 2 `intent` DESC (Data Dictionary #26, vắng mặt xếp cuối) → khóa 3 (tie-break) FIFO theo thứ tự khai việc, chính là toàn bộ khóa của v1. Đây là bề mặt DUY NHẤT quyết định thứ tự cầm-giao việc; sort ổn định (`Array.prototype.sort`) nên một view mà không item nào mang `priority`/`intent` cho kết quả BYTE-GIỐNG-HỆT v1 — v2 không đổi hành vi của bất kỳ nhật ký nào chưa từng dùng hai trường mới.
```

### docs/platform/work-state/spec.md#unheaded-block-85

```text
- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep đã ngã-ngũ thật, tức từ `delivered` trở đi hoặc đã hủy + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `awaiting-approval`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `discovery`/`exploring`/`planning` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.
- **Thứ tự sẵn-sàng là một HỢP ĐỒNG CÓ VERSION (STR43 S4, nâng lên v2 bởi str7-str8-priority-intent).** Thứ tự `ready` trả về là hợp đồng phân-thứ-tự có tên, có số phiên bản — v2 hiện hành: khóa 1 `priority` ASC (Data Dictionary #25, vắng mặt xếp cuối) → khóa 2 `intent` DESC (Data Dictionary #26, vắng mặt xếp cuối) → khóa 3 (tie-break) FIFO theo thứ tự khai việc, chính là toàn bộ khóa của v1. Đây là bề mặt DUY NHẤT quyết định thứ tự cầm-giao việc; sort ổn định (`Array.prototype.sort`) nên một view mà không item nào mang `priority`/`intent` cho kết quả BYTE-GIỐNG-HỆT v1 — v2 không đổi hành vi của bất kỳ nhật ký nào chưa từng dùng hai trường mới.
```

### docs/platform/work-state/spec.md#graph-verb

```text
### Graph Verb

Một verb đọc-thuần trả **metrics CƠ HỌC** của đồ thị công việc, fold từ nhật ký, qua envelope CTR001. Không bao giờ ghi, không bao giờ gọi model — chỉ tính SỰ THẬT đồ thị cho một bên đọc (picker STR7, planner-brain STR8) dùng làm đầu vào, thay vì tự suy lại topology (stance RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item)). Mọi số liệu deterministic (cùng nhật ký → cùng kết quả → `data_hash` ổn định).

- **Connected-components (mấy mũi song song độc lập):** nhóm các item liên kết qua BẤT KỲ cạnh phụ-thuộc hoặc lineage nào (coi vô hướng) thành từng thành phần. Hai item ở hai thành phần khác nhau không chia sẻ dep/lineage → làm song song hoàn toàn được. Item không cạnh nào là một thành phần đơn.
- **Critical path (đường tới hạn / độ sâu):** chuỗi phụ-thuộc DÀI NHẤT trong đồ thị `deps` (bảo đảm phi-chu-trình ở cửa ghi) — độ dài là số bước tuần tự tối thiểu trước khi item sâu nhất khởi động được.
- **Stale-blocked (chuỗi kẹt):** các item `todo`/`blocked` còn ≥1 dep chưa `done` (kể cả một dep KHÔNG tồn tại — kẹt vĩnh viễn), kèm danh sách dep đang chặn. Item đã sẵn-sàng (mọi dep done) không liệt kê.
- **Greedy top-k-unblock (nên làm gì tiếp):** xếp hạng tham-lam dưới-mô-đun các item chưa `done` theo lượng công việc hoàn thành nó sẽ MỞ KHÓA — mỗi lượt chọn item phủ được nhiều hậu-duệ-chưa-done MỚI nhất; báo cả tổng hậu duệ (`unblocks`) lẫn phần mở mới biên (`newlyUnblocks`).
- **What-if (hoàn thành X → mở khóa gì):** `graph --what-if <id>` trả riêng tác động của một item: tổng hậu-duệ-chưa-done transitive + `newlyReady` (các item phụ thuộc trực-tiếp mà MỌI dep KHÁC đã `done` → hoàn thành X làm chúng thỏa-dep). Là sự thật phụ-thuộc, KHÔNG phải đủ-điều-kiện-frontier (không xét stage/lineage).
- **Frame (computed/skipped + revision):** mỗi payload metrics kèm một `frame` — `revision` (dấu vân tay view deterministic, S3) để một bên đọc cache theo revision và bỏ qua tính lại khi không đổi; `computed[]`/`skipped[]` nêu metric nào đã chạy: greedy `topUnblock` (metric duy nhất siêu-tuyến-tính) bị BỎ QUA trên đồ thị lớn (quá `maxNodesForGreedy`), giữ đọc luôn có biên.
- **Blocked when:** như mọi đọc — nhật ký hỏng → `corrupt-log` (mã 5); không bao giờ ghi một byte.
- Chỉ các id thật (có trong view) được nhóm/tính — một cạnh trỏ tới id không tồn tại (dangling parent/dep) không bao giờ tạo nút ma.
- **Đầu ra time-relative:** `graph`/`what-if`/components/critical-path là deterministic; chỉ advisory `stale` (dưới) mang thời-gian-thực nên `data_hash` của nó đổi theo thời gian đã trôi — đúng bản chất "kẹt bao lâu rồi".
```

### docs/platform/work-state/spec.md#unheaded-block-86

```text
Một verb đọc-thuần trả **metrics CƠ HỌC** của đồ thị công việc, fold từ nhật ký, qua envelope CTR001. Không bao giờ ghi, không bao giờ gọi model — chỉ tính SỰ THẬT đồ thị cho một bên đọc (picker STR7, planner-brain STR8) dùng làm đầu vào, thay vì tự suy lại topology (stance RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item)). Mọi số liệu deterministic (cùng nhật ký → cùng kết quả → `data_hash` ổn định).
```

### docs/platform/work-state/spec.md#unheaded-block-87

```text
- **Connected-components (mấy mũi song song độc lập):** nhóm các item liên kết qua BẤT KỲ cạnh phụ-thuộc hoặc lineage nào (coi vô hướng) thành từng thành phần. Hai item ở hai thành phần khác nhau không chia sẻ dep/lineage → làm song song hoàn toàn được. Item không cạnh nào là một thành phần đơn.
- **Critical path (đường tới hạn / độ sâu):** chuỗi phụ-thuộc DÀI NHẤT trong đồ thị `deps` (bảo đảm phi-chu-trình ở cửa ghi) — độ dài là số bước tuần tự tối thiểu trước khi item sâu nhất khởi động được.
- **Stale-blocked (chuỗi kẹt):** các item `todo`/`blocked` còn ≥1 dep chưa `done` (kể cả một dep KHÔNG tồn tại — kẹt vĩnh viễn), kèm danh sách dep đang chặn. Item đã sẵn-sàng (mọi dep done) không liệt kê.
- **Greedy top-k-unblock (nên làm gì tiếp):** xếp hạng tham-lam dưới-mô-đun các item chưa `done` theo lượng công việc hoàn thành nó sẽ MỞ KHÓA — mỗi lượt chọn item phủ được nhiều hậu-duệ-chưa-done MỚI nhất; báo cả tổng hậu duệ (`unblocks`) lẫn phần mở mới biên (`newlyUnblocks`).
- **What-if (hoàn thành X → mở khóa gì):** `graph --what-if <id>` trả riêng tác động của một item: tổng hậu-duệ-chưa-done transitive + `newlyReady` (các item phụ thuộc trực-tiếp mà MỌI dep KHÁC đã `done` → hoàn thành X làm chúng thỏa-dep). Là sự thật phụ-thuộc, KHÔNG phải đủ-điều-kiện-frontier (không xét stage/lineage).
- **Frame (computed/skipped + revision):** mỗi payload metrics kèm một `frame` — `revision` (dấu vân tay view deterministic, S3) để một bên đọc cache theo revision và bỏ qua tính lại khi không đổi; `computed[]`/`skipped[]` nêu metric nào đã chạy: greedy `topUnblock` (metric duy nhất siêu-tuyến-tính) bị BỎ QUA trên đồ thị lớn (quá `maxNodesForGreedy`), giữ đọc luôn có biên.
- **Blocked when:** như mọi đọc — nhật ký hỏng → `corrupt-log` (mã 5); không bao giờ ghi một byte.
- Chỉ các id thật (có trong view) được nhóm/tính — một cạnh trỏ tới id không tồn tại (dangling parent/dep) không bao giờ tạo nút ma.
- **Đầu ra time-relative:** `graph`/`what-if`/components/critical-path là deterministic; chỉ advisory `stale` (dưới) mang thời-gian-thực nên `data_hash` của nó đổi theo thời gian đã trôi — đúng bản chất "kẹt bao lâu rồi".
```

### docs/platform/work-state/spec.md#stale-verb

```text
### Stale Verb

`stale` phân loại các item đang `doing` là kẹt-hay-không theo NGƯỠNG-THEO-CHỦ, gợi ý — không bao giờ hành động:

- **Ngưỡng theo chủ (người ≫ agent):** claim của `runner` là claim AGENT (ân hạn ngắn, mặc định 15 phút); claim của `human`/`session`/khác là claim NGƯỜI (ân hạn dài, mặc định 24 giờ). Cùng một tuổi claim có thể kẹt với agent mà chưa kẹt với người. Ngưỡng ghi đè được.
- Chỉ liệt kê item kẹt, kèm `ageMs`/`thresholdMs`/`suggestion`. **Gợi ý không bao giờ mô tả thu-hồi tự-động** — đúng luật đã khóa: reap của runner chỉ thu hồi claim của CHÍNH nó khi crash, không bao giờ thu hồi claim của một người. Đây là bên cố-vấn: phân loại + gợi ý, người quyết.
- Item không tìm được thời-điểm-claim bị bỏ qua (không bao giờ tuổi NaN).
```

### docs/platform/work-state/spec.md#unheaded-block-88

```text
`stale` phân loại các item đang `doing` là kẹt-hay-không theo NGƯỠNG-THEO-CHỦ, gợi ý — không bao giờ hành động:
```

### docs/platform/work-state/spec.md#unheaded-block-89

```text
- **Ngưỡng theo chủ (người ≫ agent):** claim của `runner` là claim AGENT (ân hạn ngắn, mặc định 15 phút); claim của `human`/`session`/khác là claim NGƯỜI (ân hạn dài, mặc định 24 giờ). Cùng một tuổi claim có thể kẹt với agent mà chưa kẹt với người. Ngưỡng ghi đè được.
- Chỉ liệt kê item kẹt, kèm `ageMs`/`thresholdMs`/`suggestion`. **Gợi ý không bao giờ mô tả thu-hồi tự-động** — đúng luật đã khóa: reap của runner chỉ thu hồi claim của CHÍNH nó khi crash, không bao giờ thu hồi claim của một người. Đây là bên cố-vấn: phân loại + gợi ý, người quyết.
- Item không tìm được thời-điểm-claim bị bỏ qua (không bao giờ tuổi NaN).
```

### docs/platform/work-state/spec.md#conflicts-verb

```text
### Conflicts Verb

`conflicts` tìm rủi ro đụng-độ-file giữa các item CÓ THỂ giao SONG SONG. Tập ứng viên là frontier (`ready` = item giao được ngay bây giờ), nên mỗi xung đột là thật: một runner song song có thể nhặt cả hai cùng lúc.

- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.
```

### docs/platform/work-state/spec.md#unheaded-block-90

```text
`conflicts` tìm rủi ro đụng-độ-file giữa các item CÓ THỂ giao SONG SONG. Tập ứng viên là frontier (`ready` = item giao được ngay bây giờ), nên mỗi xung đột là thật: một runner song song có thể nhặt cả hai cùng lúc.
```

### docs/platform/work-state/spec.md#unheaded-block-91

```text
- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). PHI-CHẶN: chỉ nuôi cố-vấn này, không vào cycle-check/frontier.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.
```

### docs/platform/work-state/spec.md#10-actors-and-access

```text
## 10. Actors And Access

| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |
```

### docs/platform/work-state/spec.md#unheaded-block-92

```text
| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |
```

### docs/platform/work-state/spec.md#11-business-rules

```text
## 11. Business Rules

- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.step`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→awaiting-approval` (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): KHÔNG kiểm hình dạng (đường dẫn tự do), KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.stage` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.
```

### docs/platform/work-state/spec.md#unheaded-block-93

```text
- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStage` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep chỉ mở khi thật `done`). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại tier/kind/risk của `submit` chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định tier `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` (hoặc bất kỳ item nào tạo trước tính năng này) mặc định `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét cơ học này KHÔNG tự phán hộ verdict: không có verdict do người gọi cung cấp thì nó để item nguyên tại chỗ, chờ một phiên sống. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.step`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia CHỈ KHI phán tự báo mơ hồ HOẶC risk của gốc là `heavy`. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện `doing→awaiting-approval` (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, có tính) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên cạnh `blocked→doing`, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên cạnh `doing→awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): KHÔNG kiểm hình dạng (đường dẫn tự do), KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority`/`intent` — hai khóa sắp-xếp frontier, hai NGUỒN GHI tách bạch, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) CHỈ ghi qua `edit --priority <n>` — một người hoặc một tác nhân tự khai tường minh, không bao giờ do picker tự suy ra. `intent` (Data Dictionary #26) do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item (đọc metrics đồ thị STR43 + xếp hạng tác động STR21 làm tín hiệu cơ học), ghi qua MỘT lệnh `edit` thứ hai ngay sau khi bản ghi discovery được ghi — tách bạch hoàn toàn khỏi lệnh chuyển-stage đi kèm (không bao giờ gộp vào payload của nó), và chạy CẢ khi verdict không đủ rõ để rời `discovery` (một item đậu `awaiting-human` vẫn được chấm điểm). Một lỗi ghi `intent` (vd item không qua được `validateWork` toàn phần) không bao giờ chặn kết quả phán rõ/chưa-rõ của lần đó — nuốt lặng lẽ, cùng kỷ luật fail-safe RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong). `intent` KHÔNG có ràng buộc dấu/khoảng ở tầng schema — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc ghi; sửa tay được qua `edit --intent <n>` như mọi trường editable khác. Cả hai trường chỉ đổi KHÓA SẮP-XẾP mà bộ lọc frontier cơ học đọc (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) — không bao giờ đổi TẬP HỢP item nào lọt frontier, giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item): picker cơ học vĩnh viễn, trí tuệ vào hệ qua đúng field-trên-item, không bao giờ qua vòng chọn-giao (per str7-str8-priority-intent).
- **RUL60 (`submit` — ba cờ ghi-đè `--tier`/`--kind`/`--risk`, độc lập từng trường; `risk` KHÔNG mirror `tier` khi có cờ).** Xem "Nộp vấn đề tự do (submit)" trên: mặc định cả ba trường vẫn suy cơ học từ mô tả (đếm từ khóa) như trước; ba cờ tùy chọn ghi đè TỪNG TRƯỜNG một cách độc lập — có `--tier` không bắt buộc phải có `--kind`/`--risk`, và ngược lại. Khi CHỈ `--tier` có mặt (không `--risk`), `risk` VẪN suy cơ học như trước — tức `risk` khi đó mirror `tier` CƠ HỌC (giá trị suy ra, không phải giá trị vừa ghi đè qua cờ) — một điểm dễ hiểu lầm: `submit "..." --tier heavy` (không `--risk`) có thể cho ra item `risk` KHÁC `heavy` nếu suy luận cơ học trên mô tả đó tự ra một bậc khác. Cờ vắng mặt không đổi hành vi cũ một byte (cùng khuôn optional-additive như `--domain`/`--deps`/`--acceptance` — RUL nền). Trường `domain` KHÔNG nằm trong phạm vi ba cờ này và không bị đụng tới (giữ nguyên hành vi cũ hoàn toàn). BÊN SẢN XUẤT giá trị cho ba cờ này từng là kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify), gọi trực tiếp khi có một mô tả tự do cần nộp trước cả khi `submit` chạy; skill đó đã RÚT (tsk-6ar) vì việc nó làm bị `/fgOS:submit` bước 6 (`plugins/fgOS/skills/submit/SKILL.md`, tsk-5wz) làm lại — trên bản mô tả SẠCH hơn (sau clarify, không phải trước) — cho bất kỳ phiên sống nào gọi cửa thường, không cần gọi riêng một skill nữa. Đường sản xuất còn sống hiện nay KHÔNG còn đi qua ba cờ `--tier`/`--kind`/`--risk` của chính verb `submit` mô tả ở trên — ba cờ ấy vẫn hoạt động y nguyên cho bất kỳ bên gọi nào (người, script, agent khác) muốn ghi đè trực tiếp lúc nộp, chỉ là không còn một skill đứng sẵn để tự suy luận và điền hộ chúng. **Cập nhật (cờ phân loại của `discover`):** chỗ phán lại chính thức nay là verb `discover` ở stage `discovery` — nó nhận cùng ba cờ và áp qua chốt chặn dùng chung với đường headless (xem "Chạy context-discovery (discover)" trên). `fgos edit` vẫn là cửa ghi hợp lệ cho một chỉnh tay lẻ, nhưng nó không còn là đường sản xuất được mô tả ở đây: phân loại thuộc về `discovery`, sau research, chứ không thuộc về một bước 6b nối sau `submit`.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.stage` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.
```

### docs/platform/work-state/spec.md#12-edge-cases-settled

```text
## 12. Edge Cases Settled

- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Nhiều tiến trình OS THẬT (fork) cùng gọi `appendEvent` trên một nhật ký đồng thời: mọi `seq` vẫn duy nhất, không trùng, không hở, tăng ngặt — `.fgos/events.lock` liên-tiến-trình tuần tự hóa chuỗi đọc-seq/append (per RUL10 (tiền đề có ngưỡng) bổ chú). Có test khóa fork nhiều tiến trình con thật, đồng bộ về một mốc khởi động chung để các đợt append thật sự chồng cửa sổ (mirror kỹ thuật spike ép-đua); một kiểm chứng vứt-đi cho thấy chính hình dạng đọc-rồi-append KHÔNG khóa va trùng nặng dưới cùng tải, nên test không rỗng-nghĩa.
- Hai tiến trình OS THẬT cùng gọi `addWork` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `validation` "already exists" thật (không crash/treo), nhật ký chỉ mang đúng MỘT sự kiện `work.add` cho id đó. Cùng kỹ thuật fork-đồng-bộ, cùng test khóa vứt-đi-nếu-thiếu-khóa (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw) — chứng minh bằng cách tạm bỏ khóa (git stash bản vá) rồi chạy lại: cả 2/2 test race đỏ đúng như dự đoán (6/6 tiến trình đua cùng thắng thay vì 1/6), phục hồi bản vá thì cả hai xanh trở lại.
- Hai tiến trình OS THẬT cùng gọi `moveWork` với CÙNG `expectedStatus` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `conflict` CAS thật, nhật ký chỉ mang đúng MỘT sự kiện `work.move` khớp cạnh đó cho id đó (cùng kỹ thuật, cùng cell trên).
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `awaiting-approval→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Item `awaiting-human` mà `parent` trỏ một id không giải được (gốc đã xóa/không tồn tại): `awaitingContext` cho item đó coi như không có gốc — không throw, không `changedSinceAsk`, cùng khuôn dung sai id-treo đã có cho `parent` ở nơi khác (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- Item `awaiting-human` được park TRƯỚC khi tính năng `awaitingContext` tồn tại (không mang G3 trong bản ghi cổng): `list` vẫn hiện `parent` hiện tại của nó bình thường, nhưng không có khóa `changedSinceAsk` — im lặng đúng nghĩa "không có mốc để so", không phải "đã so và không đổi" (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- `answer` một item rồi `ask` lại đúng item đó lần hai: G3 của lần `ask` sau ghi đè hoàn toàn ảnh chụp gốc của lần trước, không gộp hai ảnh cũ/mới.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- `submit --deps <id-không-tồn-tại>`: từ chối `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, không sự kiện nào ghi — cùng khuôn `add` với dep lạ.
- `submit --deps <id1,id2>` hợp lệ: cả hai id được ghi vào `deps` của item mới, đi qua đúng kiểm chu trình sẵn có; `submit` không kèm `--deps`: `deps: []`, byte-identical hành vi trước khi cờ này tồn tại.
- Context-discovery verdict đủ rõ: item rời `discovery` vào stage `planning` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời chuỗi soi-rõ mà verify còn placeholder giả.
- Context-discovery verdict chưa đủ rõ: item rời `discovery` vào `exploring` để đào sâu cùng người, rồi mới `exploring → planning`. Hai đường này là toàn bộ lối ra của `discovery`; không có cạnh nào đi thẳng tới `executing`.
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `planning → executing`, giữ nguyên verify đã có từ lúc rời chuỗi soi-rõ — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất, và verify THẬT của riêng nó; gốc chuyển `planning → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con ngã-ngũ (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `planning`, lượt sau phán lại từ đầu.
- Verdict chia có bất kỳ con nào thiếu verify thật, hoặc không có verdict nào đọc hiểu được: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw).
- Lượt quét cơ học của vòng tự hành gặp một item ở stage soi-rõ/lập-kế-hoạch mà không có verdict nào được cung cấp: để item nguyên tại chỗ, KHÔNG tự phán hộ và không throw — chờ một phiên sống tới quyết (RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong)).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua lượt quét soi-rõ rồi lượt quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery ra verdict chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần soi một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Item còn đỗ trên bí danh di sản `decompose`: vẫn đi tiếp được qua `decompose → executing` như trước, và tra ra đúng skill mà `planning` tra ra — bí danh không bao giờ làm một item mắc kẹt. Nhưng KHÔNG item mới nào tới được đó: phép tra "stage nào thỏa bước Chia-việc" luôn trả `planning`.
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.
- `take` không truyền `--id`: cầm đúng đầu frontier, mặc định `role=human`, ghi `headAtTake` và nửa dự đoán — chứng minh qua CLI thật. `take --id` một item đã bị cầm rơi thẳng xuống CAS của `move`, báo `conflict` thật (mã 3), không phải một thông điệp validation trùng lặp.
- `return` từ chối sạch khi working tree bẩn, hoặc khi HEAD chưa tiến so `headAtTake` (kể cả tree sạch nhưng zero tiến bộ thật) — cả hai `validation`, item giữ nguyên `doing`, không sự kiện nào ghi thêm.
- `return` verify xanh: `doing → awaiting-approval` + nửa thực tế, KHÔNG sinh settlement (settlement thuộc cạnh `→done`). `return` verify đỏ: `doing → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ của runner.
- `return` trên một item claim bởi runner (`claimRole: 'runner'`, không `headAtTake`) bị từ chối `validation` — cửa pull không đụng vào claim của runner.
- Một `fgos-runner --once` chạy song song khi một người đang cầm item qua `take`: gặt-lại lúc khởi động của runner KHÔNG BAO GIỜ giẫm claim đó (claim người cầm vô thời hạn) — chứng minh bằng e2e qua binary thật, chạy runner song song trước khi người `return` (xem spec Runner "Gặt-lại lúc khởi động").
- Cạnh `awaiting-approval→blocked` thiếu `reason` bị từ chối `validation`, cùng khuôn `awaiting-approval→todo` — test khóa (per pr-lifecycle).
- `return` verify xanh ghi `headAtReturn` lên đúng sự kiện `doing→awaiting-approval`; fold đọc lại được qua rebuild (mẫu `headAtTake`), vắng mặt cho một đề xuất của runner (không qua `return`) — test khóa (per pr-lifecycle).
- Reject/park mang `reason`: giá trị fold lên `item.reason`, đọc lại được qua rebuild (mẫu `claimRole`/`headAtTake`); một lần fold sau GHI ĐÈ lần trước (latest-wins, không cộng thêm) — test khóa cả hai chiều (per worker-execution STR33 / 396d9d9e).
- `take` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing`, ghi `branchHeadAtTake` (không `headAtTake`) — chứng minh qua CLI thật; `take` trên một item `blocked` KHÔNG mang nhánh sống vẫn xung đột như trước (không đường mới nào mở toang `blocked→doing`).
- `return` nguồn-nhánh (item mang `branchHeadAtTake`): đo trên nhánh KHÔNG đụng working tree host repo — verify chạy trong worktree tạm detached tại SHA nhánh, dọn trong `finally` dù thành công hay thất bại; verify xanh + có commit mới → `awaiting-approval` mang `branchHeadAtReturn`, KHÔNG BAO GIỜ mang `headAtReturn` — test khóa cả hai chiều (mutual exclusion) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- `return` nguồn-nhánh khi nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, item giữ `doing`, không sự kiện nào ghi thêm, tip nhánh không đổi — chứng minh bằng test thật.
- `fold` của `branchHeadAtTake`/`branchHeadAtReturn` qua rebuild: chỉ fold trên đúng cạnh của nó (`blocked→doing`/`doing→awaiting-approval`), không bao giờ lẫn với `headAtTake`/`headAtReturn` của cùng item hay của item khác — test khóa (write-side allowlist trong `store.mjs` + read-side fold trong `replay.mjs` đều được kiểm, đây là lỗ CRITICAL mà bee-validating từng gắn cờ trước khi cell dựng thật).
- `pick` không truyền `id`: cầm đúng đầu frontier, role CỐ ĐỊNH `session` (không đọc `--role`, cờ đó không tồn tại trên `pick`), dựng một nhánh + worktree THẬT (không detached) cho claim đó — chứng minh qua CLI thật.
- `pick <id>` trên một item đã `doing`: rơi thẳng CAS như `take`, báo `conflict` (mã 3), không double-claim.
- `pick` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing` (HỆT đường tái claim của `take`), rồi TÁI DÙNG worktree/nhánh sẵn có thay vì dựng bản sao.
- `createWorktree` ném lỗi SAU KHI claim của `pick` đã ghi thành công: lỗi lộ nguyên vẹn ra người gọi, claim KHÔNG bị hoàn tác/che giấu — chứng minh bằng một xung đột namespace nhánh git THẬT, không phải mock.
- `init` trong một repo git có 0 commit: `data.gitHeadless === true`, `init` vẫn thành công (không throw, không đổi mã thoát) — chứng minh qua CLI thật.
- `init` trong một repo git có ≥1 commit, hoặc ngoài một repo git hoàn toàn: không mang trường `gitHeadless` — hành vi/hình dạng output y hệt trước khi kiểm tra này tồn tại; lỗi đọc HEAD không bao giờ làm `init` thất bại (fail-safe, cùng khuôn với kiểm coexistence-manifest liền kề).
- Item mang `domain` lạ (không khớp sổ đăng ký) tới điểm đọc nóng (bộ lọc frontier, vòng tự hành, bảng chuyển-stage): rơi về `coding` kèm một cảnh báo, không crash vòng tự hành — test khóa.
- Item vắng `domain` (100% item hôm nay): mọi hành vi dispatch/chuyển-stage y hệt trước khi tính năng domain tồn tại — test khóa qua toàn bộ suite hiện có, không sửa một assertion nào (retrofit base-workflow-model).
- Đóng một item bằng cách nhảy cóc qua bước tổng hợp: không có cạnh nào để nhảy. `done` chỉ tới được từ `cleanup`, `cleanup` chỉ tới được từ `retrospective` — chuỗi tuần tự tự nó chặn, không cần một gate riêng gắn ở cửa `done` như trước.
- `fgos compound <id>` gọi trên một item KHÔNG ở `retrospective`: từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Gọi đúng lúc item ở `retrospective`: ghi nhãn lên bản ghi outcome, KHÔNG chuyển stage nào (không còn stage nào để chuyển).
- `move --to delivered` (hoặc `approve`) trên một item mang `acceptance` có ít nhất một clause `text` không rỗng nhưng `evidence` rỗng/vắng mặt: từ chối `precondition` (mã 2), nêu đích danh clause đó, item ở nguyên trạng thái/stage hiện tại, không sự kiện nào ghi thêm (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done), per str73-done-flip-cos-check / 0f3b6eb0).
- Cùng item trên, sau khi `edit --acceptance '<json đã điền evidence>'` rồi thử lại: đi qua — RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) luôn đọc trạng thái tươi, không có verdict lưu-đệm từ lần từ chối trước.
- Item mang `acceptance` mà MỌI clause đều có `evidence` không rỗng: qua `delivered` bằng cả hai lối vào, y hệt hành vi trước khi RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) tồn tại.
- Item KHÔNG mang `acceptance` (vắng mặt hoặc mảng rỗng): RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) không chạm tới — hành vi y hệt trước khi luật này tồn tại (per str73-done-flip-cos-check / 0e575f83).
- `add`/`submit`/`edit --acceptance` với giá trị JSON hỏng dạng (không parse được, không phải mảng, một clause thiếu `text` hoặc `text` rỗng): từ chối `validation` (mã 4), không sự kiện nào ghi thêm — cùng khuôn `--deps`/`--refs` hỏng dạng.
```

### docs/platform/work-state/spec.md#unheaded-block-94

```text
- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Nhiều tiến trình OS THẬT (fork) cùng gọi `appendEvent` trên một nhật ký đồng thời: mọi `seq` vẫn duy nhất, không trùng, không hở, tăng ngặt — `.fgos/events.lock` liên-tiến-trình tuần tự hóa chuỗi đọc-seq/append (per RUL10 (tiền đề có ngưỡng) bổ chú). Có test khóa fork nhiều tiến trình con thật, đồng bộ về một mốc khởi động chung để các đợt append thật sự chồng cửa sổ (mirror kỹ thuật spike ép-đua); một kiểm chứng vứt-đi cho thấy chính hình dạng đọc-rồi-append KHÔNG khóa va trùng nặng dưới cùng tải, nên test không rỗng-nghĩa.
- Hai tiến trình OS THẬT cùng gọi `addWork` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `validation` "already exists" thật (không crash/treo), nhật ký chỉ mang đúng MỘT sự kiện `work.add` cho id đó. Cùng kỹ thuật fork-đồng-bộ, cùng test khóa vứt-đi-nếu-thiếu-khóa (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw) — chứng minh bằng cách tạm bỏ khóa (git stash bản vá) rồi chạy lại: cả 2/2 test race đỏ đúng như dự đoán (6/6 tiến trình đua cùng thắng thay vì 1/6), phục hồi bản vá thì cả hai xanh trở lại.
- Hai tiến trình OS THẬT cùng gọi `moveWork` với CÙNG `expectedStatus` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `conflict` CAS thật, nhật ký chỉ mang đúng MỘT sự kiện `work.move` khớp cạnh đó cho id đó (cùng kỹ thuật, cùng cell trên).
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `awaiting-approval→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Item `awaiting-human` mà `parent` trỏ một id không giải được (gốc đã xóa/không tồn tại): `awaitingContext` cho item đó coi như không có gốc — không throw, không `changedSinceAsk`, cùng khuôn dung sai id-treo đã có cho `parent` ở nơi khác (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- Item `awaiting-human` được park TRƯỚC khi tính năng `awaitingContext` tồn tại (không mang G3 trong bản ghi cổng): `list` vẫn hiện `parent` hiện tại của nó bình thường, nhưng không có khóa `changedSinceAsk` — im lặng đúng nghĩa "không có mốc để so", không phải "đã so và không đổi" (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- `answer` một item rồi `ask` lại đúng item đó lần hai: G3 của lần `ask` sau ghi đè hoàn toàn ảnh chụp gốc của lần trước, không gộp hai ảnh cũ/mới.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- `submit --deps <id-không-tồn-tại>`: từ chối `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, không sự kiện nào ghi — cùng khuôn `add` với dep lạ.
- `submit --deps <id1,id2>` hợp lệ: cả hai id được ghi vào `deps` của item mới, đi qua đúng kiểm chu trình sẵn có; `submit` không kèm `--deps`: `deps: []`, byte-identical hành vi trước khi cờ này tồn tại.
- Context-discovery verdict đủ rõ: item rời `discovery` vào stage `planning` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời chuỗi soi-rõ mà verify còn placeholder giả.
- Context-discovery verdict chưa đủ rõ: item rời `discovery` vào `exploring` để đào sâu cùng người, rồi mới `exploring → planning`. Hai đường này là toàn bộ lối ra của `discovery`; không có cạnh nào đi thẳng tới `executing`.
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `planning → executing`, giữ nguyên verify đã có từ lúc rời chuỗi soi-rõ — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất, và verify THẬT của riêng nó; gốc chuyển `planning → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con ngã-ngũ (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `planning`, lượt sau phán lại từ đầu.
- Verdict chia có bất kỳ con nào thiếu verify thật, hoặc không có verdict nào đọc hiểu được: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw).
- Lượt quét cơ học của vòng tự hành gặp một item ở stage soi-rõ/lập-kế-hoạch mà không có verdict nào được cung cấp: để item nguyên tại chỗ, KHÔNG tự phán hộ và không throw — chờ một phiên sống tới quyết (RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong)).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua lượt quét soi-rõ rồi lượt quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery ra verdict chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần soi một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Item còn đỗ trên bí danh di sản `decompose`: vẫn đi tiếp được qua `decompose → executing` như trước, và tra ra đúng skill mà `planning` tra ra — bí danh không bao giờ làm một item mắc kẹt. Nhưng KHÔNG item mới nào tới được đó: phép tra "stage nào thỏa bước Chia-việc" luôn trả `planning`.
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.
- `take` không truyền `--id`: cầm đúng đầu frontier, mặc định `role=human`, ghi `headAtTake` và nửa dự đoán — chứng minh qua CLI thật. `take --id` một item đã bị cầm rơi thẳng xuống CAS của `move`, báo `conflict` thật (mã 3), không phải một thông điệp validation trùng lặp.
- `return` từ chối sạch khi working tree bẩn, hoặc khi HEAD chưa tiến so `headAtTake` (kể cả tree sạch nhưng zero tiến bộ thật) — cả hai `validation`, item giữ nguyên `doing`, không sự kiện nào ghi thêm.
- `return` verify xanh: `doing → awaiting-approval` + nửa thực tế, KHÔNG sinh settlement (settlement thuộc cạnh `→done`). `return` verify đỏ: `doing → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ của runner.
- `return` trên một item claim bởi runner (`claimRole: 'runner'`, không `headAtTake`) bị từ chối `validation` — cửa pull không đụng vào claim của runner.
- Một `fgos-runner --once` chạy song song khi một người đang cầm item qua `take`: gặt-lại lúc khởi động của runner KHÔNG BAO GIỜ giẫm claim đó (claim người cầm vô thời hạn) — chứng minh bằng e2e qua binary thật, chạy runner song song trước khi người `return` (xem spec Runner "Gặt-lại lúc khởi động").
- Cạnh `awaiting-approval→blocked` thiếu `reason` bị từ chối `validation`, cùng khuôn `awaiting-approval→todo` — test khóa (per pr-lifecycle).
- `return` verify xanh ghi `headAtReturn` lên đúng sự kiện `doing→awaiting-approval`; fold đọc lại được qua rebuild (mẫu `headAtTake`), vắng mặt cho một đề xuất của runner (không qua `return`) — test khóa (per pr-lifecycle).
- Reject/park mang `reason`: giá trị fold lên `item.reason`, đọc lại được qua rebuild (mẫu `claimRole`/`headAtTake`); một lần fold sau GHI ĐÈ lần trước (latest-wins, không cộng thêm) — test khóa cả hai chiều (per worker-execution STR33 / 396d9d9e).
- `take` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing`, ghi `branchHeadAtTake` (không `headAtTake`) — chứng minh qua CLI thật; `take` trên một item `blocked` KHÔNG mang nhánh sống vẫn xung đột như trước (không đường mới nào mở toang `blocked→doing`).
- `return` nguồn-nhánh (item mang `branchHeadAtTake`): đo trên nhánh KHÔNG đụng working tree host repo — verify chạy trong worktree tạm detached tại SHA nhánh, dọn trong `finally` dù thành công hay thất bại; verify xanh + có commit mới → `awaiting-approval` mang `branchHeadAtReturn`, KHÔNG BAO GIỜ mang `headAtReturn` — test khóa cả hai chiều (mutual exclusion) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- `return` nguồn-nhánh khi nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, item giữ `doing`, không sự kiện nào ghi thêm, tip nhánh không đổi — chứng minh bằng test thật.
- `fold` của `branchHeadAtTake`/`branchHeadAtReturn` qua rebuild: chỉ fold trên đúng cạnh của nó (`blocked→doing`/`doing→awaiting-approval`), không bao giờ lẫn với `headAtTake`/`headAtReturn` của cùng item hay của item khác — test khóa (write-side allowlist trong `store.mjs` + read-side fold trong `replay.mjs` đều được kiểm, đây là lỗ CRITICAL mà bee-validating từng gắn cờ trước khi cell dựng thật).
- `pick` không truyền `id`: cầm đúng đầu frontier, role CỐ ĐỊNH `session` (không đọc `--role`, cờ đó không tồn tại trên `pick`), dựng một nhánh + worktree THẬT (không detached) cho claim đó — chứng minh qua CLI thật.
- `pick <id>` trên một item đã `doing`: rơi thẳng CAS như `take`, báo `conflict` (mã 3), không double-claim.
- `pick` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing` (HỆT đường tái claim của `take`), rồi TÁI DÙNG worktree/nhánh sẵn có thay vì dựng bản sao.
- `createWorktree` ném lỗi SAU KHI claim của `pick` đã ghi thành công: lỗi lộ nguyên vẹn ra người gọi, claim KHÔNG bị hoàn tác/che giấu — chứng minh bằng một xung đột namespace nhánh git THẬT, không phải mock.
- `init` trong một repo git có 0 commit: `data.gitHeadless === true`, `init` vẫn thành công (không throw, không đổi mã thoát) — chứng minh qua CLI thật.
- `init` trong một repo git có ≥1 commit, hoặc ngoài một repo git hoàn toàn: không mang trường `gitHeadless` — hành vi/hình dạng output y hệt trước khi kiểm tra này tồn tại; lỗi đọc HEAD không bao giờ làm `init` thất bại (fail-safe, cùng khuôn với kiểm coexistence-manifest liền kề).
- Item mang `domain` lạ (không khớp sổ đăng ký) tới điểm đọc nóng (bộ lọc frontier, vòng tự hành, bảng chuyển-stage): rơi về `coding` kèm một cảnh báo, không crash vòng tự hành — test khóa.
- Item vắng `domain` (100% item hôm nay): mọi hành vi dispatch/chuyển-stage y hệt trước khi tính năng domain tồn tại — test khóa qua toàn bộ suite hiện có, không sửa một assertion nào (retrofit base-workflow-model).
- Đóng một item bằng cách nhảy cóc qua bước tổng hợp: không có cạnh nào để nhảy. `done` chỉ tới được từ `cleanup`, `cleanup` chỉ tới được từ `retrospective` — chuỗi tuần tự tự nó chặn, không cần một gate riêng gắn ở cửa `done` như trước.
- `fgos compound <id>` gọi trên một item KHÔNG ở `retrospective`: từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Gọi đúng lúc item ở `retrospective`: ghi nhãn lên bản ghi outcome, KHÔNG chuyển stage nào (không còn stage nào để chuyển).
- `move --to delivered` (hoặc `approve`) trên một item mang `acceptance` có ít nhất một clause `text` không rỗng nhưng `evidence` rỗng/vắng mặt: từ chối `precondition` (mã 2), nêu đích danh clause đó, item ở nguyên trạng thái/stage hiện tại, không sự kiện nào ghi thêm (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done), per str73-done-flip-cos-check / 0f3b6eb0).
- Cùng item trên, sau khi `edit --acceptance '<json đã điền evidence>'` rồi thử lại: đi qua — RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) luôn đọc trạng thái tươi, không có verdict lưu-đệm từ lần từ chối trước.
- Item mang `acceptance` mà MỌI clause đều có `evidence` không rỗng: qua `delivered` bằng cả hai lối vào, y hệt hành vi trước khi RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) tồn tại.
- Item KHÔNG mang `acceptance` (vắng mặt hoặc mảng rỗng): RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) không chạm tới — hành vi y hệt trước khi luật này tồn tại (per str73-done-flip-cos-check / 0e575f83).
- `add`/`submit`/`edit --acceptance` với giá trị JSON hỏng dạng (không parse được, không phải mảng, một clause thiếu `text` hoặc `text` rỗng): từ chối `validation` (mã 4), không sự kiện nào ghi thêm — cùng khuôn `--deps`/`--refs` hỏng dạng.
```

### docs/platform/work-state/spec.md#13-known-gaps-and-deferred-work

```text
## 13. Known Gaps And Deferred Work

- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (`discovery`/`exploring`/`planning`/`executing`) thay vì một loại cổng mới — xem "Giai đoạn Soi-rõ" và "Giai đoạn Lập-kế-hoạch".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (deferred). Riêng việc CLAIM một item đang `doing` bị bỏ quên (worktree không còn ai chỉnh sửa) đã có một cửa hẹp hơn: `pick`/`take` tự kiểm tra hoạt động file/worktree thật của claim cũ ngay trong đường CAS-conflict sẵn có, và tự động reclaim (reattach, không phá hủy) khi bằng chứng đủ kết luận — không phải timeout/nhắc-nhở chủ động, chỉ kích hoạt khi một session khác chủ động thử claim lại (docs/history/session-claim-liveness/CONTEXT.md).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc cửa pull take/return đã dựng, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — STR24, chưa làm (deferred).
- Trong một project mà bee đang nghỉ (phase terminal), guard hiện tại của bee chặn ghi trực tiếp vào `.fgos/` (cổng idle-intake theo-phase, allowlist tĩnh không biết territory manifest) VÀ vào worktree tmpdir (containment phi-phase, không quan tâm phase) — hai cơ chế độc lập, không nhắm riêng fgos; luồng qua verb CLI `fgos <verb>` (Bash) không bị chặn bởi cả hai. Gap thuộc cây bee, không sửa trong feature này; friction đã file (`.bee/backlog.jsonl`, severity P2) làm địa chỉ flip khi bee sửa (per install-coexistence / 8788e9bb; canary pin sự thật này — `docs/coexistence.md` Known Gaps, `docs/history/install-coexistence/reports/canary-run.md`).
- Ngữ cảnh soi của context-discovery (xem "Giai đoạn Soi-rõ" trên) chỉ mang cặp hỏi-đáp MỚI NHẤT của một item — bản ghi cổng gộp-mới-nhất, không giữ một lịch sử đầy đủ mọi vòng hỏi-đáp trước đó; nếu một vòng làm-rõ nhiều bước cần nhìn lại toàn bộ chuỗi hỏi-đáp, đó là mở rộng sau (per discovery-context STR30 / cfae0120, chấp nhận cho CoS hiện tại — accepted trade-off, không phải bug).
- Domain thứ hai thật SẢN XUẤT (vd marketing, chạy trên vòng thi công thật `runner/dispatch.mjs`, không chỉ minh họa) — sổ đăng ký đã dựng, `coding` đã retrofit, và nay có tới BA domain fixture (`synthetic`/`triage`/`fixture-marketing`) chạy hết cửa CLI (`add`/`submit --domain`) thật; nhưng cả ba đều là fixture dùng-một-lần. Một domain mang giá trị sản xuất thật vẫn là backlog STR18 tiếp tục (per base-workflow-model / 2ae492d8).
- **Phạm vi tài liệu này chưa phủ hết bề mặt verb.** Spec mô tả đầy đủ chiều vòng đời (`stage` + `status`) và các verb đi trên nó, nhưng CHƯA có mục riêng cho một số verb đang sống: `merge`, `show`, `schedule`, `gate-approve`, `gate-bypass`. Đây là nợ tài liệu của các tính năng đó, không phải khoảng hở của mô hình vòng đời — ghi nhận ở đây thay vì để `coverage` khai khống (xem frontmatter: `coverage: partial`).
- `repair` (ghi-đè-cả-file) KHÔNG lấy `.fgos/events.lock` — chỉ chạy khi không có tiến trình fgos nào đang sống; một `appendEvent` chen vào giữa lúc repair đọc và ghi-đè sẽ bị nuốt. Ghi nhận yêu cầu, không cưỡng chế (per fgos-multi-session-checkout Epic 3 / STR35; xem entry point `repair`).
- Lối tổng hợp (nay ở status `retrospective`) đã đóng vòng đầu-cuối: `compound --doc-type` ghi `docType` thật (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52), `--doc-path` ghi linkage nguồn↔tài-liệu (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)), kỹ năng `fgos-coding-compounding` phân loại quadrant và soạn tài liệu người-dùng-cuối, một tài liệu how-to thật đầu tiên đã được sinh có trích dẫn bằng chứng từ capture thật, và một chỉ mục đọc-theo-tag máy-đọc-được (`fgos docs-index` → manifest; area `enduser-docs-index`) đã liệt kê tài liệu đó kèm linkage ngược (per bước-3 compound-learn-enduser-docs). Còn mở, có chủ ý HOÃN sang slice sau: (a) **gộp-sống** — hợp nhất capture thành tài liệu prose sống (dựng lại từ nguồn qua linkage RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)/manifest, không mất chi tiết/cấu trúc) — chưa làm; (b) **backfill** nội dung di sản (critical-patterns.md, docs/decisions/) vào bốn quadrant — chưa làm; (c) bề rộng sản xuất tài liệu — mới một tài liệu/một quadrant (how-to) được chứng minh, chưa phủ cả bốn; (d) nghi vấn Diataxis-đủ-hay-không (CONTEXT) để lại cho slice gộp-sống; (e) kỹ năng `fgos-scribing` (đồng bộ BA-spec ở chặng tổng hợp) HOÃN có chủ ý — chỉ dựng khi một bước spec-sync thật được nối (Agent's Discretion, CONTEXT).

**Đã đóng:** dư lượng CAS verb-tương-tác-vs-verb-tương-tác (per fgos-multi-session-checkout Epic 3 / STR35) — từng liệt ở đây, nay đã sửa (xem RUL10 (tiền đề có ngưỡng) bổ chú 2 ở trên và `docs/history/store-atomic-rmw/`).
```

### docs/platform/work-state/spec.md#unheaded-block-95

```text
- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (`discovery`/`exploring`/`planning`/`executing`) thay vì một loại cổng mới — xem "Giai đoạn Soi-rõ" và "Giai đoạn Lập-kế-hoạch".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (deferred). Riêng việc CLAIM một item đang `doing` bị bỏ quên (worktree không còn ai chỉnh sửa) đã có một cửa hẹp hơn: `pick`/`take` tự kiểm tra hoạt động file/worktree thật của claim cũ ngay trong đường CAS-conflict sẵn có, và tự động reclaim (reattach, không phá hủy) khi bằng chứng đủ kết luận — không phải timeout/nhắc-nhở chủ động, chỉ kích hoạt khi một session khác chủ động thử claim lại (docs/history/session-claim-liveness/CONTEXT.md).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc cửa pull take/return đã dựng, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — STR24, chưa làm (deferred).
- Trong một project mà bee đang nghỉ (phase terminal), guard hiện tại của bee chặn ghi trực tiếp vào `.fgos/` (cổng idle-intake theo-phase, allowlist tĩnh không biết territory manifest) VÀ vào worktree tmpdir (containment phi-phase, không quan tâm phase) — hai cơ chế độc lập, không nhắm riêng fgos; luồng qua verb CLI `fgos <verb>` (Bash) không bị chặn bởi cả hai. Gap thuộc cây bee, không sửa trong feature này; friction đã file (`.bee/backlog.jsonl`, severity P2) làm địa chỉ flip khi bee sửa (per install-coexistence / 8788e9bb; canary pin sự thật này — `docs/coexistence.md` Known Gaps, `docs/history/install-coexistence/reports/canary-run.md`).
- Ngữ cảnh soi của context-discovery (xem "Giai đoạn Soi-rõ" trên) chỉ mang cặp hỏi-đáp MỚI NHẤT của một item — bản ghi cổng gộp-mới-nhất, không giữ một lịch sử đầy đủ mọi vòng hỏi-đáp trước đó; nếu một vòng làm-rõ nhiều bước cần nhìn lại toàn bộ chuỗi hỏi-đáp, đó là mở rộng sau (per discovery-context STR30 / cfae0120, chấp nhận cho CoS hiện tại — accepted trade-off, không phải bug).
- Domain thứ hai thật SẢN XUẤT (vd marketing, chạy trên vòng thi công thật `runner/dispatch.mjs`, không chỉ minh họa) — sổ đăng ký đã dựng, `coding` đã retrofit, và nay có tới BA domain fixture (`synthetic`/`triage`/`fixture-marketing`) chạy hết cửa CLI (`add`/`submit --domain`) thật; nhưng cả ba đều là fixture dùng-một-lần. Một domain mang giá trị sản xuất thật vẫn là backlog STR18 tiếp tục (per base-workflow-model / 2ae492d8).
- **Phạm vi tài liệu này chưa phủ hết bề mặt verb.** Spec mô tả đầy đủ chiều vòng đời (`stage` + `status`) và các verb đi trên nó, nhưng CHƯA có mục riêng cho một số verb đang sống: `merge`, `show`, `schedule`, `gate-approve`, `gate-bypass`. Đây là nợ tài liệu của các tính năng đó, không phải khoảng hở của mô hình vòng đời — ghi nhận ở đây thay vì để `coverage` khai khống (xem frontmatter: `coverage: partial`).
- `repair` (ghi-đè-cả-file) KHÔNG lấy `.fgos/events.lock` — chỉ chạy khi không có tiến trình fgos nào đang sống; một `appendEvent` chen vào giữa lúc repair đọc và ghi-đè sẽ bị nuốt. Ghi nhận yêu cầu, không cưỡng chế (per fgos-multi-session-checkout Epic 3 / STR35; xem entry point `repair`).
- Lối tổng hợp (nay ở status `retrospective`) đã đóng vòng đầu-cuối: `compound --doc-type` ghi `docType` thật (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52), `--doc-path` ghi linkage nguồn↔tài-liệu (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)), kỹ năng `fgos-coding-compounding` phân loại quadrant và soạn tài liệu người-dùng-cuối, một tài liệu how-to thật đầu tiên đã được sinh có trích dẫn bằng chứng từ capture thật, và một chỉ mục đọc-theo-tag máy-đọc-được (`fgos docs-index` → manifest; area `enduser-docs-index`) đã liệt kê tài liệu đó kèm linkage ngược (per bước-3 compound-learn-enduser-docs). Còn mở, có chủ ý HOÃN sang slice sau: (a) **gộp-sống** — hợp nhất capture thành tài liệu prose sống (dựng lại từ nguồn qua linkage RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)/manifest, không mất chi tiết/cấu trúc) — chưa làm; (b) **backfill** nội dung di sản (critical-patterns.md, docs/decisions/) vào bốn quadrant — chưa làm; (c) bề rộng sản xuất tài liệu — mới một tài liệu/một quadrant (how-to) được chứng minh, chưa phủ cả bốn; (d) nghi vấn Diataxis-đủ-hay-không (CONTEXT) để lại cho slice gộp-sống; (e) kỹ năng `fgos-scribing` (đồng bộ BA-spec ở chặng tổng hợp) HOÃN có chủ ý — chỉ dựng khi một bước spec-sync thật được nối (Agent's Discretion, CONTEXT).
```

### docs/platform/work-state/spec.md#unheaded-block-96

```text
**Đã đóng:** dư lượng CAS verb-tương-tác-vs-verb-tương-tác (per fgos-multi-session-checkout Epic 3 / STR35) — từng liệt ở đây, nay đã sửa (xem RUL10 (tiền đề có ngưỡng) bổ chú 2 ở trên và `docs/history/store-atomic-rmw/`).
```

### docs/platform/work-state/spec.md#14-presentation-surface

```text
## 14. Presentation Surface

Not applicable — không có màn hình.
```

### docs/platform/work-state/spec.md#unheaded-block-97

```text
Not applicable — không có màn hình.
```

### docs/platform/work-state/spec.md#15-source-provenance-and-coverage

```text
## 15. Source Provenance And Coverage

---
area: work-state
updated: 2026-08-12
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, install-coexistence, discovery-context, worker-execution, fan-out-parallel, human-rounds, work-item-verb-surface, base-workflow-model-s1, base-workflow-model-s2, self-improve-loop, work-graph-intelligence-s1, work-graph-intelligence-s2a, work-graph-intelligence-s2b, entry-standardization, work-id-tsk-hash, p50-workflow-induct, str61-chat-context-continuity, str68-discovery-judge-robustness, compound-learn-enduser-docs, str77-79-doc-gap-fixes, str83-fgos-slash-commands, str86-runner-headless-git, str73-done-flip-cos-check, str93-discovery-precedence-labels, str7-str8-priority-intent, str51-llm-assist-classify, str46-io-contract-lat2, str46-io-contract-lat3, spec-docs-lifecycle-realignment]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, f1715488, 8788e9bb, cfae0120, 396d9d9e, 2e92b7a5, 5a6900b2, b28487af, 2ae492d8, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, a2146274, 896219a7, b5c0ba0c, b2d18cc7, b0da87aa, 8cf7effe, 81322763, 28e6184b, 14091e58, 19330e09, bce79d8a, 87536f3f, 9c67c3d1, 6aa67ae4, 1c776c56, 1d336d8a, ea8b9a8d, 757e5dd7, ecfd0d1a, 0f3b6eb0, 0e575f83, ee0f95c3, f69951df, f176c18a, d3445024, a5825b8b, a58a7563, 11d5ebc4, 10a740da, 8fc155eb]
coverage: partial
---
```

### docs/platform/work-state/spec.md#unheaded-block-98

```text
---
area: work-state
updated: 2026-08-12
sources: [phase-1-state-layer, phase-1-review-fixes, phase-2-routing-s1, phase-2-routing-s2, phase-3-compound-learning-s1, phase-3-compound-learning-s2, phase-3-compound-learning-s3-closeout, async-human-gate, stage-intake, stage-clarify, stage-decompose-s1, stage-decompose-s2, pr-lifecycle-s1, install-coexistence, discovery-context, worker-execution, fan-out-parallel, human-rounds, work-item-verb-surface, base-workflow-model-s1, base-workflow-model-s2, self-improve-loop, work-graph-intelligence-s1, work-graph-intelligence-s2a, work-graph-intelligence-s2b, entry-standardization, work-id-tsk-hash, p50-workflow-induct, str61-chat-context-continuity, str68-discovery-judge-robustness, compound-learn-enduser-docs, str77-79-doc-gap-fixes, str83-fgos-slash-commands, str86-runner-headless-git, str73-done-flip-cos-check, str93-discovery-precedence-labels, str7-str8-priority-intent, str51-llm-assist-classify, str46-io-contract-lat2, str46-io-contract-lat3, spec-docs-lifecycle-realignment]
decisions: [9ac6ca50, 0790031c, 451ca088, fd17309a, 55ad2f9f, feed7428, 1a80b4d3, 65c642a8, 9f6b52c8, 9a19eea5, 96a65365, a7c099af, 43f257ae, 44936500, e1218b22, 6f2cbc47, a30a3d3c, 1359ab5e, f1715488, 8788e9bb, cfae0120, 396d9d9e, 2e92b7a5, 5a6900b2, b28487af, 2ae492d8, 76b7a36b, 8d04bba3, 1cd895e1, 38160a70, a2146274, 896219a7, b5c0ba0c, b2d18cc7, b0da87aa, 8cf7effe, 81322763, 28e6184b, 14091e58, 19330e09, bce79d8a, 87536f3f, 9c67c3d1, 6aa67ae4, 1c776c56, 1d336d8a, ea8b9a8d, 757e5dd7, ecfd0d1a, 0f3b6eb0, 0e575f83, ee0f95c3, f69951df, f176c18a, d3445024, a5825b8b, a58a7563, 11d5ebc4, 10a740da, 8fc155eb]
coverage: partial
---
```

### docs/platform/work-state/spec.md#16-related-files

```text
## 16. Related Files

- [README.md](README.md)
- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)
- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)
- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)
- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)
- [docs/specs/work-state.md](../../specs/work-state.md)
- [docs/io-contract.md](../../io-contract.md)
```

### docs/platform/work-state/spec.md#unheaded-block-99

```text
- [README.md](README.md)
- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)
- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)
- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)
- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)
- [docs/specs/work-state.md](../../specs/work-state.md)
- [docs/io-contract.md](../../io-contract.md)
```
