# Vì sao hoàn tất advisory, không đem engine cũ trở lại

## Bối cảnh và trạng thái

Owner yêu cầu tách phần mới phát sinh khỏi plan single-door `261006-1415-fgos-single-door-mechanisms`. Đây là rationale/handoff cho mọi agent làm chung, không phải bằng chứng đã triển khai. Plan mới chỉ hoàn tất năng lực advisory bị thiếu trong migration; original plan tiếp tục config binding/render/doctor/dev door/root hygiene/doctrine. Không hồi sinh coordination engine.

## Những câu hỏi và phản biện của owner — phải đọc trước khi làm

| # | Owner đặt vấn đề | Điều agent phải trả lời bằng thiết kế/bằng chứng |
|---|---|---|
| 1 | Mục tiêu: “ba góc nhìn shaping, critique/red-team, specialist khi cần, dialogue/revise/close và quyền quyết định của người dùng” | Map từng hành vi đến task/consumer/outcome/quyền và proof thật; không thay bằng checklist đủ tên role |
| 2 | Có giữ được chức năng với skill nhỏ + runtime sẵn có, như tham chiếu herdr-cook-plan/checker khoảng 151 dòng? | Sự đơn giản nằm ở ít owner/contract và thao tác, không phải giữ một số dòng hoặc xây engine núp trong prompt |
| 3 | Có đủ đơn giản, chắc ăn, hay gần cuối plan mới lòi phần khác cần làm? | Early vertical slice phải qua trước canonical cutover/render; hụt prerequisite thì chặn tại đầu, không foundation/follow-up |
| 4 | Plan mới hay fix plan ban đầu? Phần thêm có khác mục tiêu ban đầu? | Thừa nhận scope mở rộng: sửa binding không đồng nghĩa hoàn tất advisory. Tách plan; doctor/root hygiene không phải chờ advisory |
| 5 | “tại sao bỏ engine cũ, giờ đem lại” | Không đem engine lại. Giữ cognitive capability vốn migration yêu cầu, dùng Workflow/Pattern/Unit/bind; chỉ ra từng thứ không được khôi phục |
| 6 | “đem lại có khiến hệ thống phình lên, chậm chạp và quay lại vấn đề như cũ” | Không trả lời “không” bằng niềm tin. Đếm owner/state/contract, starts/assignments/rounds, thao tác lead/human, latency/cost thực. Nếu không gọn thì thay thiết kế trước cutover |
| 7 | Bật Astra để đánh giá lại, không chỉ dựa vào review trước | Astra đã tìm bốn blocker mà hai reviewer trước bỏ sót. Review lại plan đã sửa không thay live proof; không lấy vote/APPROVE làm chất lượng |
| 8 | Tại sao chúng ta phải làm phần mới? | Migration cũ yêu cầu giữ advisory; source hiện chưa giữ đầy đủ. Đây là hoàn tất migration, không feature ngẫu hứng và không lý do chặn original hygiene |

Các mục 1,3–6,8 phản ánh lời hỏi trực tiếp trong phiên; mục 2 là yêu cầu đơn giản đã ghi trong plan sửa; không dùng bảng này để tự gán owner đã duyệt implementation hoặc đã chọn một architecture cụ thể.

## Vì sao bỏ engine cũ — evidence lịch sử

1. [P4 plan](../../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/plan.md), Overview: owner Q8 chốt các dạng thảo luận là năng lực phải giữ; engine chỉ là phương tiện. Chủ ý là chuyển chúng sang mô hình gọn tốt/nhẹ/đúng pattern/nhanh/ít tốn, không xóa năng lực.
2. `docs/specs/runner.md` §0047: quyết định “ai làm”, cửa chạy và posture bị phân mảnh giữa coordination/decide/placement/assignment policy. Unit, một bind(), Pattern nhỏ và confinement chung thay các owner chồng nhau.
3. Cùng spec §0048/0049: các facade tự lập lịch qua prose tạo sequencer chồng chéo; Workflow trở thành sequencer duy nhất. Chuyển semantics trở lại một prose scheduler sẽ lặp chính lỗi này.
4. Commit `2180b4e72701bb090288af8fe8021008d9d42079` ghi engine L4 retired, Rust/Node cleanup. Commit `42e37adf7` đưa architecture Workflow năm bước. Retirement đã xảy ra; không mặc định đảo ngược vì thấy migration thiếu.
5. P4 §Trạng thái thật và [acceptance-case-2](../../261001-0327-request-to-run-p4-discussion-patterns-engine-retirement/reports/acceptance-case-2.md): Workflow thật đã chạy nhưng old-v-new rerun NOT RUN/DONE_WITH_CONCERNS. `runner.md` §0050 cũng ghi comparison case5 NOT RUN. Không được nói đã chứng minh nhanh/rẻ/ngang hoặc hơn engine cũ.

## Vấn đề gặp phải và vì sao phát sinh plan riêng

