<!-- Nguồn: kết quả của một lần chạy `fgos run` chỉ đọc (capability `advise`, rigor `critical`, tier `flagship`, model `opus`, effort `high`), unit run `unit-run-1792563462536-7842f4a8`, ngày 2026-10-21. Chạy bằng `opus` vì `runner.maxTier` là `flagship`; chưa chạy bản `fable`. Nội dung dưới đây là nguyên văn báo cáo của agent, chưa phải quyết định của owner. -->

# Rà soát thẩm quyền và ranh giới: engine quản lý luật và instruction của agent

Viết ngày 2026-10-21 (Asia/Saigon), chỉ đọc, trên `main` (HEAD `37992ef82`, cây làm việc có thay đổi chưa commit ở `AGENTS.md` và `.claude/settings.json`). Nhánh kế hoạch 260925 đọc ở `origin/plan/260925-documentation-authority-unification` = `168a27c6c`; đầu nhánh thật `763568157` không có trong repo này, nên chi tiết Phase 8 Bước 4 lấy từ board.

## 1. Kết luận

Engine luật chính là **Agent Context Engine** (ACE), và đây không phải chọn mới: owner đã chốt ở RUL102 (2026-10-17, `docs/specs/distribution.md:362`) rằng việc ghép và chọn luật có một chủ là ACE, còn packaging-distribution chỉ phát hiện, cài, render theo host và sửa; proposal §4.7.2, plan 260925 §12.2 và PF-I007 cùng nói ACE là thẩm quyền dẫn xuất tách riêng. Em giữ quyết định đó và chỉ bổ sung chỗ nó chưa nói: ACE là một **component thẩm quyền riêng, viết bằng Node, lõi thuần không I/O, nói chuyện với bên ngoài qua port**, chưa thành crate hay package mới; hạt giống `instruction-registry.mjs` và `instruction-composition.mjs` dời sang module riêng trong cùng thay đổi với lát chọn luật và ngân sách đầu tiên, đúng "weight guard" của RUL102. Quan hệ với document engine là **(b) phụ thuộc một chiều**: ACE đọc chân lý chuẩn (văn bản luật khoá, quyết định và chuỗi supersede, id claim, bí danh) qua một port đọc, còn document engine không bao giờ biết ACE, host, vai hay ngân sách. Gộp ACE vào document engine sai về phân tầng (tầng dưới phải biết khái niệm của tầng trên), sai về thẩm quyền (trộn chân lý chuẩn với lát cắt dẫn xuất) và sai thời điểm (document engine đang ở giữa cắt chuyển). Rust chưa cần, vì mọi bên dùng ACE hiện là Node và đường nóng (hook mỗi lượt) có thể đọc lát cắt đã biên dịch sẵn, không cần ghép lúc chạy.

Có một phát hiện cụ thể ảnh hưởng ngay tới thiết kế: `src/setup/instruction-registry.mjs:18-19` import `../state/store.mjs` (`listWork`) và `../report/decision-index.mjs` để kiểm bằng chứng supersede. `test/architecture.test.mjs:770-791` (guard A4) cấm mọi file dưới `src/runner/dispatch/**` và `src/runner/execution/**` chạm tầng Work, kể cả gián tiếp, và `src/state/` thuộc tầng Work. Nghĩa là nếu bộ dựng brief (`src/runner/dispatch/brief.mjs`) gọi thẳng engine như hôm nay, test kiến trúc đỏ. Đọc quyết định phải đi qua port do composition root nối vào; đây là điều kiện số một của lát đầu.

## 2. Các phương án

| Phương án | Phân tầng | Một thẩm quyền | Một cửa | Trung lập CLI | Thời điểm so với Phase 9 | Chi phí chuyển | Rủi ro |
|---|---|---|---|---|---|---|---|
| A. Gộp vào document engine | Xấu | Xấu | Trung bình | Tốt | Xấu nhất | Cao | Cao |
| **B. Component riêng (ACE, Node, lõi thuần, port)** | **Tốt** | **Tốt** | **Tốt** | **Tốt** | **Xen kẽ được** | **Vừa** | **Vừa** |
| C. Để trong packaging-distribution, mở rộng `src/setup` | Trung bình | Xấu | Tốt | Trung bình | Tốt | Thấp | Vừa, tăng dần |
| D. Đặt vào runner, agent-protocol hoặc mailbox | Xấu | Xấu | Xấu | Xấu | Tốt | Vừa | Cao |
| E. Component riêng nhưng Rust-first ngay | Tốt | Tốt | Tốt | Tốt | Xen kẽ được | Cao | Vừa |

