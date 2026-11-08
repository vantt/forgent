# Hướng dẫn cho máy owner: làm cứng Workflow (guide và case), T6

Hướng dẫn này cho máy owner và máy thứ ba (forgentX, mdview, mcp-skill-hub). fg-server2 tự land từng phase của T6 (quyết định 71, 7a). Mỗi phase có một mục bên dưới, xếp theo số phase. Plan: [`plans/261108-0934-harden-t6-workflow`](../261108-0934-harden-t6-workflow/plan.md).

## T6 đổi gì cho người dùng

- `fgos workflow gate` không còn nhận `--verify`. Gate chỉ chạy lệnh kiểm mà dự án khai báo (xem khối `--verify` ngay dưới).
- Câu trả lời cho gate chỉ do người trả lời. Bị từ chối nếu gọi từ bên trong một worker được dispatch. File round bị gài vào không được gấp vào ledger.
- Playbook không còn bước `integrate`. Merge chỉ ở cửa approve.
- Case giải phóng chỗ ghi của controller đã chết, không còn file reservation. Dòng doctor `workflow-case-bindings` do Workflow phán.
- Một định nghĩa workflow mà các step chờ nhau thành vòng bị từ chối lúc nạp, nêu tên các step.
- `fgos run --account X` mà lựa chọn đầu của seat là họ model khác bị từ chối bằng tên; thêm `--provider <họ của X>`. Account ghim không bao giờ chuyển seat sang pool khác.
- Đổi pattern giữa case được xét như một đường ngoài danh sách (unlisted route).
- `workflow start`, `answer`, `resume` mỗi cái một cửa; case không có thì từ chối `case-not-found`. `workflow status` hiện phán quyết binding, và với run có `--seats` thì cả account của từng seat.
- Lệnh mới `fgos workflow prune` dọn lịch sử case cũ (mặc định chạy thử, không xoá).
- `fgos workflow resume` chạy lại step hỏng vì hạ tầng; ledger nhỏ hơn nhiều.

## Thứ tự và lưu ý khi kích hoạt

- **(a) Kích hoạt khi không có `fgos run --case` nào đang chạy.** Thay đổi runtime của case bỏ file reservation; một run bản cũ đang ở giữa đặt chỗ và custody sẽ để lại reservation mà bản mới không đọc.
- **(b) Không rollback khi một run đã mở lại (resume) đang tiến.** Release cũ xem run đó là `failed`.
- **(c) Release cũ sau rollback không gỡ được binding mà release mới đã tạo.** Trước khi rollback: kết thúc hoặc đóng mọi case conductor đang mở. Sau rollback: `fgos doctor --fix` của release cũ gỡ binding còn sót.
- **(d) Id release:**
  - Release trước T6 (trước main `00b322fa4`): `674c76fb...`.
  - Release `ccc27c90...` đang chạy trên fg-server2 từ main `00b322fa4`.
  - Release `6f1fd31f3850...0729` đang chạy trên fg-server2 từ main `1ff899aac` (có đủ T6 từ bước đầu tới bước cuối; bản đóng T6 chỉ thêm tài liệu, một dòng chú thích và một dòng import). Lấy main mới nhất rồi build, stage, kích hoạt như thường lệ.
- Không đổi schema `~/.fgos/config.json`; không cần kích hoạt đồng loạt mọi máy. Riêng P09 đổi một crate Rust nên release phải build lại và kích hoạt (xem P09).

## Đổi lớn: `fgos workflow gate` không còn `--verify`

- `fgos workflow gate` không nhận `--verify` nữa (cờ lạ bị từ chối). `--capability` là bắt buộc.
- Danh sách slice không còn khoá `gate`.
- Gate chỉ chạy lệnh dự án khai báo ở `capabilities.<capability>.verify` trong config fgOS.
- Chưa khai báo thì gate từ chối, mã `gate-command-missing`, câu: `a gate runs the command declared as capabilities.<capability>.verify: declare it and pass --capability <capability>`.
- **Việc owner phải làm (chúng tôi không sửa config nào):** mọi máy khác có chạy gate phải khai báo `capabilities.code:implement.verify` trong config fgOS (của dự án hoặc global). Giá trị là lệnh kiểm một thay đổi code, ví dụ lệnh test của dự án. Làm việc này trước khi dùng `fgos workflow gate --capability code:implement`.
- `fgos workflow propose --request ... --verify` (định cỡ một run đơn) là cờ khác và giữ nguyên.
- Dòng gate mà `propose` in ra luôn là `--capability code:implement`.
- Quay lại: release cũ vẫn nhận `--verify` (đây chỉ là chữ lệnh, không phải dữ liệu đĩa).