Original single-door Phase01 muốn bỏ roster ghim executor/model. Khi đọc sâu thấy skill vẫn hứa retired actor/specialist APIs; xóa toàn bộ đoạn đó có nguy cơ xóa yêu cầu chức năng, còn đổi tên roster không làm lời hứa chạy được. Owner yêu cầu giữ đầy đủ hành vi qua skill mỏng. Phần đó được ghép vào old plan rồi mở rộng thành runtime contracts, khiến doctor/hygiene chờ unrelated advisory acceptance. Scope này nay được tách.

Astra chỉ ra bốn thiếu hụt source-backed:
- Red-team trước final synthesis không thấy packet cuối hoặc dissent bị synthesis xóa.
- Specialist need phát sinh trong critique/recommendation chưa có đường chuyển tiếp trước advice; không được đợi/giả human turn.
- Reviewed `findings` bị Workflow coi là fail, chặn synthesis/explanation dù dissent là outcome hợp lệ.
- Workflow lưu Unit ID sau runUnit trả về; snapshot definition không đủ reconnect Unit đang dở, có thể chạy lại việc đã settle.

Các sửa cần thiết đều ở owner có sẵn. Mỗi sửa phải chứng minh nhu cầu của contract advisory, không tổng quát hóa thành framework. Byte capture/provenance là điều kiện lời hứa resume/evidence; không thành hệ thống knowledge store mới.

## Giữ lại gì; tuyệt đối không đem lại gì

Giữ công việc nhận thức: frame/scout, ba góc nhìn độc lập, critique, review/red-team packet cuối, chuyên gia đúng câu hỏi, synthesize/explain và genuine human close/reopen. Cognitive task text không đồng nghĩa actor registry hoặc persona binding.

Không phục hồi `fgos coordination`, `CoordinationSession`, `CoordinationProtocol`, `FlowDefinition`, protocol packs như runtime thứ hai, static actors[], specialist-slot governance, session ledger/CAS riêng, PolicyPatch/binding thứ hai, scheduler/retry loop/per-seat lead choreography. Không sửa locked law bằng prose. Một sửa generic contract phải nằm ở Workflow/Unit/ref owner với default cũ và regression boundaries.

## Nguy cơ phình/chậm — chốt dừng, không lời bảo đảm

Finite analysis → reviewed recommendation → explanation/close và specialist khi thật cần là candidate design, không miễn nhiễm bloat. Nhiều Workflow starts/metadata prose có thể thành engine trá hình nếu driver phải tự giữ queue/retry/seat status/transition database.

Early gate phải ghi rõ: số starts/Units/assignments/rounds/định nghĩa/contracts mới; số lệnh lead và human interruptions; lead-active time, wall-clock, provider usage/cost khi đo được, latency riêng từng boundary; owner từng state/side effect. Đánh giá cả normal và material continuation, không chỉ normal pass thuận lợi. So với current registered entry trên cùng CASE nếu chạy được; báo thiếu capability của baseline, không coi baseline nhanh do bỏ chức năng là thắng. Old-engine comparison không bắt buộc phục hồi engine và vẫn NOT RUN nếu chưa đo.

STOP trước source cutover nếu cần second store/scheduler, hardcoded roster, manual seat authorization, duplicate work, unbounded specialist/review loop, fake human answer/pass, weakening confinement, hoặc complexity/friction không có lý do gắn mục tiêu. Người triển khai phải đề xuất cách nhỏ hơn trên primitives hiện có; nếu vẫn xung đột law/goal thì đưa tradeoff thật cho owner. Không đưa một numeric threshold bịa ra rồi tự nhận đã đạt “nhẹ”.

Giới hạn hai human material reopens và một specialist intervention/pass là lựa chọn mới đã nêu, không phải doctrine cũ hoặc guarantee runtime. Phase01 khóa ý nghĩa và giới hạn với mục tiêu đầy đủ; khi thiếu expertise sau giới hạn, báo advice chưa đủ căn cứ và giữ quyền owner, không giả recommendation hay tự defer thay người.

## Điều vẫn chưa biết

Live confinement, crash recovery/capture, mid-pass specialist, cognitive quality, thời gian và chi phí: NOT RUN. Astra re-review đồng ý cấu trúc sửa + early gate, không xác nhận chúng đã đạt. Cổng sớm thuộc Phase02 của plan mới; source cutover chỉ sau ACCEPT, installed-entry proof vẫn Phase04.

## Handoff

Đọc [plan.md](../plan.md), tài liệu này, [preservation matrix](advisory-preservation-matrix.md), rồi phase cần làm. Original single-door01 minimal binding/truth cleanup phải land trước new03 cùng canonical skill; không chặn cả plan mới/plan cũ theo quan hệ toàn-plan giả. Serialize spec/changelog/build/release artifacts bằng writer baton; không viết lại main của người khác. Tách plan là thay đổi tài liệu, không authorization triển khai.