**A. Gộp vào document engine.** Document engine (Knowledge and Documentation Engine của proposal §4.7.1) sở hữu danh tính tài liệu, claim, quyết định, đồ thị, bí danh. Nếu nó cũng chọn luật theo capability, vai, điểm inject và ngân sách byte của từng CLI, tầng dưới phải biết khái niệm của Execution Core và của host: trái nguyên tắc 2 ("a lower layer never knows the layers above it"). Nó cũng trộn chân lý chuẩn với lát cắt dẫn xuất, điều proposal §4.7 ("should not become one oversized Documentation Registry component"), plan 260925 quyết định khoá 7 và §12.2 đều cấm. Về thời điểm, đây là phương án tệ nhất: document engine đang ở Phase 8, bản vá Phase 9 khoá theo digest, quá 10% entry lệch thì phase dừng (`phase-08-draft.md`, điều kiện dừng 4), và proposal §9.4 cấm H3 chặn H1.

**B. Component riêng.** Đúng hình mà RUL102, proposal và PF-I007 đã vẽ. Mỗi bên giữ một loại quyết định: document engine giữ chân lý, ACE giữ lựa chọn, packaging-distribution giữ cách ghi ra file, Execution Core giữ thời điểm xin gói cho brief. Chi phí là dời hai file hạt giống (khoảng 1.280 dòng) cùng test và thêm hai port. Rủi ro chính là va chạm với Phase 9 ở đúng hai chỗ (mục 5), xử lý được bằng ranh giới tập file.

**C. Ở lại packaging-distribution.** Rẻ nhất trước mắt, nhưng RUL102 đã liệt kê đúng phương án này vào "Rejected" (component cài đặt sẽ mọc vai quyết định nội dung). Chọn C là đảo quyết định owner mà không có bằng chứng mới.

**D. Đặt vào runner, agent-protocol hoặc mailbox.** Agent-protocol là adapter thuần theo CLI, "never builds argv", không biết nội dung; mailbox review (bài học B1, B11) đã chỉ ra cái giá của việc nhét tri thức sai chỗ. Đặt bộ chọn luật trong Execution Core thì đường giao tĩnh (setup ghi `AGENTS.md`) phải import runner, sai chiều; và hai đường giao (tĩnh, động) sẽ dần thành hai bộ ghép, đúng điều RUL102 sinh ra để chặn.

**E. Rust-first ngay.** Nguyên tắc 4 nói nền tảng dùng khắp hệ (danh tính phiên, terminal) làm bằng Rust. ACE là thẩm quyền nội dung tầng giữa; mọi bên gọi nó hôm nay là Node (setup, `brief.mjs`, cửa `fgos hook` trong legacy-node), nên Rust ngay nghĩa là thêm route host hoặc N-API mà không có người dùng Rust nào cần. Điều kiện để chuyển Rust ghi ở mục 6.

## 3. Bản đồ ranh giới đề xuất

Chiều phụ thuộc: **document engine nằm dưới, ACE ở giữa, các cửa giao nằm trên.** Không có cạnh ngược nào.