## P01: đồng ý và biên nhận gate

- **Commit trên main:** `1be4d59af..233ba29e7`.
- **Người dùng thấy gì:**
  - Chỉ người trả lời gate. `fgos workflow answer` gọi từ trong worker được dispatch bị từ chối `nested-write-from-confined-worker`.
  - `workflow answer` nhận gate là `gate:` của một decision point. Step không phải gate đang chờ trả lời bị từ chối bằng tên (`gate-unknown`, `gate-not-parked`; gate đã trả lời rồi: `gate-already-answered`).
  - File round bị gài vào mà không khớp (gate không mở, tên thư mục hoặc file không khớp bản ghi, đã settle) không được gấp vào ledger và không chặn người trả lời thật.
  - Một milestone giữ biên nhận của cả settle lẫn câu trả lời gate.
  - `--verify` của gate đã bỏ (khối riêng ở trên).
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. Khai báo `capabilities.code:implement.verify` trên máy nào chạy gate.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos workflow gate <id> --worktree <path> --writes <paths> --capability code:implement` chạy lệnh đã khai báo; thêm `--verify x` thì bị từ chối.
- **Quay lại:** release cũ đọc được ledger mới. Sau rollback `--verify` dùng lại được.

## P02: bỏ bước `integrate` của Playbook

- **Commit trên main:** `37a94a335..76e8a3aa5`.
- **Người dùng thấy gì:**
  - Playbook khai `kind: integrate` hoặc đích của step (`target`) bị từ chối lúc nạp, nêu tên và chỉ về cửa approve: `kind "integrate" is no longer a Playbook step kind: a unit's branch is merged at the approve door, not by the Playbook`.
  - Merge chỉ xảy ra ở cửa approve (`fgos approve`).
  - Ledger cũ có bước integrate vẫn gấp và in ra bình thường.
  - Chạy lại (resume) một run mà định nghĩa Playbook đã lưu có bước integrate thì bị từ chối lúc nạp lại; chưa người dùng nào có định nghĩa như vậy.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** một Playbook thử có `kind: integrate` bị `fgos workflow` từ chối khi nạp.
- **Quay lại:** release cũ đọc được ledger mới; không có sự kiện integrate trong ledger mới.

## P03: một bộ đọc case, một cửa đường dẫn run, ghi bền cho ledger

- **Commit trên main:** khoảng `639bf6986..b353b95bf` (refactor, báo cáo, thông báo `invalid-case-id` nêu mã).
- **Người dùng thấy gì:**
  - `fgos workflow status|close|answer|...` từ chối id không phải một đoạn đường dẫn case (ví dụ `../x`, `.bindings`) bằng tên: `"../x" is not a case id (invalid-case-id)`, trước khi tạo bất kỳ đường dẫn nào. Trước đây `.fgos/workflow-runs/.bindings/advance.lock` từng được tạo vì lỗ này.
  - Một dòng ledger mà đĩa chỉ ghi một phần được ghi nốt; không ghi được byte nào thì từ chối `ledger-short-write` (đuôi dang dở được holder `advance` kế tiếp gỡ như trước).
  - `status` và `doctor` đọc khi một tiến trình khác đang append sẽ đọc lại tối đa 3 lần thay vì báo lỗi; ledger hỏng giữa file vẫn từ chối ngay.
  - Không đổi byte nào trên đĩa: 54 ledger thật trên fg-server2 cho kết quả gấp (fold) giống hệt trước và sau.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage và kích hoạt release như thường lệ (mdview, mcp-skill-hub rồi forgentX); `fgos doctor </dev/null`. Trên fg-server (`~/projects/forgent`) làm tương tự.
