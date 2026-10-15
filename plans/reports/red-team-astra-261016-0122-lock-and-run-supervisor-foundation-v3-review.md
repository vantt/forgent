<!-- Nguồn: .fgos/assignments/unit-run-1792076216464-ce536565/producer/1/runs/01/outbox/report-1.md — openai/tetcu72, gpt-6-astra (frontier), herdr pane, fgos run read-only, 2026-10-15/16, review vòng 1 của bản nháp v3 (fb3b6113e). Bản sao nguyên văn; bằng chứng: red-team-astra-261016-0122-lock-and-run-supervisor-foundation-v3-review-probes.json (bản sao evidence-probes.json). -->

**Phản biện độc lập bản 3 — CHƯA DUYỆT**

Đối tượng: `plans/reports/design-261015-2103-lock-and-run-supervisor-foundation-v3.md`, commit `fb3b6113ebedf0b6ee34f8b4abaf75f7187e2407`. Đọc kèm bundle probe, bản 2, phản biện B1–B9, T8, kết luận hội đồng và source được dẫn.

Chuyển sang `flock` là hướng tốt trên Linux có ngữ nghĩa phù hợp. Tôi không tìm được hai holder độc lập cùng giữ `LOCK_EX` trên cùng inode và hai open file description, khi không unlink file, không unlock qua bản sao và không trộn giao thức. Nhưng bản 3 chưa khép kín vòng đời tài nguyên. Có lịch hai giao thức cùng acquire. Có lịch lock đã trống mà process cháu còn ghi. Có lịch reaper xoá home đang cần dùng. Có lịch adopt bỏ qua công việc còn thiếu.

Đây là báo cáo hoàn tất phản biện, không phải xác nhận đã triển khai. Các crate/route v3 chưa tồn tại. `done` của assignment chỉ có nghĩa báo cáo và bằng chứng đã được giao.

**Phạm vi và cách kiểm**

Không sửa source/spec/config/test. Không commit, không chạy `npm test` hay `cargo build`. Không acquire hoặc xoá lock thật của repo. Probe tạo state riêng bằng `mkdtemp` ngoài repo. Chỉ import source production để đọc và gọi với đường dẫn fixture. Các process bị kill đều do probe tạo. Không chạy herdr thật, không đóng pane thật. Git probe dùng repo tạm và shell alias, không tạo commit.

Bằng chứng tự chứa ở [evidence-probes.json](evidence-probes.json). File giữ nguyên script, stdout, stderr, kết quả, argv và SHA-256 của source. Có cả lượt lỗi môi trường `/var/tmp` trả `EROFS`; không giấu lượt lỗi này. Lượt chạy lại bỏ qua mount không ghi được rồi hoàn tất các ca còn lại. `/tmp` và `/dev/shm` đều là tmpfs. Chưa đo ext/overlay, NFS, macOS hay Windows.

Workspace có thay đổi do phiên khác trong lúc đọc: HEAD từ `fb3b6113e` đến `61cb21f9b`. Tài liệu v3 không đổi. Các module production dùng trực tiếp trong probe được đối chiếu byte với commit review trong bundle. `claim-port.mjs` có thay đổi ghi audit admin của phiên khác; không ảnh hưởng đoạn `currentHead` đang xét. Không quy các thay đổi đó cho lượt review này.

GitNexus không có MCP tool/resource dùng được trong phiên này. Tôi đọc source và lịch sử Git trực tiếp; không tạo lại index. Đã đọc reading-map, các phần runner/work-state/confinement/distribution liên quan và component-boundary. Prior art đáng giữ: `a72d263bc`/`49cfc4be3` cho W1'; `91cc7679e` cho phục hồi settlement; `e589577c1` cho tên BoundInvocationSupervisor; `8c3e414df` cho account lock.

**Phát hiện mới**

**R3-1 — critical — Tombstone chưa phải hàng rào chung; cutover vẫn cho hai giao thức cùng giữ.**

Vị trí: v3 §6.8, §11/4.2 và 4.5. Source: `provider-capacity.mjs:48,480,555,693–705`; `main-checkout-lock.mjs`/`dispatchLockFile`; `execution/run.mjs:345–354`.

Có ba phản ví dụ riêng, cùng đánh vào lời hứa “code cũ mọi phiên bản fail-closed”:

- Account lock cũ **đã là thư mục ledger**. `currentGeneration` chỉ nhận tên số. Nó bỏ qua `TOMBSTONE`. Probe gọi nguyên `tryAcquireAccountLock` khi một kernel lock v3 đang giữ. Kết quả: `v1Acquired:true`, `v3KernelAcquired:true`; thư mục chứa `0000000001.json` và `TOMBSTONE`. Đây là code production, không chỉ mô hình lock cũ. `state-lock` dùng cùng reader nên cũng cần cutover riêng.
- Cùng cwd nhưng hai `fgosDir` khác nhau có hai tên lock legacy ở hai root. V3 tombstone root A rồi giữ lock máy. Code cũ tại root B vẫn trả `acquired`. Marker họ `dispatch-cwd.cutover/` ở A không được B đọc. Probe dùng cùng `dispatchLockFile(cwd)` production. Cả hai giao thức giữ đồng thời. Những tên cwd chưa từng được v3 chạm cũng chưa có hàng rào vật lý cho code cũ.
- Quét quiescence không khoá cửa launch. Probe bắt đầu với tập process fixture rỗng. Sau scan, A vào v1; A còn sống quá TTL. B giành v1 rồi release. File v1 vắng. Cutover đặt tombstone và acquire v3 trong khi A vẫn ghi heartbeat. Kết quả `twoHolders:true`. Dùng TTL 80 ms để lịch chạy ngắn; không sửa production. Đây là mô hình cutover dùng acquire/release production. Nó giữ đúng lỗi P6, nhưng cho holder xuất hiện **sau** scan.

Không phải mọi caller đều đẩy `EISDIR` ra ngoài. Guard resume cũ trong `execution/run.mjs` bắt mọi lỗi đọc lock rồi đặt holder thành `undefined`. Guard này fail-open. Tôi chưa coi riêng nhánh này là bằng chứng worker chạy trùng: writer phía sau có thể còn từ chối khi acquire cùng tombstone. Nó vẫn bác câu “bất kể code cũ làm gì”.

Probe main/events/claims trực tiếp thì đứng vững: đều ném `EISDIR`, không vào vùng găng, tombstone còn nguyên. Hook Node hiện tại gọi inspect không bắt lỗi đó rồi cho commit qua. Claim-port và merge acquire trước mutation; không thấy nhánh biến `EISDIR` thành acquired. Rust `lock.rs:205` dùng `read_to_string(...)?`; các caller init dùng `?`. `install.lock` từ chối `AlreadyExists`; observe có thể chờ đến timeout thay vì ném ngay `EISDIR`, nhưng không vào vùng găng. Đây là kết luận cho source đã đọc, không chứng nhận mọi release lịch sử.

Sửa tối thiểu: inventory cutover theo **hình dạng giao thức**, không chỉ theo tên lock. Ledger-directory cần hàng rào làm reader cũ thật sự từ chối; tombstone-directory không đáp ứng. Quiescence phải giữ đóng cửa launch đến khi cutover hoàn tất. Lock phạm vi máy phải drain toàn phạm vi máy và mọi legacy root có thể cùng chạm tài nguyên. Không chứng minh được thì chưa flip họ đó. Đưa enforcement của `lockProtocolFloor` vào 4.2, trước cutover đầu tiên, thay vì để 4.5. Release cũ chạy thẳng hoặc fgctl cũ không tự biết sàn mới. Rollback chỉ an toàn dưới cùng hàng rào admission và cùng phạm vi drain; gỡ tombstone sau một lần scan chưa đủ.

Bằng chứng: `r3-legacy.mjs`, `r3-cutover.mjs`.

**R3-2 — critical — Gate chết không chứng minh cả cây agent đã chết. Lock trống có thể đi cùng writer còn sống.**

Vị trí: v3 §9.3, §9.8, bảng lỗi §10. Bundle: `p4_gate.py`.