| Component | Sở hữu | Không sở hữu | Phụ thuộc | Ai phụ thuộc nó | Contract nối |
|---|---|---|---|---|---|
| Knowledge and Documentation Engine (hôm nay rải ở `src/state/knowledge-registry.mjs`, `state.decisions` trong kho Work, `fgos decision-index`, công cụ 260925 trên nhánh) | Văn bản chuẩn của L1–L10, RUL, D-ADR; id claim và quyết định; chuỗi supersede; bí danh đường dẫn; kiểm con trỏ và neo trong văn xuôi (doc-health, Phase 10 `fgos doc check`) | Chọn luật, vai, CLI, ngân sách, điểm inject | Kho state | ACE (đọc) | Port đọc `RuleAuthoritySource`: nhận id bất biến (`L8`, `RUL102`, `D-ADR0062`), trả trạng thái hiệu lực hay đã bị thay, câu chuẩn hoặc neo, digest |
| **Agent Context Engine** (module riêng, Node, lõi thuần) | Schema đơn vị luật; biên dịch và kiểm đơn vị; ghép theo kind (law, boundary, procedure, preference), xung đột thì fail; chọn theo trục phạm vi, capability, vai ghế, điểm inject; ngân sách và giảm theo độ sâu; khử trùng dựa trên tập đã giao; manifest gói (id nguồn, digest, phần bị bỏ kèm lý do); kiểm ngữ nghĩa luật | Tên CLI, cú pháp file, ghi file, đọc filesystem, văn bản chuẩn của luật khoá, kho Work | Port nguồn (`InstructionSourcePort`), port thẩm quyền (`RuleAuthoritySource`), danh sách capability đã đăng ký (truyền vào như dữ liệu) | Packaging-distribution, Execution Core, cửa hook, doctor | `compose(request) -> packet`; `request` gồm đối tượng (phạm vi, capability, vai ghế, điểm inject), `budgetBytes`, `alreadyDelivered`; `packet` là tập hiệu lực JSON có manifest |
| Packaging-distribution (`src/setup/instruction-projections.mjs`, `agent-hooks.mjs`, `registrations.mjs`) | Phát hiện và cài nguồn luật (cài đặt adapter cho `InstructionSourcePort`); adapter render theo CLI: tên file tự nạp, trần byte, cú pháp; ghi `.fgos/instructions/effective/*`; projection ledger; cài hook cho 5 CLI; bảng "CLI nào hỗ trợ điểm inject nào" (dữ liệu adapter, nhóm C2 đo); check doctor của bản chiếu (cũ, sửa tay, header) | Chọn và ghép luật | ACE | Setup, doctor | Tập hiệu lực JSON v1; projection ledger (mở rộng digest tập hiệu lực và adapter theo contract §12) |
| Execution Core (`fgos run`, `src/runner/dispatch/brief.mjs`) | Thời điểm xin gói cho brief; khai capability, vai ghế, `writes` của Unit; ghi manifest gói vào `.fgos/assignments/<unitRunId>/` cạnh brief | Nội dung luật, chọn luật | ACE qua port do composition root nối (giữ guard A4) | Worker mọi CLI | `ContextPacketPort.forUnit(unit, seat)`; manifest gói là một artifact của run |
| Cửa hook (`fgos hook <kind>`, Host and Surface Layer) | Một kind mới cho điểm inject sở hữu (đầu phiên, mỗi lượt, giao subagent, nén ngữ cảnh) chỉ đọc lát cắt đã biên dịch; dạng payload vào ra theo CLI (`--format=agy` đã có); ghi một dòng giao | Chọn luật | Lát cắt do packaging-distribution ghi | Phiên tương tác | Lát cắt theo điểm inject (file JSON) |
| Agent protocol | Gõ con trỏ một dòng và xác nhận (`deliver_brief`) | Mọi nội dung luật, render | Terminal-control | Run supervisor | Không đổi |
| Agent mailbox | Khung peer | Văn bản luật peer-input (là một đơn vị trong sổ luật, bài học B11) | | | Không đổi |
| Observe | Đo byte, đếm nạp trùng, phép thử hành vi | Chọn, ghi gói | Đọc manifest gói trong thư mục assignment (như đã đọc run result) và dòng giao của hook | | `ObservationSource` |
| Convention | Tên và đường dẫn của artifact sinh ra | Con trỏ và neo trong văn xuôi (spec của nó tự loại ra) | | | `fgos convention path` |
| Setup và doctor | Gom check và fix | Logic kiểm | Mỗi chủ đăng ký check của mình | | `registerCheck` |