- **Doctor mong đợi:** không có dòng mới; các dòng workflow-case và holder-lock `advance` đọc cùng thư mục như trước.
- **Kiểm nhanh:** `fgos workflow status <run mới nhất>` in trạng thái; `fgos workflow close ../x` bị từ chối `invalid-case-id`.
- **Quay lại:** revert hai commit; không có thay đổi trên đĩa nên release cũ đọc được mọi thứ release mới ghi.

## P04: runtime của case, binding, gate dưới custody

- **Commit trên main:** `85f498825..57c844228`.
- **Người dùng thấy gì:**
  - Khi một hold của `advance` mở ra, reservation ghi của controller chết (worktree còn, custody trống, không có bản ghi Unit run đang chạy tiếp) được trả lại. Không chứng cứ rõ thì không trả.
  - Không còn file `reservations/*.json`. Settle gỡ binding theo ledger.
  - Binding sót sau sự cố do chính hold của case sở hữu xử lý. Dòng doctor `workflow-case-bindings` do một bộ đọc của Workflow phán; `fgos doctor --fix` chỉ ghi sentinel.
  - `advance.log` chỉ chứa dòng tiến độ. Hold `advance` đang bận thì từ chối `case-advance-busy`.
  - `fgos workflow gate` chạy lệnh dưới custody của worktree.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. **Kích hoạt khi không có `fgos run --case` nào đang chạy.** Cần có P08 trước.
- **Doctor mong đợi:** dòng `workflow-case-bindings` đọc cùng thư mục binding như trước; không dòng mới nào khác.
- **Kiểm nhanh:** `fgos workflow status <case>` in phán quyết binding; `fgos doctor </dev/null` không báo `workflow-case-bindings`.
- **Quay lại:** release cũ đọc được `advance.log` mới. Release cũ settle một reservation do bản mới tạo thì không tìm thấy file và không gỡ được binding. Trước rollback: kết thúc hoặc đóng mọi case conductor đang mở. Sau rollback: `fgos doctor --fix` của release cũ gỡ binding sót. Revert P04 trước P08.
- **Còn mở:** một Unit đã settled mà gặp hold khác giữa lúc nhả controller và lúc settle có thể bị trả lại `not-started`. Cửa sổ rất hẹp; chưa xử lý.

## P05: Playbook runner gọn, ledger nhẹ, resume chạy lại lỗi hạ tầng

- **Commit trên main:** `e6f99f78d..2b858ca64` (đã rebase trên main).
- **Người dùng thấy gì:**
  - `fgos workflow resume` chạy lại một step đã hỏng vì hạ tầng (unit không khởi động được, ghế không launch được): unit đó qua admission lại như một Unit run mới, mỗi lần gọi một lần, không tự thử lại. Unit ghi thì dùng lại worktree và branch đã ghi. Step do một phán quyết kết thúc (`findings`, bị từ chối, ghi ngoài phạm vi) bị từ chối bằng tên: `nothing-to-resume: step <id> ended <outcome>`.
  - Unit ghi mà controller chết giữa lúc lên lịch và lúc chạy nay tiếp tục trong worktree đã ghi, không còn thất bại.
  - Ledger mới nhỏ hơn nhiều: `unit.complete` không còn chép `runResult.evidence` (bằng chứng vẫn nằm trong Unit run trên đĩa). Không còn sự kiện `unit.account-unpinned`; lý do một ghế chạy không ghim nằm trong provenance của ghế (`account-pin-other-pool`).
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** run `--units` có ghế launch hỏng, sửa, rồi `fgos workflow resume <id>` chạy lại; run kết thúc bằng phán quyết thì `resume` bị từ chối `nothing-to-resume`.
- **Quay lại:** release cũ đọc được ledger mới (tập con). Một run đã mở lại (`step.fail` rồi `step.start` của cùng step) bị release cũ xem là `failed`: không rollback khi một run đã mở lại đang chạy.

## P06: cắt guide, chặn vòng chờ

- **Commit trên main:** `35436e8a5..d07b8b3c6`.
- **Người dùng thấy gì:**
  - Một định nghĩa workflow mà các step chờ nhau (`dependsOn` thành vòng) bị từ chối lúc nạp, nêu tên các step: `Workflow "x" steps "a", "b" wait on each other`. Trước đây định nghĩa như vậy được chấp nhận.
  - Mọi thông báo từ chối khác giữ nguyên chữ.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới; dòng đọc định nghĩa workflow vẫn tách lỗi đọc và lỗi parse.