Probe chạy nguyên gate P4. Agent fork một process cháu, process cháu tạo session riêng và ghi heartbeat. Sau SIGKILL gate: agent trực tiếp chết nhờ PDEATHSIG; process cháu vẫn sống và vẫn ghi; contender acquire được attempt lock. `PR_SET_CHILD_SUBREAPER` chỉ thay người nhận nuôi. Nó không biến cái chết của subreaper thành lệnh giết mọi hậu duệ. PDEATHSIG không được tự kế thừa qua fork. [Linux PR_SET_PDEATHSIG](https://man7.org/linux/man-pages/man2/PR_SET_PDEATHSIG.2const.html).

Vì vậy câu “supervisor + gate chết → agent chết → reaper dọn” chưa đúng cho cây process. Supervisor còn sống thì vẫn giữ lock, nhưng nếu nó finalize khi chỉ biết gate đã mất, home vẫn có thể bị xoá dưới process cháu. Cả hai chết thì lock trống ngay, trong khi process cháu tiếp tục ghi cwd.

Probe thứ hai ép cha chết trước khi con gọi `prctl`. Con vẫn sống sau đăng ký PDEATHSIG. Cần kiểm lại identity cha sau đăng ký, trước exec/side effect. Gate mẫu hiện không có kiểm này.

Sửa tối thiểu: định nghĩa miền process có thể chứng minh rỗng dù gate bị SIGKILL. Chọn backend kiểm soát cả cây phù hợp nền tảng, hoặc để một owner còn sống giữ lock cho tới khi kiểm xong miền đó. Nếu cần cơ chế mới như cgroup/Job Object, phải mở quyết định về dependency và setup/doctor. Chỉ `killpg`, subreaper và PDEATHSIG ở con đầu chưa đủ. Không được dùng “lock free” làm chứng cứ mọi process có quyền ghi đã chết trước khi invariant này được chứng minh.

Ngoài ra, probe “trần cứng” hiện yếu hơn lời hứa: gate P4 gửi SIGTERM lặp lại và chờ root thoát. Agent bỏ qua SIGTERM vẫn sống sau hơn 750 ms với trần 150 ms; gate vẫn giữ lock, không có `gate-exit`. Đây là lỗi **của bằng chứng mẫu**, không khẳng định crate Rust chưa viết sẽ có cùng lỗi. Test chấp nhận phải có escalation SIGKILL và chờ miền process rỗng, không chỉ shell hợp tác.

Bằng chứng: `r3-process.py`, `r3-grandchild.py`, `r3-late-pdeath.py`, `r3-ignore-term.py`.

**R3-3 — high — Prepare home xảy ra trước khi attempt được bảo vệ.**

Vị trí: v3 §9.4 bước 1–2, §9.8.

Thứ tự hiện viết là prepare confinement, allocate terminal, mint attempt id, ghi envelope, rồi mới acquire attempt lock. Reaper mới chỉ hỏi lock. Khi controller còn đang prepare nhưng chưa acquire, reaper có thể lấy lock và finalize home. Controller sau đó acquire được và giao một home đã mất.

Probe đa process mô hình hoá đúng hai đoạn này. Reaper lấy lock, xoá home fixture rồi nhả. Controller lấy lock được sau đó, nhưng home đã bị xoá trước handoff. Không cần controller chết, không cần TTL.

Nếu home chưa có attempt id lúc đó, reaper lại không có phép ánh xạ mà §9.8 đòi hỏi. Cả hai cách đều cần hợp đồng publish rõ hơn.

Sửa tối thiểu: mint attempt và acquire lock trước side effect đầu tiên có thể bị reaper nhìn thấy. Giữ liên tục qua prepare, envelope publication và handoff. Hoặc staging không discoverable cho tới khi ownership đã được giữ và publish nguyên tử. Allocation dùng cùng attempt id. Test pause sau từng bước prepare, rồi chạy reaper song song.

Bằng chứng: `r3-admission-terminal.py`. Đây là mô hình giao thức, chưa phải chạy confinement v3.

**R3-4 — high — Adopt bỏ sót hai cửa sổ crash của settlement/finalization.**

Vị trí: v3 §9.6–9.7. Source: `run-lock.mjs:306–335,390`; `settlement.mjs:398–458`; bundle `p4-adopt.mjs`.

Cửa sổ thứ nhất: `settleRunControl` đã CAS sang `settled`, chưa publish `result.json`, rồi process chết. Adopt §9.7.3 đòi acquire epoch mới. Production `acquireRunControl` trả `settled`, không cấp epoch mới. Probe dùng CAS production và SIGKILL thật cho kết quả adopter `refused`, `result.json` vẫn vắng. Repo đã có prior art sửa đúng khe này: `commitRunSettlement` nhận diện `alreadySettledByUs` bằng token và `settledEpoch`, rồi hoàn tất publish bằng token cũ. Bản 3 phải giữ đường phục hồi này, không thay bằng “luôn acquire epoch mới”.

Cửa sổ thứ hai: `result.json` đã có, supervisor chết trước `finalize-home`. §9.7.2 và adopter P4 đều trả ngay. Probe cho `already-settled`, home vẫn còn, bước trả credential chưa chạy. Reaper ở lần sau có thể cứu home, nhưng điều đó không làm adopt trở thành một cửa hoàn tất như thiết kế hứa. Không còn run mới thì công việc vẫn treo.

Cần ma trận phục hồi ít nhất: receipt-only; control-settled/result-missing; result-present/finalize-pending; credential đã staged nhưng chưa xoá home; finalize-complete. `result.json` xác nhận công việc, không xác nhận cleanup. Hai adopter cùng lúc được kernel tuần tự hoá là đúng. Nó không tự tạo exactly-once cho side effect sau crash. Giữ idempotency hiện có của confinement và credential staging; dùng receipt riêng cho từng bước. Chỉ đánh dấu toàn attempt hoàn tất khi mọi bước bắt buộc có kết quả bền hoặc trạng thái giữ-home tường minh.

Tôi chưa chứng minh có hai lần tiêu cùng refresh token. Account lock và logic staging hiện hữu là bảo vệ đáng giữ. Lỗi đã chứng minh là bỏ sót hoặc không đi tiếp được, không phải khẳng định credential double-spend.

Bằng chứng: `r3-settlement.mjs`, `r3-process.py`, adopter P4 nguyên bản.

**R3-5 — high — Cho controller giữ fd “để quan sát” làm mất khả năng adopt.**

Vị trí: v3 §9.4.5 và §9.7.1.

Thiết kế nói controller giữ fd cũng không hại. Nhưng nếu supervisor và gate đã chết, controller vẫn sống chờ kết quả, fd của controller giữ attempt mãi. Adopter chỉ nhìn kernel rồi báo `running`. Agent không còn chạy, cũng không ai có thể hoàn tất attempt. Probe để riêng observer giữ fd: adopter trả `kept/attempt-lock-held`; không có supervisor hay agent.

Sửa: controller bắt buộc đóng bản sao sau handoff được xác nhận. Quan sát qua file không cần giữ quyền sở hữu. Controller phải có nhánh recovery sau crash supervisor, không đợi receipt vô hạn.

Cùng boundary này, timeout chờ `supervisor-binding.json` không đủ để gắn `not-started`. Spawn đã thành công nhưng publication/quan sát binding có thể chậm. Nếu gate đã nhận GO, việc giết supervisor còn cố ý để agent chạy tiếp. Cần chứng minh chưa GO hoặc đã dừng toàn miền process; nếu chưa rõ, trả `launch-unknown`/đang phục hồi. Không được mở attempt mới dựa riêng vào timeout đọc file.

Bằng chứng trực tiếp cho observer: `r3-process.py`. Nhánh binding-timeout là lịch giao thức, chưa có implementation v3 để chạy.

**R3-6 — high — Thiếu `launched` không có nghĩa pane rỗng; grace không sửa được khe remote side effect.**

Vị trí: v3 §7.2, §7.7.

Herdr có thể đã chạy gate/agent, nhưng response chưa về hoặc process ghi marker chết trước khi publish `launched`. Allocation tồn tại, marker vắng, process thật còn sống. Sweep theo “quá allocationGrace → đóng pane rỗng” có thể đóng chính pane đó. Một controller sống nhưng bị pause trước khi ghi marker cũng tạo lịch tương tự. Luật này lặp lại dạng lỗi mà bản vá reaper tạm đang cố tránh.

Probe dùng subprocess thật làm side effect của driver. Launcher chết trước publish marker. Kết quả: `liveAgent:true`, `launchedPresent:false`, `v3SweepWouldClose:true`. Không gọi herdr thật; đây là phản ví dụ cho phép suy luận của core.

Nếu terminal-control bắt buộc publish `launched` bền trước khi supervisor được gửi GO, nhánh agent-chạy/marker-vắng có thể bị chặn. Bản 3 chưa ghi ordering này; probe chỉ chứng minh lịch không bị contract hiện tại loại trừ. Sửa: grace chỉ kích hoạt đối soát, không cấp quyền close. Sweep cần release authority của tầng trên và xác nhận slot không còn thực thi; unknown phải giữ. Launch cần operation id/idempotency và trạng thái “đã yêu cầu, kết quả chưa rõ”. Với `retain(until)`, hạn hết cũng phải xác nhận pane chưa được tái sử dụng, không coi thời gian là chứng cứ process đã hết. Hai tab cùng nhãn của phương án (a) vẫn vô hại; vấn đề này không đòi lock gom layout.

Bằng chứng: `r3-admission-terminal.py`.

**R3-7 — high — Ném lỗi khi thấy thenable xảy ra quá muộn để chặn async body.**

Vị trí: v3 §6.6, bất biến 1.

Callback async đã chạy và đã xếp continuation trước khi caller nhận Promise. Ném `hot-lock-async-body` rồi release không huỷ continuation. Probe chạy literal wrapper này. A bị từ chối; B ở process khác acquire; continuation A vẫn ghi trong lúc B giữ lock. Kết quả `AWriteWhileBHeld:true`.

Đây là lỗi của cơ chế “gác async” đề xuất, không phải phản ví dụ đối với reclaim dưới `state.reclaim`. Nếu mọi callback thật sự đồng bộ thì lịch này không xảy ra; finding bác lời hứa rằng chỉ cần kiểm thenable sau callback là đã bảo vệ được invariant khi caller sai. Source hiện tại `withEventsLock` còn giữ lock tới khi Promise resolve; đổi sang throw/release cần tránh làm yếu an toàn khi caller sai hợp đồng.

Sửa: mọi mutation bên trong nhận `stateTx` còn hiệu lực và kiểm nó khi ghi. Không để continuation giữ quyền ghi sau khi transaction đóng. Kèm kiểm tĩnh/call-site cho callback đồng bộ. Chặn riêng `AsyncFunction` cũng chưa đủ, vì hàm thường có thể trả Promise hoặc xếp callback rồi trả sync. Test phải quan sát side effect sau khi wrapper đã throw, không chỉ assert có exception.

Bằng chứng: `r3-git-hot.mjs`, đoạn literal `hotV3` có ghi rõ là mô hình.

**R3-8 — medium — Audit “không subprocess dưới state” còn bỏ sót đường delivered của heavy work.**

Vị trí: v3 §2/B6, §6.6.5, §11/4.3. Source: `store.mjs:601–622,657,876`.

Ngoài `currentHead`, `moveWork` giữ `withEventsLockAndRefresh` rồi gọi `assertPlanEvidence` khi chuyển heavy work sang `delivered`. Hàm này gọi Git `rev-parse` và có thể `cat-file`. Nó còn đọc plan ngoài state root. Probe bọc `child_process.execFileSync` trong process thử nghiệm rồi gọi helper production dưới events lock. Có call Git với `underHotLock:true`.

Đưa HEAD ra ngoài chưa đủ. Nếu chỉ thêm guard spawn, flow delivered hợp lệ có thể bị từ chối. Hai `catch` rộng trong `assertPlanEvidence` còn có thể nuốt lỗi guard và đổi nó thành “không có branch/plan”, khiến chẩn đoán sai.

Sửa: đưa cả evidence snapshot Git ra ngoài lock. Trong lock kiểm work revision và SHA mà snapshot gắn vào; thay đổi thì retry bên ngoài. Giữ scope main khi cần bảo vệ checkout. Audit tất cả import `child_process`, không chỉ helper mới. Gộp claims phải truyền `stateTx` qua cả acquire/release/settle; không đổi tên hai wrapper rồi để acquire lồng.

Bằng chứng: `r3-git-hot.mjs`; call graph tĩnh trong `moveWork`. Chưa chạy toàn lifecycle hay test suite.

**R3-9 — medium — Fd mượn có thể lọt sang hậu duệ; “borrow” không phải quyền không thể unlock.**

Vị trí: v3 §6.4.

`CLOEXEC` mặc định của fd phía Node không còn bảo vệ fd 3 đã cố ý truyền sang Git. Shell có thể truyền tiếp fd đó cho process nền mà không có lệnh pass-fd tường minh. Probe Git 2.34.1 qua shell alias tạo `sleep` nền. Git đã thoát, caller đã đóng fd; contender vẫn bị chặn. Giết process nền thì lock mới trống. Node spawn mặc định không truyền fd cho child không liên quan trong ca đối chứng.

Đây là probe Git→shell, không phải chạy hook pre-commit thật. Bundle gốc đã chứng minh đường Git→hook trên một bản Git. Không phép thử nào trong hai phép này chứng nhận “mọi phiên bản Git, shell, filter, signer, hook, herdr” sẽ giữ đúng hoặc đóng đúng fd. Hook làm mất fd nên fail-closed; hook làm rò fd có thể giữ main/cwd rất lâu.

Ngoài ra `LOCK_UN` qua bất kỳ bản sao nào có thể nhả lock chung. Probe borrower unlock trong khi fd cha vẫn mở; contender acquire được. [Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html). Không coi đây là bypass của caller tuân thủ close-only; đó là giới hạn của quyền mượn cần ghi đúng. `fstat + try-lock` cũng không chứng minh provenance: trên file đang trống, một description mới tự acquire vẫn thành công. Nó bảo đảm exclusion tại thời điểm đó, không chứng nhận “đây chắc chắn là description của cha”.

Sửa: contract fd có owner/borrower close-only, không dùng guard thư viện tự `LOCK_UN` khi Drop; chặn forward ngoài đường đã duyệt; test leak qua shell/filter/background child. Probe runtime khi đổi Git/host/driver. Không tự gọi `LOCK_UN` để chữa leak, vì có thể còn child đang ghi hợp lệ. Quyền trên fd là capability mạnh, không phải token giới hạn chức năng bằng kernel.

Bằng chứng: `r3-git-hot.mjs`, `r3-process.py`.

**R3-10 — high — Wave 6.2 xoá binding trước khi reader reaper được chuyển ở 6.3.**

Vị trí: v3 §11/6.2 và 6.3, §9.8. Source: `transport.mjs:370,406`; `confinement/cleanup.mjs:465–602`.

6.2 xoá `bindConfinedHomesToSupervisor`. 6.3 mới xoá reader binder/pane và thay bằng attempt lock. Trong khoảng giữa, reaper cũ không đọc lock mới. Marker prepare còn pid controller. Controller chết thì reaper cũ kết luận `process-dead` và dọn home, dù supervisor/gate v3 còn sống.

Probe dùng `writeOwnershipMarker`, `extendOwnershipMarker` và `reapOrphanedConfinementResources` production. Có worker sống và kernel attempt lock đang giữ. Reaper vẫn trả `reaped`, `homeExists:false`, `workerAlive:true`, `attemptLockStillHeld:true`. Trường attempt bổ sung trong marker không làm reader cũ biết giao thức mới.

Sửa: chuyển writer **và mọi reader/destructor của home** trong cùng wave đầu tiên có supervisor mới. Có thể giữ reader legacy cho attempt cũ theo version của marker, nhưng mỗi resource phải có đúng một giao thức quyết quyền dọn. Không được xoá binder cho `direct` trước khi reaper biết attempt lock. Test chuyển phiên bản với controller chết, gồm reader release cũ còn chạy, không chỉ test run v3 thuần.

Bằng chứng: `r3-reaper-migration.mjs`.

**R3-11 — medium — `serverIncarnation` thiếu boot/namespace và chưa ràng buộc thao tác vào đúng kết nối.**

Vị trí: v3 §7.2, §7.5, §7.7.

Socket + pid + startTime phân biệt tốt hai server trong cùng boot. Nhưng startTime Linux tính từ boot. Sau reboot, cả pid lẫn startTime có thể lặp; record trong stateRoot vẫn còn. Thiết kế chưa đưa bootId vào incarnation terminal, dù process-facts đã có nó. Với cùng socket và pane id tái dùng, một allocation cũ có thể trỏ sang pane mới.

Còn một khe riêng: inspect server S1 rồi gọi `pane.close` qua socket path. S1 có thể chết, S2 bind cùng socket trước close. Lưu incarnation vào record không tự ràng buộc RPC close với S1. Chưa có contract về connection pinning hoặc expected-incarnation mà driver kiểm nguyên tử.

Đây là phản ví dụ logic, chưa reboot máy hay thay server thật. Sửa bằng tuple đủ `{host, bootId, pidNs, pid, startTime, endpoint}` và driver giữ đúng connection/peer incarnation cho thao tác. Nếu không bảo đảm được, trả unknown và giữ pane. `attach` cũng phải có provenance về pane do caller sở hữu; release không được coi mọi pane attach là pane core đã cấp. Luật bỏ root pane, không đóng cả tab và không dùng nhãn làm khoá là đúng, nên giữ.

**R3-12 — medium — Platform matrix và gate vận hành chưa khớp lộ trình có writer.**

Vị trí: v3 §4.2, §6.1–6.3, §9.3, §9.10 và §11.

Windows không thể mặc định dùng nguyên thủ thuật helper acquire rồi thoát của Linux. Tài liệu `LockFileEx` nói handle kế thừa không cấp cho con quyền vào vùng đã khoá; lock còn có ngữ nghĩa giải phóng theo process/handle riêng. [Microsoft LockFileEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex). Bản 3 chỉ đánh dấu borrow cho checkpoint/hook là unsupported, nhưng handoff controller→supervisor→gate và Node facade cũng phụ thuộc chính capability đó. `SCM_RIGHTS`, `prctl`, `tcsetpgrp` là các phụ thuộc nền tảng khác. “Mutex/lease chạy” trên Windows hiện chưa có bằng chứng hoặc adapter contract đủ cụ thể.

macOS được hoãn probe trước bật là hợp lý. NFS/SMB cần fail-closed theo backend/mount và scope hỗ trợ; một probe local thành công không chứng minh exclusion giữa hai client. Overlay/tmpfs không nên gộp thành “Linux nên chắc chắn giống nhau”. Lượt này chỉ đo tmpfs; mount ext của môi trường read-only. Không có kết quả runtime trên overlay/macOS/Windows.

Về vận hành, runtime socket ngắn (`XDG_RUNTIME_DIR` hoặc `/tmp/fgos-uid`), quyền/owner của thư mục và xác thực peer phải được đăng ký setup/doctor ngay wave supervisor. `allocationGrace`, policy retain, root overrides và sàn protocol cũng cần nguồn cấu hình/check rõ. Danh sách wave hiện chưa chỉ ra hết các check này. `lock-kernel-semantics` phải là điều kiện enable trên mount thật, không chỉ cảnh báo sau khi writer đã chạy.

Sửa: feature matrix riêng cho acquire-local, transfer/inherit, SCM transport, process-tree containment, tty foreground, incarnation-safe close. Không có driver/proof thì từ chối carrier tương ứng trước prepare. Đây là thu hẹp phạm vi được bảo đảm, không phải chọn TTL thay kernel lock.

**Đối chiếu B1–B9**

| Mã cũ | Kết luận ở bản 3 | Bằng chứng và điều kiện |
|---|---|---|
| B1 | Đóng ở thiết kế primitive mutex/lease; không kéo kết luận sang toàn hệ | Bỏ ledger/GC cho mutex; run-control giữ ledger không GC. Kernel stress mới 200 acquire, 0 overlap. Reclaim nóng cũng có kết quả tốt. R3-1 và R3-2 là lỗi boundary khác. |
| B2 | Chưa đóng | Tombstone main/events/claims tốt. Provider directory, cwd nhiều root và scan không đóng launch đều còn phản ví dụ R3-1. |
| B3 | Đóng khe spawn→bind trong mô hình fd Linux hợp lệ | Con nhận description tại spawn; SCM_RIGHTS giữ lock sau supervisor chết. Chưa chứng nhận leak, mọi Git/driver và cây process; xem R3-2/R3-9/R3-12. |
| B4 | Đóng về cấu trúc đã đọc | W1' bảo vệ checkpoint dưới merge-slot bằng main writer; v3 yêu cầu truyền handle, không reacquire. Không chạy suite W1 hay race land trong lượt này. |
| B5 | Đóng đối với hai transaction dùng hai description riêng | Probe cùng Node: acquire thứ nhất đúng, thứ hai bị từ chối, đóng thứ nhất thì thứ hai được. Scope/rank phải đi qua mọi caller; không có chứng cứ kernel tự kiểm rank. |
| B6 | Chưa đóng hết | Gộp claims và snapshot HEAD đúng hướng. Còn `assertPlanEvidence` shellout và thenable guard không chặn side effect; R3-7/R3-8. |
| B7 | Đóng quy tắc mtime sai | Kernel không cần mtime; facts bỏ suy luận mtime. Hot record phải giữ đủ host/pidNs/bootId/startTime như §5.1, không rút schema còn ba field rồi đoán namespace. Chưa đo các nền khác. |
| B8 | Đóng với helper leaf Linux theo contract kill/reap/close | Probe helper **đã acquire** rồi timeout: SIGKILL/ETIMEDOUT ~83 ms; trước parent close còn giữ, sau close trống. Phải bảo đảm helper không fork/leak fd và không có Drop gọi LOCK_UN ngoài ý. [Node spawnSync](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options). |
| B9 | Đóng lỗi suffix override | §6.9 khớp `store.rs:59–75`: FGOS_STATE_HOME dùng nguyên giá trị. Khi triển khai cần cùng handling empty/whitespace, Windows USERPROFILE và fallback tương đối; canonicalize/ghim root tuyệt đối trước đổi cwd. |

**Mutex nóng, lock order và tính đầy đủ của bằng chứng**

Lịch A1 chạy lại bằng bundle nguyên bản. Không kernel reclaim: hai holder. Có kernel reclaim: một holder. Stress control không reclaim lock có 36 overlap và worker lỗi ENOENT; có reclaim lock có 430 acquisition hoàn tất, 14 holder bị SIGKILL, 0 overlap. Số 430 chỉ là acquisition được worker hoàn tất báo lại; không đếm mọi lượt của worker chết. Không dùng stress làm proof mọi lịch.

Lập luận sửa A1 có cơ sở: reclaimer giữ `state.reclaim`, đọc lại record chết, rồi unlink; reclaimer khác không thể thay record giữa hai bước. Fast path không thể link đè record còn tồn tại. Holder thật đã chết không release. Tôi chưa tìm lịch hai holder trong **mô hình một host/namespace, facts đúng và callback đồng bộ** này.

Gộp claims vào state làm mất thứ tự lock nóng lồng nhau là đúng. `stateTx` phải là handle hợp lệ, không phải boolean “đã lock”. `acquireClaim` hiện tự gọi `withClaimsLock`; release/settle cũng cần chuyển đồng thời. Không chờ cold lock khi đã ở state. Các cold mutex trong process Node cần retry async như §6.3; helper wait đồng bộ trên holder khác cùng event loop có thể tự chặn. Bản 3 đã cấm kiểu chờ đó, nên tôi không tính nó thành phát hiện mới.

**Phân tầng, authority và cách hoàn thiện lộ trình**

Tách terminal-control, agent-protocol và run supervisor là hợp lý. `send/read/activity` qua port giúp protocol không cần biết pane. Opaque post-receipt command **không tự nó vi phạm** Dependency Inversion. L5 vẫn định nghĩa evaluator và artifact; L4 chỉ chạy callback theo contract. Cần command id, release/version pin, allowlist/capability, idempotency và receipt bước. Không được biến supervisor thành người hiểu verdict hoặc quyết retry.

Hai authority thật hiện xuất hiện ở các khoảng chuyển đổi: ledger cũ và kernel mới cùng cấp quyền (R3-1); reaper cũ và attempt lock mới bất đồng về quyền xoá home (R3-10). Sửa bằng một giao thức hiệu lực cho mỗi resource, không bằng “cả hai có cùng vector”.

Bảng tầng có một chỗ cần sửa chữ: §4.2 đặt launch gate ở L4, nhưng §5.2 gọi gate §9.3 là L0, trong khi gate đó biết attempt lock/envelope/report. Tách primitive process-control L0 khỏi gate điều phối attempt L4. Không kéo holder-lock hoặc receipt xuống leaf facts/control để hợp thức hoá một tên.

Giữ BoundInvocationSupervisor riêng. Source và lịch sử xác nhận nó gắn với một RPC ngắn và caller; run supervisor phải sống qua controller. Chỉ dùng chung primitive quản process/capture. Không có bằng chứng cần gộp hai vòng đời.

Thứ tự đề nghị: (1) chốt cutover/floor/capability matrix; (2) primitive + registry + doctor/setup và proof trên backend thật; (3) writer/reader từng lock trong cùng commit; (4) acquire attempt trước prepare, supervisor/gate và reaper ownership chuyển cùng carrier; (5) adopt theo từng receipt bước rồi mới bỏ binding cũ; (6) terminal-control/agent-protocol theo vector thật. `lockProtocolFloor` không chờ 4.5. `finalize/adopt` cho direct không chờ 6.4 nếu 6.2 đã quảng cáo controller-crash survival. CHANGELOG đi cùng mỗi thay đổi nhìn thấy được; spec/boundary và contract phải có trước writer đầu tiên.

Chính sách “supervisor chết thì agent tiếp tục tới trần cứng” có thể giữ. Nó phục vụ tránh trả tiền model lần hai. Nhưng cần R3-2 đóng và output độc lập với supervisor: nếu direct dùng pipe mà reader ở supervisor chết thì agent có thể gặp EPIPE; P4 dùng file nên không chứng minh nhánh pipe. Terminal interactive cũng cần quy tắc nhận outbox hoàn tất khi supervisor chết, rồi gate giết REPL ở trần; không tự biến claim đã hoàn tất thành thất bại chỉ vì UI còn mở. Trần phải dùng mốc tuyệt đối/monotonic cùng boot; P4 dùng duration tính lúc launch nên chưa chứng minh “khởi động muộn không gia hạn”.

**Các điểm đã tấn công mà thiết kế đứng vững**

- Linux flock trên hai description độc lập: không có re-entry theo pid. Đóng đúng bản sao cuối nhả lock. 200 lượt đa process không overlap.
- Helper acquire rồi bị timeout/SIGKILL: đóng fd caller giải phóng, không có acquire muộn bị bỏ quên như B8 cũ.
- SCM_RIGHTS sau GO: supervisor chết, gate vẫn giữ lock; worker xong thì lock trống. Trước GO: connect refused hoặc EOF, worker không chạy. Chạy lại nguyên probe `probe_terminal_gate_fd_passing.py`.
- Reclaim nóng tuần tự dưới kernel lock đóng lịch A1 đã biết. Không cần đưa helper vào fast path.
- Tombstone directory bảo vệ được các file lock main/events/claims đã thử. Không có lý do bỏ giải pháp này cho đúng họ file.
- Giữ ledger run-control không GC, receiver CAS, handle checkpoint, beacon tách mutex và phạm vi raw Git được thừa nhận đều là quyết định đúng.
- Gom nhóm không lock ở phương án (a), hai tab cùng nhãn, bỏ root pane rỗng, đóng pane được cấp thay vì cả tab, và không đọc nhãn để quyết quyền: chưa thấy phản ví dụ cần đảo các luật này.
- Phân biệt receipt vật lý, Run Result Evaluator và settlement unit là đúng. Resume nhận kết quả attempt cũ là hướng cần giữ; phải bổ sung các trạng thái phục hồi R3-4.

**Khuyến nghị cho chủ sở hữu và kết luận**

Mục 16 của bản 3 chưa có câu hỏi cụ thể. Không cần hỏi lại các mặc định đã chọn. Giữ kernel lock Linux; giữ Node hot path tạm có điều kiện kết thúc; giữ placement (a); giữ supervisor độc lập; giữ agent chạy tiếp khi supervisor chết nếu process-tree containment được chứng minh.

Chỉ có quyết định mới nếu không thể chứng minh containment với hạ tầng đã có: chấp nhận dependency backend quản cả cây và đưa vào setup/doctor, hay thu hẹp carrier/platform được hỗ trợ. Tôi nghiêng về backend có thể chứng minh vòng đời cả cây, vì mục tiêu là chạy project/workflow ngoài repo an toàn. Không nên công bố full supervisor contract rồi để adopter đoán hậu duệ đã chết. Với cutover, giữ downtime có admission đóng cho tới khi proof đủ; nếu không thể chặn launcher cũ thì chưa flip, không lấy một lần scan làm thay thế.

**Kết luận: CHƯA DUYỆT bản 3 để trở thành plan có writer.** Có thể tiếp tục primitive và proof trên fixture. Cần đóng R3-1 đến R3-7 và R3-10 trước các writer tương ứng. Các điểm medium phải được ghi thành contract và điều kiện enable rõ, không để implementer tự đoán.

Danh sách phát hiện mới: **R3-1 critical** cutover/tombstone; **R3-2 critical** gate chết còn hậu duệ; **R3-3 high** prepare trước ownership; **R3-4 high** adopt bỏ sót settlement/finalize; **R3-5 high** observer giữ lease; **R3-6 high** thiếu launched bị suy thành pane rỗng; **R3-7 high** thenable guard quá muộn; **R3-8 medium** shellout plan evidence trong hot lock; **R3-9 medium** fd leak và quyền borrower; **R3-10 high** thứ tự chuyển reaper; **R3-11 medium** server incarnation/close; **R3-12 medium** platform và gate vận hành. Các phần đứng vững và khuyến nghị ở trên là phần cần giữ khi sửa, không cần thiết kế lại từ đầu.

Các điểm đứng vững cần giữ: exclusion của flock trên Linux đã đo; kill/reap/close của helper; chuyển fd qua SCM_RIGHTS; reclaim nóng dưới kernel lock; tombstone cho đúng họ file; CAS settlement và tách các authority.

Khuyến nghị cho chủ sở hữu: giữ các lựa chọn nền đã chốt. Chặn cutover và writer supervisor cho tới khi có proof về admission, vòng đời cả cây process, phục hồi từng bước và reaper cùng phiên bản. Chỉ mở câu hỏi mới nếu phải thêm backend quản cả cây hoặc thu hẹp platform/carrier; không hỏi lại các mặc định đã có.