Vài điểm chốt bằng phân tích, không cần hỏi:

- **Mâu thuẫn nhỏ trong RUL102 (14.18)** ("ngân sách theo host" và "engine không biết host"): ACE nhận `budgetBytes` như một con số; tri thức "Codex trần 32 KiB" nằm ở adapter của packaging-distribution. Hai câu cùng đúng.
- **"Phát hiện nguồn" thuộc ai:** RUL102 vừa gọi registry là hạt giống của engine, vừa giao "source discovery and install" cho packaging-distribution. Tách theo việc: biên dịch và kiểm một đơn vị (`compileInstructionUnit`, từ vựng kind, scope, mode) về ACE; đi filesystem và đọc `architecture-manifest.json` để biết chủ (`discoverInstructionSources`, `discoverKnownOwners`) thành adapter của `InstructionSourcePort` ở packaging-distribution. Lợi ích kèm theo: project dùng fgOS có thể đưa gốc luật của chính nó qua cùng port (14.21), và đường dẫn manifest cứng ở `instruction-registry.mjs:458` (mà Phase 9 phải vá) ra khỏi ACE.
- **"Việc" là capability, không phải stage của skill.** `core/skills/_shared/capability-catalog.md` nói rõ capability "never a task instance, a Work item, a lifecycle stage, a skill name". Luật riêng của một skill dùng `scope: skill` đã có.
- **Domain đọc từ capability, không từ thư mục.** `serves.domain` của capability (`code`, `docs`) đã nằm trong config của Execution Core; đơn vị luật khai domain bằng từ vựng đó. Thư mục `domains/coding/` chỉ là trục chủ sở hữu (`owner: coding`). Không cần bảng ánh xạ `coding` sang `code` ở ACE, và ACE không phải đọc `domains/*/registry.yaml` (guard A4 xếp domain registry vào tầng Work).
- **Vai dùng từ vựng ghế của Execution Core** (`producer`, `checker`, `synthesizer`, `judge`...), không đặt bộ thứ tư. Repo đã có ít nhất ba bộ vai: ghế pattern, `roleGraph` của `domains/coding/registry.yaml` (`implementer`, `reviewer`...), và "big lead, lead, worker, reviewer" của handoff. "Big lead" và "lead" là đầu tương tác, máy không phân biệt được; luật cho họ đi qua file tự nạp, hook, và mẫu brief mà fgOS sở hữu.

## 4. Chia sở hữu từng mảnh

| Mảnh | Chủ | Ghi chú |
|---|---|---|
| Schema đơn vị luật (trường mới: nguồn gốc bằng id, lý do, điều kiện kích hoạt, hành động kiểm được, hạn, máy kiểm hoặc lý do không có, capability, vai ghế, điểm inject) | ACE | Trường "điều kiện kích hoạt" và "điểm inject" phải gộp với `scope`, `appliesTo`, `renderHints` đã có trước khi thêm, để không có hai trường cùng nghĩa |
| Danh sách điểm inject trừu tượng (đầu phiên, mỗi lượt, trước hoặc sau hành động, giao subagent hoặc brief, nén ngữ cảnh) | ACE (từ vựng) | Dữ liệu, không phải lớp code |
| Bảng CLI nào hỗ trợ điểm nào, tên file tự nạp, trần byte | Packaging-distribution (adapter theo CLI) | Đo thật, không suy từ Claude |
| Bộ ghép, bộ chọn, ngân sách, khử trùng | ACE | Khử trùng phần lớn tính được: worker là phiên mới, chỉ đã nhận lát tĩnh của CLI đó, nên `alreadyDelivered` là digest của lát tĩnh, không cần đọc nhật ký |
| Render theo CLI ra file | Packaging-distribution | Bỏ phần nguồn gốc khỏi bản render (14.16) |
| Kênh file tự nạp | Packaging-distribution | |
| Kênh brief | Execution Core | `prompt-templates.mjs` bị guard A4 xếp vào tầng Work, nên mẫu brief của Work (có mục Iron Law hỏng, 1A.2) cũng phải xin gói qua cùng port chứ không giữ văn bản luật riêng |
| Kênh hook | Cửa `fgos hook` (chạy), packaging-distribution (cài) | Một cửa hook, như bài học B6 của mailbox |
| Nhật ký inject | Bên giao ghi (brief: manifest trong thư mục assignment; hook: một dòng mỗi lần giao); Observe đọc | Không lập kho mới cho đường brief; Execution Core đã ghi provenance tại `.fgos/assignments/<unitRunId>/` |
| Kiểm ngữ nghĩa luật (trùng id, xung đột không thứ tự, ghi đè law, thiếu điều kiện kích hoạt, id nguồn gốc không phân giải được, vượt ngân sách bắt buộc, luật mới không nói thay luật nào) | ACE, đăng ký vào doctor | Mẫu ratchet và ngoại lệ của plan DOC dùng lại được |
| Kiểm bản render (cũ, sửa tay, header) | Packaging-distribution | `instruction-projections-stale` đã có |
| Kiểm con trỏ chết và neo trong văn xuôi | Document engine (doc-health, `fgos doc check` ở Phase 10) | Convention không nhận việc này |
| Tên, đường dẫn artifact | Convention | |
| Từ vựng capability | Execution Core (`runner.capabilities`, `DEFAULT_CAPABILITY_SLOTS`) | ACE nhận danh sách như dữ liệu và kiểm giá trị khai trong đơn vị |