- **Kiểm nhanh:** một định nghĩa thử có hai step `dependsOn` lẫn nhau bị từ chối khi nạp.
- **Quay lại:** revert; không có thay đổi trên đĩa.

## P07: lối vào của conductor (propose đọc mỗi ledger đã đóng một lần, một bộ so glob, một chỗ kiểm hình dạng slice)

- **Commit trên main:** `a7b70d50f..bb388da2e` (commit đầu là bằng chứng đỏ, hai commit sau là thay đổi và baseline test).
- **Người dùng thấy gì:**
  - `fgos workflow propose` nhanh hơn rõ rệt trên checkout có nhiều ledger Playbook (55 ledger trên fg-server2: 3,9 s xuống 0,35 s cùng tải); không đổi byte nào trên đĩa.
  - Đường ghi có dấu `\`, bắt đầu bằng `:` hoặc `**` trong tên bị từ chối ngay lúc phân loại với mã `slice-write-invalid` (trước đây `write-path-invalid`); `.` được đọc như `**` và bị từ chối vì chạm `.git`.
  - Đường ghi có `?` không còn bị coi là ký tự đại diện khi so chồng lấn giữa các slice.
  - Slice chỉ đọc có `capability` hoặc `pattern` sai kiểu bị từ chối `slice-invalid` thay vì làm sập propose.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. Không có yêu cầu thứ tự kích hoạt.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos workflow propose --slices <file> --plan <plan> --json` trả lời trong dưới một giây.
- **Quay lại:** revert hai commit sau cùng (thay đổi và baseline); không có thay đổi trên đĩa.

## P08: giữ custody worktree trước khi case đặt chỗ, ghim account của Workflow, đọc một seat

- **Commit trên main:** `2465e26c8`.
- **Người dùng thấy gì:**
  - `fgos run --case` ghi vào worktree mà tiến trình khác đang giữ bị từ chối `dispatch-in-flight` ngay, trước khi case đặt chỗ; không còn reservation treo chờ trả lại `not-started`.
  - Một account mà chỉ Workflow ghim và không seat nào của unit nhận thì unit chạy không ghim (provenance của seat ghi lý do); `fgos run --account` vẫn bị từ chối như trước.
  - `unit-run:<id>/<seat>` chỉ đọc kết quả của đúng seat đó, không đọc cả thư mục run.
  - Không đổi byte nào trên đĩa.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. Kích hoạt khi không có `fgos run --case` nào đang chạy (một run bản cũ đang ở giữa đặt chỗ và custody sẽ để lại reservation với custody trống).
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** giữ custody một worktree ở tiến trình khác, chạy `fgos run --case <id> --writes <path>` ở đó: bị từ chối, `fgos workflow status <case>` không có reservation mới.
- **Quay lại:** revert; không có thay đổi trên đĩa. Nếu bản release của P04 đã land, revert commit release của P04 trước (nó dựa vào thứ tự này).

## P09: luật ghim account, quyết định 71 (3a) và 72

- **Commit trên main:** `4225e0397..3ed9a6741`.
- **Người dùng thấy gì:**
  - Account ghim không bao giờ chuyển một seat sang pool khác. Ghim chỉ áp dụng khi lựa chọn đầu của seat do chính pool đó phục vụ.
  - `fgos run --account X` mà lựa chọn đầu là họ model khác bị từ chối bằng tên: `the pinned account applies to no seat of this unit (... the first choice of this seat is not served by pool "...")`. Cách sửa: thêm `--provider <họ của X>`.
  - Seat của `workflow start --account` mà lựa chọn đầu ở pool khác chạy không ghim (provenance ghi `account-pin-other-pool`). `workflow status` hiện account của từng seat.
  - Luật rộng hơn kế hoạch ban đầu: seat có lựa chọn đầu là entry khác của cùng họ nhưng pool khác cũng không còn bị chuyển.
  - Golden vectors của seat-binding đã đổi: hai case mới, hai case cũ nêu `prefer` rõ.
- **Lệnh trên từng workspace:** `git pull --rebase`; **crate Rust đổi, nên release phải build lại và kích hoạt** (không dùng lại release cũ); `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos run "<prompt>" --account <pool>/<id>` mà lựa chọn đầu ở họ khác bị từ chối; thêm `--provider <họ>` thì chạy.
- **Quay lại:** revert và kích hoạt lại release cũ (release cũ giữ luật "ghim chuyển seat"). Không có thay đổi trên đĩa; vectors chỉ là dữ liệu test.

## P10: đổi pattern trong case là đường ngoài danh sách

- **Commit trên main:** `fd939a3d0`.
- **Người dùng thấy gì:**
  - Đổi pattern giữa một case được xét ở cửa nhận (admission) như một đường ngoài danh sách (unlisted route): cần lý do (`route-reason-required`), tính vào số lần lệch được phép (`deviationsBeforeAsk`), và bị từ chối (`unlisted-route-refused`) ở điểm chỉ cho phép đường trong danh sách.
  - Catalog không còn tự từ chối việc đổi pattern (`request-reason-required` ở catalog đã bỏ).
  - Playbook không bị ảnh hưởng.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** chạy một Unit trong case với pattern khác pattern của activity mà không nêu lý do: bị từ chối `route-reason-required`.
- **Quay lại:** revert; không có thay đổi trên đĩa.

## P11: mỗi cửa một động từ, từ chối case lạ

- **Commit trên main:** `b9c7f3a95..f27bad4d5`.
- **Người dùng thấy gì:**
  - `fgos workflow start`, `answer`, `resume` mỗi cái một cửa (chạy nền hay không là một tuỳ chọn). Resume chạy nền không còn bỏ hold mà nó thắng và không còn báo một case Playbook là conductor.
  - Mọi động từ case từ chối case không tồn tại bằng tên: `Workflow run "<id>" not found` (mã `case-not-found`).
  - `fgos workflow status` in phán quyết binding (chỉ đọc) và account của từng seat.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`.
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos workflow status <id lạ>` bị từ chối `case-not-found`; `fgos workflow status <case thật>` có phán quyết binding.
- **Quay lại:** revert; không có thay đổi trên đĩa.

## P12: dọn lịch sử case cũ, `fgos workflow prune`

- **Commit trên main:** `ec7d41b43` (lõi `pruneFinishedCases`) và `2e3d97acc` (cửa lệnh, hook sau close, registry và CHANGELOG).
- **Người dùng thấy gì:**
  - Lệnh mới: `fgos workflow prune [--older-than <N>d] [--apply]`. Mặc định chạy thử, không xoá gì. Tuổi mặc định 14 ngày. Tuổi sai dạng bị từ chối `invalid-older-than`.
  - Sau mỗi lần close (và sau khi một hold được nhả), Workflow tự dọn theo tuổi mặc định, cố gắng hết sức, không làm hỏng close.
  - **Lưu ý:** phần tự dọn này xoá thật (không chạy thử) các case đã đóng quá 14 ngày. Muốn xem trước, chạy `fgos workflow prune --json` trên máy đó trước khi đóng case đầu tiên sau khi kích hoạt release.
  - Xoá case đã đóng quá N ngày cùng các Unit run mà ledger của nó nêu tên (Unit run xoá trước, ledger xoá cuối, dưới hold của case).
  - Giữ lại: case chưa kết thúc hoặc không đọc được; case có binding nêu tên (`binding-held`); case mà case khác nêu tên; Unit run chưa settle, đang có controller, đang giữ custody, được nối link hoặc ghi dưới case khác.
  - Unit run của `fgos run` thường không bị động tới.
- **Lệnh trên từng workspace:** `git pull --rebase`; build, stage, kích hoạt release như thường lệ; `fgos doctor </dev/null`. **Bước riêng:** trên mỗi máy chạy `fgos workflow prune --json` (chạy thử) trước, đọc số case và số byte, rồi mới `fgos workflow prune --apply`. **fg-server2 chỉ `--apply` sau khi big lead nói.**
- **Doctor mong đợi:** không có dòng mới.
- **Kiểm nhanh:** `fgos workflow prune --json` in danh sách ứng viên và danh sách giữ lại kèm lý do; `fgos workflow prune --older-than abc` bị từ chối `invalid-older-than`.
- **Quay lại:** revert gỡ lệnh và hook. **Lịch sử đã xoá bằng `--apply` không lấy lại được, nên `--apply` không có rollback.** Hãy đọc kết quả chạy thử kỹ trước khi `--apply`.