## 5. Thứ tự chuyển đổi và quan hệ với Phase 9

PF-I007 và RUL102 không thật sự đối nghịch. Điều kiện mở lại của PF-I007 ("canonical platform corpus and minimum graph/decision reduction can support deterministic selection") là điều kiện của hai phân hệ cần duyệt đồ thị tài liệu: Reading Plan Compiler và Effective Decision Reducer. Instruction Composer, Context Budgeter và Context Explainability chỉ đọc đơn vị luật ở `core/instructions/`, `domains/*/instructions/`, `components/*/instructions/`, không cần đồ thị. Proposal §9.4 cho phép làm nguyên mẫu trước H1 miễn không thành thẩm quyền thứ hai. Vậy em quyết: **xen kẽ theo tập file**, phần đọc đồ thị đợi sau Phase 9, và khi lát đầu land thì PF-I007 chuyển `partial` kèm ghi "must not preclude" (nguồn gốc bằng id, digest, seam đọc quyết định).

**Trước Phase 9 (không chạm `docs/**`, `AGENTS.md`, `CLAUDE.md`, gốc skill, và không chạm file nguồn mà manifest Phase 8 đã khoá digest):**
1. Spec trước code (cổng AGENTS.md): một area mới `docs/platform/agent-context/spec.md`, theo đúng tiền lệ `agent-mailbox` và `workflow.md` đã land trong lúc DOC chạy; báo DOC đây là một area mới để họ hấp thụ ở lần sync.
2. Dời hạt giống sang module riêng của ACE, thêm hai port (nguồn, thẩm quyền), bỏ import `state/store.mjs` khỏi lõi. Việc này chạm `src/setup/instruction-registry.mjs`, mà bản nháp Phase 8 có một bản vá Phase 9 cho đường dẫn manifest mặc định ở file này (`phase-08-draft.md` dòng 262, vì area map dời `docs/architecture-manifest.json` sang `docs/platform/contracts/`). Sau khi dời, bản vá đó thừa: đường dẫn manifest nằm ở adapter. Chỉ một entry phải đề xuất và review lại, xa dưới ngưỡng 10%.
3. Lát chọn theo capability, vai ghế, ngân sách, và đường giao động vào brief của `fgos run`; manifest gói ghi cạnh brief.
4. Máy kiểm ngữ nghĩa luật đăng ký vào doctor.

**Sau Phase 9:**
5. Chuyển `core/instructions/platform-laws.md` và các RUL thành đơn vị tham chiếu bằng id qua bộ giải bí danh (file này nằm trong nhóm A của manifest Phase 8, văn bản luôn nạp do owner duyệt; sửa trước Phase 9 làm lệch entry đó).
6. Viết lại khối render trong `AGENTS.md` (bỏ nguồn gốc, thêm lát theo CLI), kéo RUL11, RUL104 và phần viết tay trùng lặp vào sổ luật, chuyển contract `instruction-composition-and-projection.md` từ thư mục packaging-distribution sang spec của ACE.
7. Reading Plan Compiler và Effective Decision Reducer, khi đồ thị tối thiểu đã có.