## P13: test (không đổi gì cho người dùng)

- **Commit trên main:** `2c2a2e153..46720a519`.
- Chỉ đổi test: các hàm `buildUnitHandoff`, tuỳ chọn run, sự kiện start và chín luật định nghĩa được chứng minh trực tiếp ở hàm sở hữu; file test runner 2 237 dòng tách thành sáu file; vài lần chạy preset lặp lại bị bỏ. Không đổi gì cho người dùng, không có thay đổi trên đĩa. Quay lại: không cần.

## P14: chuyển import `RunnerConfigError` (không đổi gì cho người dùng)

- **Commit trên main:** `e9255a3e6`.
- `RunnerConfigError` nay nằm trong một file lá không import gì (`src/runner/dispatch/runner-config-error.mjs`) và mọi nơi import từ đó. Không đổi gì cho người dùng, không có thay đổi trên đĩa. Quay lại: không cần.

## P20: đo run `fgos run` thường (không có case) trên máy owner, chỉ đọc

- **Mục đích:** `fgos workflow prune` chỉ xoá Unit run mà một case đã đóng nhắc tới. Unit run của `fgos run` thường (không case) không ai xoá. Quyết định 73 (e) yêu cầu đo phần này trên máy owner trước khi bàn luật giữ lại. Đoạn lệnh dưới đếm số thư mục và số byte theo bốn nhóm: `case`, `plain` (run thường), `no-record` (không đọc được `unit.json`), `link` (liên kết, không đi vào trong).
- **Chỉ đọc, không xoá gì.** Đoạn lệnh chỉ dùng `lstat`, `readdir`, `readFile`; không mở file để ghi, không theo liên kết, không gọi lệnh `fgos` nào. Chạy lại bao nhiêu lần cũng không đổi gì trên đĩa.
- **Chạy trong thư mục gốc của project** (thay `.` bằng đường dẫn project nếu đứng chỗ khác):

```sh
node --input-type=module -e '
import{lstatSync as L,readdirSync as D,readFileSync as R}from"node:fs";import{join as J}from"node:path";
const dir=J(process.argv[1]||".",".fgos","assignments"),now=Date.now(),DAY=864e5;
const size=p=>{const s=L(p);let n=0;if(s.isDirectory())for(const e of D(p))n+=size(J(p,e));else n=s.size;return n};
const age=ms=>{const d=(now-ms)/DAY;return d<7?"<7d":d<14?"7-14d":d<30?"14-30d":">30d"};
const z=()=>({dirs:0,bytes:0}),add=(b,n)=>{b.dirs++;b.bytes+=n};
const B={case:z(),plain:z(),"no-record":z(),link:z()};
const P={settled:z(),unsettled:z(),byAge:{"<7d":z(),"7-14d":z(),"14-30d":z(),">30d":z()},largest:[]};
for(const id of D(dir)){const p=J(dir,id),s=L(p);
 if(s.isSymbolicLink()){add(B.link,s.size);continue}
 if(!s.isDirectory())continue;
 const n=size(p);let u=null,m=0;
 try{const f=J(p,"unit.json");m=L(f).mtimeMs;u=JSON.parse(R(f,"utf8"))}catch{u=null}
 if(!u||typeof u!=="object"){add(B["no-record"],n);continue}
 const w=u.workflow;
 if(w&&w.caseId){add(B.case,n);continue}
 if(w!=null){add(B["no-record"],n);continue}
 add(B.plain,n);add(u.execution&&u.execution.status==="settled"?P.settled:P.unsettled,n);add(P.byAge[age(m)],n);
 P.largest.push({id,bytes:n});}
const T=Object.values(B).reduce((a,b)=>({dirs:a.dirs+b.dirs,bytes:a.bytes+b.bytes}),z());
const pc=(x,t)=>t?Math.round(1e3*x/t)/10:0;
const out={root:dir,total:T};
for(const[k,b]of Object.entries(B))out[k]={...b,dirsPct:pc(b.dirs,T.dirs),bytesPct:pc(b.bytes,T.bytes)};
out.plain={...out.plain,settled:P.settled,unsettled:P.unsettled,byAge:P.byAge,largest:P.largest.sort((a,b)=>b.bytes-a.bytes).slice(0,5)};
console.log(JSON.stringify(out,null,2));
' -- .
```