**Cách không giẫm lên nhau:** ranh giới là tập file, không phải chủ đề. Trước Phase 9, làn luật không sửa byte nào trong `docs/**` ngoài area mới, không sửa `AGENTS.md`, `core/instructions/platform-laws.md`, gốc skill, `prompt-templates` hay `src/runner/dispatch/brief.mjs` cho tới khi biết chắc chúng không có entry trong manifest Phase 8 (em chưa kiểm được, xem mục 6). Lease cắt chuyển không phủ `core/instructions` và `src/setup/instruction-*` (14.3), nên trong cửa sổ lease phải có quy ước: không sinh lại khối `AGENTS.md` và không sửa đơn vị luật nào cho tới khi lease nhả.

## 6. Rủi ro, điều kiện đảo lại, và điều em không chắc

**Rủi ro.**
- Dời hạt giống làm lệch đúng một bản vá Phase 9 và làm ratchet ghi ngoại lệ cho spec area mới; nếu DOC đang ở bước nhạy (rehearsal), nên đợi bước đó xong.
- Schema mới phình thành nhiều trường trùng nghĩa với `scope`, `appliesTo`, `renderHints`; cần gộp trước khi thêm.
- Khử trùng dựa trên digest lát tĩnh giả định worker chỉ nạp lát tĩnh của fgOS; AgentKit (`.claude/rules/*`, hook `ak-*`) nạp thêm ngoài tầm kiểm, nên khử trùng chỉ đúng cho phần fgOS sở hữu.

**Điều kiện đảo lại quyết định.**
- Chuyển ACE sang Rust khi có người dùng Rust thật cần ghép lúc chạy (run supervisor dựng brief, mailbox, hoặc host phục vụ hook native), hoặc khi đo được hook mỗi lượt phải ghép lúc chạy và vượt ngân sách độ trễ (mailbox review đo hook Node 171 đến 223 ms mỗi lần).
- Xét gộp ACE với document engine chỉ khi đo được hai bên luôn đổi cùng nhau ở mọi thay đổi và port đọc trở thành gánh nặng; hiện chưa có bằng chứng nào như vậy.
- Nếu owner trả lời câu 2 là "chỉ repo fgOS", port nguồn vẫn giữ nhưng adapter cho project khác không làm.

**Không chắc, chưa kiểm được.**
- Manifest Phase 8 Bước 4 (331 file) có entry cho `src/runner/dispatch/brief.mjs`, `src/runner/prompt-templates*`, `domains/*/instructions/*` hay không: nhánh remote chỉ tới `168a27c6c`, đầu nhánh `763568157` không có ở đây. Cần hỏi `forgentx-5f` trước bước 2 và 3.
- Kết luận "chỉ một bản vá Phase 9 chạm `instruction-registry.mjs`" dựa trên bản nháp Phase 8 trên nhánh cũ, không phải manifest thật.
- Omp, pi, agy hỗ trợ điểm inject nào, trần byte bao nhiêu: chưa đo; `agent-hooks.mjs` cài hook cho cả 5 CLI nhưng em không kiểm sự kiện nào thật sự chạy.
- Lead có luôn được khởi bằng `fgos run` (và do đó là ghế `producer`) hay một phần do big lead mở pane trực tiếp: em không kiểm; nếu mở trực tiếp thì luật tới lead chỉ qua file tự nạp và mẫu brief viết tay của big lead.
- Impact-analysis: em không chạy GitNexus; quan hệ gọi dựa vào grep (`instruction-*` chỉ được gọi từ `src/setup/registrations.mjs` và test), đây là bằng chứng yếu theo cổng impact-analysis.

## 7. Bảy câu của đề bài, trả lời gọn

1. ACE là component riêng, Node trước, lõi thuần sau port; chưa thành crate.
2. Quan hệ (b): ACE phụ thuộc document engine qua port đọc; chiều ngược không có.
3. Hai lớp luật. Luật có thẩm quyền tài liệu (L1–L10, RUL, D-ADR): câu chuẩn ở document engine, chỉ đổi bằng supersede; sổ luật giữ **đơn vị tham chiếu** trỏ bằng id bất biến, chứa câu render ngắn, điều kiện kích hoạt, đối tượng, máy kiểm, cộng digest câu chuẩn để doctor báo khi câu chuẩn đổi. Luật vận hành không có nhà tài liệu (nguyên tắc thiết kế, mẫu câu hỏi, kỷ luật verify, phần fgOS của `.claude/rules`): sổ luật là nhà duy nhất. Hai điều trong đề bài chỉ xung đột về câu chữ; câu "sổ cái là nơi duy nhất được sửa" nên đổi thành "sổ luật là nơi duy nhất sửa cách luật được giao, và là nhà duy nhất của luật vận hành". Code hiện có đã mô hình đúng: `kind: law` không ghi đè được và supersede cần bằng chứng quyết định (`hasVerifiedSupersessionEvidence`).
4. Xem mục 4.
5. Xen kẽ theo tập file, mục 5.
6. B trung lập theo cấu tạo: ACE không biết tên CLI; tri thức theo CLI chia theo loại, mỗi loại một chủ (gõ và màn hình ở agent-protocol; cài hook, tên file, trần byte ở packaging-distribution; payload hook ở cửa hook). Brief của `fgos run` là điểm inject sở hữu chung duy nhất cho cả 5 CLI, nên là đường chính cho luật theo việc và theo vai.
7. Giữ riêng, chỉ nối bằng id. Projection ledger là trạng thái cài đặt (packaging-distribution). Sổ ý định PF-I### là tài liệu. Ledger claim của 260925 là công cụ di trú, sẽ nhập vào Claim registry của document engine sau cắt chuyển. Case ledger của Workflow không liên quan. Sổ luật là trạng thái nguồn (state theo L1), còn nhật ký inject là log; gộp chúng trái L1. Đề nghị đừng gọi sổ luật là "ledger": tên đã có là "instruction registry".

## 8. Câu hỏi cho owner

### Câu 1. Đổi câu "sổ cái là nơi duy nhất được sửa" thành hai lớp luật

**Chuyện gì đang xảy ra:** Hướng anh chốt ở handoff nhóm E nói sổ cái là nơi duy nhất được sửa, nhưng câu chuẩn của L1–L10, RUL và D-ADR nằm ở thẩm quyền tài liệu và chỉ đổi bằng supersede.
**Nguyên nhân:** Em đọc `core/instructions/platform-laws.md` (hiện chỉ là danh sách con trỏ vào `docs/platform-foundations.md`), contract §4 (bảng cho phép "locked platform law document" làm nguồn) và `hasVerifiedSupersessionEvidence` trong `instruction-registry.mjs`. Plan 260925 Phase 9 còn dời các file này, nên trỏ bằng đường dẫn sẽ gãy.
**Các lựa chọn:**
- (a) Hai lớp: đơn vị tham chiếu bằng id cho luật có nhà tài liệu, đơn vị gốc cho luật vận hành. Lợi: không có bản sao thứ hai của câu luật khoá, sống qua cắt chuyển. Hại: thêm một check digest. Chi phí: khoảng 100 đến 200 dòng ở ACE và doctor, làm sau Phase 9.
- (b) Chép toàn văn luật khoá vào sổ luật và coi sổ là nơi sửa. Lợi: một chỗ đọc. Hại: hai bản của cùng câu, trái "one claim has one canonical owner" của plan 260925 và luật supersede.
- (c) Sinh đơn vị luật khoá tự động từ tài liệu bằng generator (Q6 của D6). Lợi: không gõ tay. Hại: generator phải hiểu cấu trúc tài liệu đang bị dời; nên để sau (a).
**Khuyến nghị:** (a), và (c) chỉ khi số luật tham chiếu đủ lớn để gõ tay thành gánh.
**Phạm vi của câu trả lời:** "Có" cho phép sửa câu hướng đi trong handoff và thiết kế schema đơn vị tham chiếu; không cho phép sửa văn bản luật khoá nào.