- **Đọc kết quả (JSON):**
  - `total`: toàn bộ `.fgos/assignments` (số thư mục, số byte).
  - `case`, `plain`, `no-record`, `link`: mỗi nhóm có `dirs`, `bytes`, `dirsPct` (% theo số thư mục) và `bytesPct` (% theo byte). `case` = run do một case mở (`unit.json` có `workflow.caseId`); `plain` = `workflow` rỗng; `no-record` = không có hoặc không đọc được `unit.json`; `link` = liên kết, chỉ đếm, không đi vào.
  - `plain.settled` và `plain.unsettled`: run thường đã xong và chưa xong (chưa xong có thể còn được mở lại, không được xoá).
  - `plain.byAge`: số run và byte của run thường theo tuổi, tính từ lần sửa cuối của `unit.json` (`<7d`, `7-14d`, `14-30d`, `>30d`).
  - `plain.largest`: năm run thường nặng nhất (`id`, `bytes`).
- **Gửi lại cho coordinator:** dán nguyên đầu ra vào dòng board hoặc vào câu trả lời của owner. Chạy riêng trên từng máy (máy owner và fg-server; fg-server2 do lead đo).
- **Đã kiểm trên fg-server2 và trên cây giả:** tổng byte bằng `du -sb`; liên kết chỉ đếm vào `link`, đích của nó không bị đụng; thư mục không có `unit.json` vào `no-record`; danh sách `find -printf` trước và sau chạy giống hệt.
- **Câu hỏi sẽ hỏi sau khi có số (chưa quyết, chưa khuyến nghị):** giữ nguyên chờ thêm; hay thêm `fgos workflow prune --plain --older-than <N>d` (chạy thử mặc định, tự gõ khi muốn); hay đưa luật tuổi đó vào dọn tự động khi đóng case; hay giới hạn dung lượng mỗi run ngay từ nguồn; hay thêm một trường `plain` vào `prune --json` để khỏi cần đoạn lệnh này. Các lựa chọn không loại trừ nhau; mỗi lựa chọn có chi phí và rủi ro, và đều không được xoá run còn controller, attempt hay custody, run chưa xong, liên kết, hay run mà case đang mở nhắc tới.
- **Quay lại:** không có gì để quay lại, đoạn lệnh không ghi gì.

## Bảng quay lại

| Phase | Release cũ đọc được dữ liệu đĩa mới? | Làm gì trước khi rollback |
|---|---|---|
| P01 | Có. `--verify` dùng lại được sau rollback | Không cần |
| P02 | Có; ledger cũ có integrate vẫn gấp được | Không cần |
| P03 | Có (không đổi byte) | Không cần |
| P04 | Một phần. Release cũ không gỡ được binding mà bản mới tạo | Kết thúc hoặc đóng mọi case conductor đang mở; sau rollback chạy `fgos doctor --fix`. Revert P04 trước P08 |
| P05 | Có (tập con). Run đã mở lại bị release cũ xem là `failed` | Không rollback khi một run đã mở lại đang chạy |
| P06 | Có (không đổi byte) | Không cần |
| P07 | Có (không đổi byte) | Không cần |
| P08 | Có (không đổi byte) | Revert P04 trước nếu P04 đã land |
| P09 | Có (chỉ vectors test). Release cũ giữ luật "ghim chuyển seat" | Kích hoạt lại release cũ |
| P10 | Có (không đổi byte) | Không cần |
| P11 | Có (không đổi byte) | Không cần |
| P12 | Có (chỉ thiếu lịch sử) | `--apply` không có rollback; đọc chạy thử trước |
| P13, P14 | Có (không đổi byte) | Không cần |
| P20 | Có (chỉ đọc) | Không cần |