### Câu 2. Engine phục vụ project dùng fgOS hay chỉ repo fgOS

**Chuyện gì đang xảy ra:** Check và fix bản chiếu luật chỉ chạy khi có `core/instructions` ở main checkout; project khác báo "nothing to project" (14.21).
**Nguyên nhân:** Em đã đọc lại `src/setup/registrations.mjs:3825-3829` và `:3852-3856`: cả check lẫn fix trả "core/instructions not found -- nothing to project" khi không có thư mục đó; bộ phát hiện nguồn đọc cứng ba gốc của repo này.
**Các lựa chọn:**
- (a) Thiết kế port nguồn ngay cho cả project dùng fgOS, làm adapter repo fgOS trước, adapter project khác khi có project cần. Lợi: hợp mission #1, #2 (D-ADR0035), không phải đổi contract sau. Hại: thêm một tham số cấu hình nơi đặt luật của project. Chi phí: thiết kế không đổi, adapter thứ hai khoảng vài chục dòng khi cần.
- (b) Chỉ repo fgOS. Lợi: nhỏ nhất. Hại: engine chỉ phục vụ mission #3, ngược ranh giới sứ mệnh.
**Khuyến nghị:** (a).
**Phạm vi của câu trả lời:** Quyết định hình port và mục "phạm vi" trong spec ACE; không cho phép cài luật vào project nào hay sửa config thật của workspace.

### Câu 3. Cho lát đầu land trước Phase 9 hay đợi

**Chuyện gì đang xảy ra:** Lát đầu của ACE (dời hạt giống, hai port, chọn theo việc và ngân sách, đường giao vào brief) chạm `src/setup/instruction-registry.mjs`, file có một bản vá Phase 9 đã soạn sẵn ở nhánh DOC.
**Nguyên nhân:** `phase-08-draft.md` dòng 262 trên nhánh remote; manifest thật (331 file) em không đọc được vì đầu nhánh không có ở máy này.
**Các lựa chọn:**
- (a) Land ngay, ranh giới theo tập file ở mục 5; trước khi bắt đầu nhắn `forgentx-5f` xác nhận danh sách file trong manifest và báo một entry sẽ phải review lại. Lợi: luật theo việc tới worker sớm, đúng ưu tiên Ship Faster của project dùng fgOS. Hại: DOC review lại khoảng một entry và hấp thụ một area spec mới. Chi phí phía DOC: dưới một giờ nếu chỉ một entry.
- (b) Đợi Phase 9 xong rồi mới làm. Lợi: không chạm nhánh DOC. Hại: Phase 9 chưa được phép chạy, nên làn luật có thể đứng nhiều ngày hoặc vài tuần; việc 1A, 2a ở báo cáo tham chiếu vẫn làm được.
- (c) Làm lát đầu nhưng để hạt giống nằm yên, viết ACE mới gọi vào nó. Lợi: không lệch bản vá. Hại: trái weight guard của RUL102 (dời trong cùng thay đổi), sinh hai nơi.
**Khuyến nghị:** (a), với điều kiện xác nhận manifest trước bước 2 và 3.
**Phạm vi của câu trả lời:** "Có" cho phép mở lại liên lạc với `forgentx-5f` (anh đã hoãn việc này tới khi cần) và lập plan cho lát đầu; không cho phép sửa file nào trong nhánh DOC hay trong `docs/**` ngoài area mới.

Các điểm em đã tự quyết theo phân tích (báo để anh biết, không hỏi): ACE là component riêng chạy Node; quan hệ một chiều qua port; ngân sách là tham số; "việc" là capability; domain lấy từ `serves.domain`; vai dùng từ vựng ghế; PF-I007 và RUL102 tương thích (phần đồ thị đợi sau Phase 9); bốn "ledger" giữ riêng; nhật ký inject do bên giao ghi, Observe đọc.
