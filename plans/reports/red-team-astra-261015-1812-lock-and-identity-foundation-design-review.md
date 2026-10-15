<!-- Nguồn: .fgos/assignments/unit-run-1792061817538-f3039d4e/producer/1/runs/01/worker-output/outbox/agent-report.md — openai/tetcu72, gpt-6-astra (frontier), fgos run read-only, 2026-10-15 17:56–18:11. Bản sao nguyên văn. -->

# Phản biện độc lập: nền lock + identity của fgOS

Ngày: 2026-10-15. Assignment: `unit-run-1792061817538-f3039d4e/producer/1`.

**Kết luận: chưa nên duyệt thiết kế để triển khai nguyên trạng.** Hai lựa chọn đúng là tách quyền lock khỏi writer identity và bác thuật toán rename-reclaim đã nêu. Nhưng sidecar thay thế vẫn mất loại trừ; migration v1/v2 có đường xoá lock của holder sống; thu hẹp vùng claim làm mất tính nguyên tử của kiểm sức chứa. Đây là lỗi hợp đồng, không phải chi tiết có thể để tới khi port Rust mới quyết.

Báo cáo có **14 phát hiện: 2 critical, 10 high, 2 medium**. Mức độ đánh giá hậu quả nếu triển khai theo tài liệu; không có nghĩa tất cả lỗi đề xuất đều đã tồn tại trong production.

## Phạm vi và cách kiểm

Đã đọc thiết kế Lead, toàn bộ ba báo cáo kiểm kê/S6/Rust-first, các mục 2, 5, 10, 11 cùng bảng spike của báo cáo hội đồng, reading-map và các luật/spec liên quan. Đối chiếu source Node/Rust được dẫn dưới đây; kiểm lịch sử `HOLDER_PID_ENV_VAR`, worker-slot và các commit `ffc64b1aa`, `2bd1847e4`. HEAD đọc được trong phiên: `5b89f8a7f472c1def927dd06cb7f4a3a206ed1af`.

Các đường dẫn `file:dòng` tính từ `/home/vantt/projects/forgentX`. Viết tắt **Thiết kế** chỉ `plans/reports/design-261015-1755-lock-and-identity-foundation-lead-design.md`; **S6** chỉ `plans/reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md`.

Không sửa source/spec/config, không commit trong repo thật, không chạy `npm test` hoặc `cargo build`, không acquire/xoá lock thật. Các commit Git thử nghiệm chỉ nằm trong repo nháp dưới `/tmp/fgos-lock-redteam-TgXqPp`. Công cụ GitNexus không có trong phiên; dùng source và lịch sử Git trực tiếp, không tạo lại index. Mã và kết quả đầy đủ được nhúng cuối báo cáo để không lệ thuộc tuổi thọ của `/tmp`.

Phân biệt ba loại bằng chứng:

- **Source thật:** gọi các hàm hiện có với đường dẫn tạm, hoặc đọc đường thực thi với dẫn dòng.
- **Mô hình thiết kế:** thực thi đúng chuỗi thao tác được đề xuất; holder-lock v2 chưa tồn tại, nên không gọi đây là test implementation v2.
- **Git thật với hook mô hình:** chứng minh hệ quả của hook chỉ đọc mutex và của việc giữ mutex quanh `git worktree add`.

## Các phát hiện

### A1 — critical — Sidecar hết tuổi làm sống lại chính khe so-rồi-unlink mà nó muốn đóng

**Bằng chứng:** Thiết kế:81–85; thử `probe.py`, ca `sidecar-expired-live-reclaimer`, kết quả `twoLiveHolders: true`, R1 xoá token `H2` của R2 vẫn sống. Đây là hai process thật, `link`/`unlink` thật, holder ban đầu thật sự đã chết. Không cần pid reuse, khác host, filesystem mạng hay đồng hồ nhảy.

Lịch chạy:

1. Lock chính chứa D đã chết. R1 tạo sidecar, đọc lại D, xác nhận D chết.
2. R1 bị dừng ngay sau lần kiểm cuối, trước `unlink(D)`.
3. Sidecar quá TTL. Theo 4.4.4, R2 xoá sidecar bằng tuổi, tạo sidecar mới, dọn D và acquire H2. R2 tiếp tục vùng găng.
4. R1 chạy tiếp lệnh `unlink` đã quyết: pathname nay chứa H2. R1 xoá H2 rồi acquire H1.
5. H1 và H2 đều còn sống và đều tin mình giữ lock.

Thử dùng TTL 50 ms và chờ 90 ms để chạy nhanh; với TTL vài giây, chỉ cần pause dài hơn tương ứng. Đọc lại token sidecar ngay trước unlink cũng không sửa được: process vẫn có thể dừng giữa lần đọc cuối và unlink. Tăng TTL chỉ làm lịch chạy hiếm hơn.

Ngay cả nếu sửa thành “chỉ dọn sidecar có pid chết”, vẫn phải định nghĩa **cách** dọn sidecar nguyên tử: hai người cùng đọc sidecar chết S, người đầu xoá S rồi tạo sidecar mới; người sau unlink dựa trên S sẽ xoá sidecar mới. Không có primitive compare-and-unlink trong các bước đang nêu. Nếu sidecar không dọn được thì crash gây kẹt; nếu dọn theo tuổi thì mất loại trừ. Đây không phải vấn đề tự hết bằng cách nói “không đệ quy”.

**Hệ quả:** mất loại trừ ở mọi mutex chuyển sang component, gồm events/claims/activation; có thể ghi seq trùng, làm hỏng transaction claim hoặc publish chồng. Sidecar release muộn cũng phải được xét cùng lịch chạy, không chỉ reclaim lock chính.

**Sửa tối thiểu:** bỏ 4.4.4 theo tuổi và rút khẳng định an toàn ở 4.4.3. Chưa chuyển writer nào tới primitive này trước khi có cơ chế handoff không xoá pathname của thế hệ mới và bằng chứng crash/pause. Ledger bất biến sẵn có là ứng viên có cơ sở; phải giữ luật chỉ tiếp quản holder chắc chắn chết, và không GC thế hệ mà contender cũ còn dùng. Không coi “thêm một lần đọc lại” là bản sửa.

### A2 — critical — Reader v1 không chỉ bị chặn bởi v2: claim cũ sẽ xoá v2 của holder sống

**Bằng chứng:** Thiết kế:121,135,138–139,151; `src/runner/main-checkout-lock.mjs:209–220,716–735`; `src/runner/claim-port.mjs:118–132`. Ca source thật `v1AgainstV2`: `oldReader: ambiguous`, `oldClaimRecovery: reclaimed`, `fileExists: false`, trong khi owner v2 chính là process đang chạy.

Record v2 không có `pid`/`ts` ở cấp trên. Parser v1 trả null. `claimWork` v1 gặp AMBIGUOUS gọi `forceReclaimAmbiguousLock`, rồi retry acquire. Như vậy release cũ có thể gỡ mutex mà release mới đang giữ. Reader **mới** biết đọc cả hai không làm reader **cũ** biết v2. Bật writer theo activation mới cũng không dừng process cũ đã chạy, đường compat, hoặc hook import working-tree.

Giữ namespace cũ gây lỗi trên; đổi pathname mà không có cutover chung lại cho mỗi phiên giữ một file khác nhau. Cả hai đều không thoả “một tài nguyên, một mutex”.

**Hệ quả:** split-brain ngay trong quá trình nâng cấp/dev, đúng những trường hợp R4 tự cho phép; rollback sau khi writer v2 đã chạy cũng có cùng lỗi.

**Sửa tối thiểu:** trước writer v2 phải có release tương thích từ chối an toàn unknown-version, loại bỏ reclaim mù của v1, rồi có barrier/drain xác nhận các writer cũ đã hết. Nếu không bảo đảm điều đó, phải đóng cửa sử dụng phiên bản hỗn hợp. Chốt ma trận old/new reader, writer, hook, `fgctl`, compat, rollback bằng test cùng tài nguyên. “Không dual-run write để so sánh” không phải lý do bỏ test tranh chấp hỗn hợp phiên bản.

### A3 — high — Không biết holder còn sống không thể biến thành bằng chứng chết bằng TTL

**Bằng chứng:** Thiết kế:39,64,67–70,85,149–150. `process-identity.mjs:23–41,59–69` hiện chỉ trả `dead`/`held`, không trả unknown; không kiểm host. Trường nó đọc là `processStartTime`, khác `owner.startTime` của v2. Ca source `processAdapter` cho kết quả `held` với `startTime` cố ý sai và `dead` với cùng giá trị sai đặt vào `processStartTime`. `packages/distribution/rust/src/lock.rs:63–95` có driver Windows; `docs/specs/distribution.md:310` xác lập Windows native là target thật.

Ba khoảng trống:

- **Unknown→TTL→reclaim:** holder trên host khác, hoặc `/proc` không đọc được, có thể vẫn ghi dữ liệu. Sau TTL, người thứ hai được vào mà người thứ nhất chưa mất khả năng ghi. Đồng hồ nhảy tới làm lỗi tới sớm; đồng hồ lùi gây kẹt. Dù đồng hồ hoàn hảo, hết tuổi vẫn không chứng minh chết.
- **“L-os đã có sẵn” chưa đúng về contract:** phải kiểm cùng host/namespace trước khi dùng pid/startTime/bootId. BootId khác trên host khác không chứng minh host gốc đã reboot. Helper hiện có không làm việc đó; đổi tên trường mà không adapter làm mất kiểm pid reuse. Windows không có `/proc`; đẩy toàn bộ target này vào TTL là thay đổi an toàn lớn, không phải fallback vô hại.
- **Hỏng/rỗng >2 s:** với publisher temp+link hợp lệ thì file cuối không có cửa sổ ghi rỗng. Nhưng writer legacy dùng create-then-write có thể bị dừng quá 2 s; record phiên bản mới không hiểu cũng có thể bị gọi là “hỏng” như A2. Tuổi không chứng minh các trường hợp ấy đã chết. Hơn nữa 4.4.2 đòi owner vẫn chết trong khi record hỏng không có owner để kiểm: hai mục chưa nhất quán.

R3 cho `unlock --force` với xác nhận cũng chưa tạo fence cho holder sống đang treo. Xoá file rồi holder đó tiếp tục sẽ phá chính luật “không cướp holder sống”.

**Hệ quả:** safety khác nhau theo platform/permission/host; mất dữ liệu sau pause hoặc một lần sửa lock thủ công. Không thể dùng chung bảng như hiện tại cho mutex, lease và beacon.

**Sửa tối thiểu:** mutex unknown phải HELD/UNKNOWN; chỉ takeover theo deadline khi resource có fencing thực sự. Chốt facts API với ba trạng thái, adapter trường v2, host/boot/process namespace và driver Windows trước cutover. Tách unsupported schema, lỗi I/O và corrupt record; recovery không có chứng cứ phải từ chối hoặc có quy trình quiesce. Force-unlock holder sống phải chứng minh tác nhân ghi đã bị dừng và không chạy lại, hoặc resource từ chối thế hệ cũ.

### A4 — high — Grant hiện là bearer token có thể nhân bản, chưa phải quyền mượn có giới hạn

**Bằng chứng:** Thiết kế:20,57,65–66,120. `src/runner/dispatch/adapters.mjs:99–108` giữ mọi env ngoài danh sách bỏ; `transport.mjs:530–535` và `confinement/authority.mjs:1402–1409` trải env ấy vào worker. Cách truyền hiện tại trong `merge.mjs:1582–1591` cố ý giới hạn `HOLDER_PID_ENV_VAR` cho một lệnh Git, không export toàn process. Kiểm kê:212 còn nói “đúng một lời gọi con”, nhưng thiết kế Lead không mã hoá giới hạn ấy.

Một parent cấp cùng `FGOS_LOCK_GRANT=<name>:<token>` cho hai child độc lập thì cả hai khớp hàng grant và cùng vào. Writer id khác nhau không cứu được. Đây là quyền vào song song được mang qua env, cùng kiểu rủi ro kế thừa của RT2-2, dù token khó đoán hơn pid. Không khẳng định source hiện tại đã phát biến mới này: phát hiện là contract mới không ngăn cách triển khai ấy.

Handle và grant đều mang cùng token; chưa có cách phân biệt “được borrow” với “được renew/release”. Token còn nằm trong record đọc được, nên không được coi nó là ranh giới chống actor có quyền đọc/ghi filesystem. Scope chỉ có `name`, chưa nêu canonical resource/repo/epoch. Bảng cũng chưa nói grant bị từ chối khi owner đã chết, đã release hoặc mất epoch.

Quan trọng hơn: child Git có thể còn chạy khi parent holder chết hoặc release sớm. Liveness của **parent** không đủ chứng minh vùng găng của child đã dừng. Chỉ đặt owner vào parent rồi reclaim ngay theo pid chết vẫn có thể cho writer mới vào cùng Git con cũ.

**Hệ quả:** hai attempt có cùng grant đi qua loại trừ; borrowed handle có thể nhả lock cha; hoặc reclaim khi tác nhân ghi được uỷ quyền vẫn đang chạy.

**Sửa tối thiểu:** định nghĩa grant là delegation của một transaction có phạm vi canonical resource+epoch, mode borrow, lifetime và quy tắc không chạy song song. Không phát grant cho worker độc lập; scrub tại cả ba launch path và chỉ gắn vào đúng subprocess cần thiết. Parent phải join borrower trước release; có quy tắc khi parent chết/child mồ côi. Chốt API phân biệt handle chủ và borrower. Vectors phải có hai child cùng env, reuse grant sau release, sai repo/epoch, parent chết và borrower chưa xong.

### A5 — high — Hook chỉ đọc mutex là check-before-use, không loại trừ với land

**Bằng chứng:** Thiết kế:115,135; `.githooks/pre-commit:434–475,503`; `src/runner/merge.mjs:1907–1927`. Thử Git thật `hook-read-only-vs-land`: hook thấy mutex trống, dừng; land lấy mutex rồi `update-ref` và `read-tree` đều exit 0; cho hook đi tiếp thì `git commit` exit 128, `cannot lock ref 'HEAD' ... expected ...`. Không chứng minh mất commit trong ca này: CAS của Git đã chặn nó; bằng chứng là thao tác vẫn xen kẽ và commit bị lỗi sau khi hook cho phép.

Chiều “land đã giữ mutex rồi hook tới” chỉ là một nửa. Chiều ngược lại không có reservation: hook kiểm free rồi land vào trước khi Git commit hoàn tất. Beacon không được claim/land đọc nên không đóng khe này. Các lệnh `git add`, reset và sửa working tree còn xảy ra ngoài pre-commit.

`src/setup/git-hooks.mjs:98–107` xác nhận project ngoài không tự có hook fgOS; còn hook custom được giữ nguyên. Vì vậy W1-a/W1-b có tác động tới mọi project, nhưng không phải mọi project đang mắc lỗi đèn 180 s, cũng không phải mọi project có sự bảo vệ hook mà thiết kế ngầm cần.

**Hệ quả:** commit tay và land vẫn tranh index/HEAD; fail sau verify/commit vẫn xảy ra. Phát biểu “mutex bảo vệ main” quá rộng so với những actor thực sự tham gia.

**Sửa tối thiểu:** chốt phạm vi bảo đảm: mọi writer được hỗ trợ phải tham gia cùng transaction exclusion từ trước mutation tới khi Git xong. Nếu commit tay không được bọc, ghi rõ giới hạn và giữ CAS/dirty recheck để từ chối an toàn; không dùng một phép đọc trong hook làm bằng chứng exclusion. Thêm test hai chiều và tại khe giữa `update-ref`/`read-tree`, gồm project không cài hook.

### A6 — high — Inventory thao tác ghi main sai ở sync-root và thiếu các cửa ghi khác

**Bằng chứng:** Thiết kế:115–121,135; kiểm kê:124,157 là nguồn của tiền đề sai.

| Đường thực thi thật | Source | Điều thiết kế còn thiếu |
|---|---|---|
| `sync-root` của root không parent gọi `runAndReport(repoRoot)` trực tiếp | `src/verbs/merge/sync-root.mjs:266–278`; `merge.mjs:856–874,1302,1591` | Merge, verify, abort và commit đang diễn ra trên main. Không thể chỉ đổi main mutex thành target slot. |
| Checkpoint được gọi khi chỉ có merge-slot | `merge.mjs:770–804`; `src/state/events-jsonl-truncation-guard.mjs:490–503` | Ghi `git add`, commit, và reset khi lỗi vào main; slot của target không loại trừ với land hay slot target khác. |
| `main-checkout-reset` | `bin/fgos.mjs:4327–4368` | Kiểm sạch/lost commits rồi `reset --hard`, không acquire main mutex. `--confirm` không tuần tự hoá với land. |
| `fgctl init`/publish | `packages/distribution/rust/src/init.rs:940–947`; `lock.rs:135–143` | Chỉ kiểm main lock rồi acquire **activation.lock** khác. Sửa reader v2 không tự biến nó thành holder của main mutex như bảng mục 5 yêu cầu. |

`promote-engine.mjs:73–78` đúng là dùng ephemeral worktree. Nhưng slot phải bọc **bên ngoài** `withMergeEphemeralWorktree` để bảo vệ cả lúc đọc target tip, như contract `merge.mjs:763–768`; thay riêng lock phía trong không đủ. Commit `ffc64b1aa` đã thay root approve sang CAS/ephemeral, không chứng minh sync-root có cùng đường đó.

**Hệ quả:** thay `sync-root` theo nguyên văn mở lại cuộc đua main index/MERGE_HEAD đã có lịch sử; các checkpoint/reset vẫn phá invariant dù primitive mới hoàn hảo. `fgctl init` vẫn chỉ có advisory check nếu không đổi call site.

**Sửa tối thiểu:** sửa tiền đề tài liệu trước. Giữ main mutex cho nhánh sync-root đang ghi main cho tới khi nó thật sự chuyển sang đường ephemeral+land. Đưa checkpoint vào một cửa có mutex quanh toàn bộ add/commit/reset, mọi caller đều dùng. Bao check+reset trong cùng mutex. Ghi rõ `fgctl` cần exclusion tài nguyên nào và acquire thật tại đâu; không gọi reader là writer. Lập thứ tự lồng lock cho merge-slot → main và main → events → claims; cấm chiều ngược gây deadlock.

### A7 — high — Thu hẹp mutex claim làm vỡ trần worker dù events.lock và claims.lock vẫn đúng

**Bằng chứng:** Thiết kế:117; `claim-port.mjs:169–171,207–215,299–321`; `runtime-coordination.mjs:198–211`; `worker-slots.mjs:140–163`. Ca source `narrowedClaimModel`: hai precheck đều allowed với ceiling=1, hai `acquireClaim` hợp lệ cho hai item khác nhau, occupancy cuối =2.

Đây là mô hình đường claim **sau khi bỏ vùng mutex rộng**, dùng helper production thật, không phải tuyên bố `claimWork` nguyên trạng đã bị vượt ceiling trong thử nghiệm. Lịch: A đọc còn một slot; B đọc còn một slot; A giữ events/claims lock và claim item a; B lấy các lock ấy sau A và claim item b. Đoạn fresh read hiện tại chỉ kiểm durable status/revision của item, không kiểm lại số active claims. `claims.lock` bảo vệ từng lần read-write nhưng không tự đưa precondition bên ngoài vào transaction.

**Hệ quả:** vượt ngân sách worker của project đang dùng fgOS; mở N worker dù trần cứng chỉ còn một chỗ. Đây là vai trò đang có của mutex rộng mà kiểm kê “claim chỉ cần mutex cho checkpoint” đã bỏ qua.

**Sửa tối thiểu:** chuyển kiểm capacity sang cùng critical section chứa snapshot active claims và acquire claim, dùng thứ tự events→claims nhất quán với settle. Không cần giữ main mutex cho toàn claim. Test hai item khác nhau tranh slot cuối; test cùng item vẫn conflict; thêm stale-reclaim và worker branch provisioning thất bại.

### A8 — high — Trường epoch không tự tạo fencing; một file bị xoá không giữ được lịch sử epoch

**Bằng chứng:** Thiết kế:49,57,88–90,98–105. `src/runner/dispatch/run-lock.mjs:213–235,306–351` có ledger bất biến thực sự; `merge.mjs:1912–1923` chỉ truyền SHA old/new vào Git, không truyền lock epoch.

Sau release/unlink, acquire thấy “không có file”. Epoch tiếp theo lấy từ đâu? Nếu chỉ đọc record vừa bị xoá thì không biết max epoch, có thể dùng lại số cũ. Token ngẫu nhiên ngăn nhầm instance khi so token; không thay được thứ tự fencing epoch.

“Người nhận từ chối epoch cũ” chưa chỉ ra người nhận là ai ở land. Git `update-ref` có SHA CAS, không phải receiver của holder-lock epoch. `read-tree`/index/working tree không có check epoch kèm mutation nguyên tử. Check epoch rồi shellout vẫn có khe. Nếu unknown/force takeover cho phép holder cũ chạy tiếp, thêm epoch vào JSON không chặn nó ghi.

**Hệ quả:** lease có vẻ được fenced nhưng sink chưa thực thi; holder cũ vẫn ghi sau takeover. Chuyển hết sang ledger chỉ chữa cuộc đua publication, không tự chữa sink chưa biết fence hoặc việc cho owner sống mất quyền bằng TTL.

**Sửa tối thiểu:** chỉ tuyên bố fencing ở những resource có durable monotonic authority và receiver thật. Nêu high-watermark tồn tại qua release/restart/GC. Với main index không có receiver hỗ trợ epoch, giữ exclusion không takeover holder có thể còn ghi; phân biệt SHA CAS bảo vệ ref với bảo vệ checkout.

### A9 — high — Facade lock qua Rust chưa xác định tiến trình nào thực sự là holder

**Bằng chứng:** Thiết kế:31–37,47,138–139; đề xuất Rust-first:62,87–92; S6:124. Các Rust writer hiện hữu lấy `std::process::id()` (`packages/distribution/rust/src/init.rs:181–184`, `packages/observe/rust/src/store_lock.rs:154–156`) và giữ guard trong process làm việc.

W4 đổi acquire/renew/release thành từng subprocess Rust. Nếu crate ghi pid của chính process acquire, subprocess thoát ngay khi trả handle; contender sẽ chứng minh owner chết và acquire trong lúc Node vẫn làm việc. Điều kiện truyền `--pid` của S6 giải **writer identity**, chưa hề định nghĩa physical lock ownership của API này. Không được ngầm coi hai pid là một.

Ngay khi chọn caller Node làm owner, Rust phải kiểm pid/startTime/bootId của caller, không chỉ tin pid được gửi; cần quy tắc caller chết trước khi acquire trả về, timeout làm kết quả acquire không rõ, và release-on-exit gọi binary sau activation đổi. Trường hợp caller chết nhưng Git con còn chạy thuộc A4.

**Hệ quả:** có thể mất loại trừ ngay với hai acquire tuần tự, không cần sidecar; hoặc để lock mồ côi vì facade không biết lệnh acquire đã publish trước timeout hay chưa.

**Sửa tối thiểu:** chốt `owner` là tác nhân chịu trách nhiệm transaction, tách khỏi identity và pid helper; API phải mang identity OS có thể kiểm chứng, trả token ngay cả đường cần reconcile, và có quy tắc orphan. Thêm test Node holder sống sau Rust helper exit, caller chết trước/sau publish, helper timeout, exit release và child Git sống lâu hơn holder. Đây là gate trước khi flip facade.

### A10 — high — D7 chưa mâu thuẫn với Rust có điều kiện, nhưng W2–W4 chưa có đường hoàn tất thoả S6 và một authority

**Bằng chứng:** Thiết kế:24,134–140; S6:118–132; đề xuất Rust-first:120–127,131–135,181–186; `events.mjs:410–421,482,528–529`; `store.mjs:246–250,1640,1841`; `claim-port.mjs:299–321`; `runtime-coordination.mjs:199,228`.

Chọn Node sửa nghĩa trước rồi Rust port vector là hợp lý; S6 là conditional pass của **proxy gọi identity**, không phải chứng nhận mọi RPC lock. Những thiếu sót cụ thể:

1. **Resolve trước lock chưa bao phủ outer lock.** Chuyển resolve ra ngoài `appendEventCore` chỉ sửa `appendEvent` trực tiếp. Nhiều `store` API đã giữ `withEventsLock` rồi mới resolve writer/log path; `claimWork` giữ events.lock rồi `acquireClaim` mới resolve identity. Lazy cache một lần/process có thể miss ngay ở bên trong outer lock.
2. **Lock RPC vẫn exec trong vùng giữ events.lock.** Ngay cả khi acquire RPC xảy ra trước lúc lấy lock, release RPC bắt đầu khi lock còn đang giữ, và renew cũng vậy. claims.lock lồng dưới events.lock còn kéo acquire/renew/release RPC vào vùng găng ngoài. Điều kiện “events.lock chỉ chuyển khi exec nằm ngoài vùng giữ lock” chưa có cách thực hiện bằng facade từng thao tác.
3. **W3/W4 còn hai implementation.** W3 tạo crate trong khi Node holder-lock vẫn vận hành; W4 chỉ nói xoá logic tương ứng đường lạnh, để events chờ vô hạn. Test cùng vector là công cụ phát hiện drift, không biến hai implementation thành một authority. Chưa nêu thời hạn/kết thúc hoặc phương án nếu S6 fail.
4. **Cổng đo bị rút ngắn.** S6 đòi warm ≤5 ms **overhead** p95 và cold ≤6 ms, route native dưới recursion guard, direct binary cùng release, đúng caller pid. W4 chỉ ghi “≤5 ms p95”. Không có quyết định bootstrap hook khi chưa activation, host mismatch, cache source/registry theo repo. Rust-first đã nêu các câu hỏi đó, Lead chưa chốt.
5. **Thứ tự proof muộn.** Test sidecar tới W2 mới nêu, trong khi W1 đã khai contract/grant v2 và sửa main lock. Nếu W1 dùng protocol mới thì phải chứng minh trước W1-b; nếu W1 còn protocol cũ thì phải ghi rõ điều nào chưa sửa. D3 hứa grant cho mọi lock ngay wave 1, nhưng W1-b chỉ làm phần main và các lock khác tới W2; cần ghi rõ phạm vi invariant nào đã thật sự đóng trước 1c. Doctor/CHANGELOG ở W5 cũng quá muộn cho activation và scope mới ở W1/W2/W4.

**Hệ quả:** hoặc vi phạm S6 bằng exec trong vùng găng, hoặc giữ Node mirror vô hạn; implementation agent phải tự quyết những câu hỏi kiến trúc chưa được duyệt. Lợi latency hook chủ yếu là dogfood; regressions lock/claim là chi phí cho mọi project.

**Sửa tối thiểu:** giữ các điều kiện S6 đầy đủ làm gate và có nhánh dừng được đặt tên; audit theo **call graph critical section**, không chỉ helper. Chọn một đường hoàn tất cho hot path (trọn use-case trong process Rust, hoặc bridge in-process được đo/chấp thuận) trước khi hứa xoá Node authority. Nếu chưa chọn, ghi trung thực giai đoạn hai authority có hạn và criterion kết thúc. Đưa setup/doctor/CHANGELOG vào chính wave đổi hành vi, cùng proof protocol trước writer đầu tiên.

### A11 — medium — Beacon và grant có thể làm hook tự chặn checkpoint hoặc làm beacon biến mất ngay

**Bằng chứng:** Thiết kế:64–73,114–120; `.githooks/pre-commit:123–129,471–475`; `claim-port.mjs:161–168`; lịch sử `00aafe0ce` sửa đúng self-collision ở checkpoint.

Beacon dùng record v2 có `owner`, nhưng bảng không có ngoại lệ owner chết cho beacon. Nếu owner là process hook thì nó chết ngay sau commit; hàng “owner chết→dọn” đứng trước TTL làm đèn tắt trước 20 s. Nếu dùng pid phiên sống lâu hơn, mục 3 lại chưa xác định owner đó là ai. `windowMs` ở mục 5 khác `ttlMs` trong schema chung.

Chiều ngược: A vừa commit và để beacon writer A. B lấy main mutex cho checkpoint hợp lệ, hook của B có grant khớp main mutex, nhưng beacon vẫn writer A trong cửa sổ. Tài liệu không nói grant bỏ qua beacon, cũng không nói fgOS checkpoint không cập nhật beacon. Nếu hook vẫn kiểm beacon độc lập, checkpoint lại bị chặn 20 s. Nếu hook lấy token/pid cha làm writer của beacon như code cũ mượn identity, còn có thể đổi đèn của chính phiên sang một định danh ngắn hạn và tự chặn lần commit tay kế tiếp.

**Hệ quả:** tái tạo một phiên bản 20 s của lỗi 180 s, hoặc D2 giữ một đèn thực tế không sống qua hook. Đây là mâu thuẫn contract chưa có implementation để test trực tiếp.

**Sửa tối thiểu:** tách bảng beacon theo `kind` trước liveness; một tên trường thời hạn, owner chỉ audit đối với beacon. Quy định tường minh transaction có grant main hợp lệ được đối xử thế nào với beacon và có được ghi beacon không. Test A commit→B checkpoint ngay, cùng phiên commit→checkpoint→commit, grant hợp lệ+beacon khác writer, hook lỗi sau khi ghi beacon.

### A12 — high — “Claim dùng lineage” có nguy cơ đưa quyền theo gia phả trở lại cửa settle

**Bằng chứng:** Thiết kế:126–128,152; Rust-first:108–110 nêu V-lineage chỉ audit. `runtime-coordination.mjs:215–245` lưu writerId chủ claim; `src/state/store.mjs:1125–1144` cố ý không cho bất cứ người đọc được claimId nào settle claim, mà kiểm writerId riêng.

Inventory S1 là cần thiết nhưng chưa phải lời giải. Hai worker A/B có id riêng, cùng parent P. Nếu “claim dùng lineage” nghĩa là cùng lineage được settle, B đọc claimId của A rồi return/settle hộ A sẽ qua. Khi đó RT2-2 chuyển từ mutex sang claim. Nếu chỉ giữ so writerId chính xác, runner/parent đã claim trước khi spawn child lại có thể bị lỗi writer mismatch khi child cần thao tác được uỷ quyền. Hai hướng này cần một contract ownership cụ thể, không thể giao cho inventory tự quyết.

Câu mục 6 “1c chỉ còn ảnh hưởng attribution” cũng quá mạnh: dòng kế tiếp và source settle chứng minh writerId còn quyết định quyền. Rủi ro không chỉ là liveness.

**Hệ quả:** sibling nhận nhầm quyền kết thúc claim đang sống, hoặc quy trình take→worker→return tự chặn mình sau 1c.

**Sửa tối thiểu:** giữ lineage chỉ quan hệ/audit. Chốt actor nào sở hữu claim qua các pha và cơ chế handoff/delegation gắn đúng claimId+attempt nếu cần; không dùng common ancestor làm quyền. S1 phải test sibling settle bị từ chối, parent/child được uỷ quyền đúng được phép, retry attempt cũ không settle claim mới.

### A13 — high — Chuyển dispatch lock sang máy chưa có cutover chung cho acquire, resume và reconcile

**Bằng chứng:** Thiết kế:21,101,137,153. `src/runner/main-checkout-lock.mjs:79–80`; `src/runner/execution/run.mjs:342–362`; `src/runner/dispatch/reconciliation-planner.mjs:189–205`; hai acquire writer tại `dispatch/cli.mjs:726` và `dispatch/assignment-runner.mjs:2219`. `packages/distribution/rust/src/store.rs:59–62` có state-root override; `provider-capacity.mjs:38` lại dùng một gốc khác theo home.

Đúng là cwd cần canonical resource. Nhưng W2 chỉ nói chuyển lock theo phạm vi; không buộc flip hai writer cùng các reader/resume/reconcile trong một bước. Reader hiện tại tự dựng pathname dưới `.fgos` và đọc top-level `pid`. Sau writer đổi v2/path, resume có thể thấy “không holder”; reconcile có thể dọn nhầm path cũ hoặc bỏ qua holder mới. Process từ release cũ và mới sẽ giữ hai namespace độc lập.

“Máy” cũng cần định nghĩa: thư mục dưới home là theo user; `FGOS_STATE_HOME`/private-home có thể khiến hai process trên cùng host nhìn hai gốc. `realpath` giải symlink nhưng không tự giải mọi alias mount, đường Windows và việc canonical cwd đã bị xoá. Handle nên giữ resource key đã chốt, không tính lại theo cwd lúc release.

**Hệ quả:** hai dispatch ghi cùng worktree, resume trùng worker, hoặc repair báo sạch sai. Setup/doctor phát hiện thư mục writable không chứng minh cùng một authority path.

**Sửa tối thiểu:** một resolver resource-key/path cấp thấp, read-only, dùng chung cho writer và inspector; chuyển toàn bộ caller cùng barrier phiên bản ở A2. Nêu rõ “máy/user/namespace” nào được hỗ trợ và cách không bị private-home phân mảnh. Test hai repo cùng cwd, symlink alias, release cũ còn sống, resume/reconcile sau flip, Windows; không thêm đường fallback acquire ở path cũ.

### A14 — medium — Giữ mutex quanh `git worktree add` không bảo đảm vùng găng ngắn

**Bằng chứng:** Thiết kế:118,148; `src/runner/worktree.mjs:724–783`; `claim-port.mjs:354`. Thử Git thật `worktree-add-runs-project-hook`: `hookEntered: true`, `gitWaitedOnHook: true`, `mainMutexHeldThroughHook: true`.

`git worktree add` chạy `post-checkout` của project và chờ nó xong. Một hook chậm/treo kéo theo main mutex; hook gọi ngược một verb cần main mutex có thể tự chờ cha. Checkout lớn, filter/smudge cũng không có ngân sách “vài giây” trong contract. `beforeProvision` nhả trước npm install chỉ giải phần provisioning **sau** worktree add, không giải hook của Git.

Đây tác động mission #1 trực tiếp: project khách có hook riêng, trong khi lý do giữ beacon chủ yếu phục vụ repo fgOS. Test hai lần worktree add đơn giản chạy song song không chứng minh an toàn mọi hook/config/cleanup.

**Hệ quả:** W1 có thể bỏ lỗi đèn 180 s nhưng vẫn giữ main bận không giới hạn trong một `pick`; land/commit bị xếp sau thao tác không ghi main index. R3 báo overdue không giải tiến độ.

**Sửa tối thiểu:** ghi rõ đây là trade-off tạm thời chưa có bound; phân biệt metadata worktree/ref với main index/HEAD. Test project hook thật và callback lồng, giữ mutex chỉ cho tài nguyên cần bảo vệ sau khi có proof phù hợp. Không tự tắt hook khách để đạt số đo đẹp.

## Những điểm đã thử tấn công nhưng đứng vững

1. **Lead bác đúng rename-reclaim cụ thể của kiểm kê.** Ca `rename-stale-reclaimer` tái hiện: R2 giữ phán quyết cũ về D; R1 đã dọn D và H1 acquire; rename của R2 dời H1; H2 chen vào; đọc lại thấy khác nhưng publish trả H1 thất bại vì pathname có H2. Không cần holder D đã chết tự release. Lỗ không chứng minh mọi thuật toán có rename đều sai; chỉ bác thuật toán kiểm kê:216 và lịch chạy Lead:77.
2. **Tách L-lock khỏi session-identity là đúng.** Một mutex không cần biết tên người viết sự kiện. `writer.id` bằng nhau không phải quyền. L-lock và L-id cùng dùng L-os không tạo vòng phụ thuộc. Tuy nhiên cần hoàn tất facts contract và read-only inspector dùng chung, không buộc reconciliation import acquisition/process-control để gom code. `process-identity.mjs:1–18` và import-graph test:199–201 giải thích vì sao ranh giới hiện tại có chủ đích.
3. **Temp+link tạo độc quyền là nền tốt trên giả định filesystem nêu ra.** Nó xuất bản record đầy đủ và chỉ một creator thắng khi pathname trống (`main-checkout-lock.mjs:230–247`). Phản ví dụ A1 nằm ở reclaim, không nằm ở phép link. Giả định phải được hỗ trợ/check ở distribution, không chỉ xuất hiện trong prose.
4. **Không cướp owner chắc chắn sống sau TTL là đúng cho mutex chưa có fencing.** Holder treo gây giảm tiến độ, nhưng chuyển nó thành “chết” để ship nhanh là phá safety. R3 cần quy trình recovery thật, không chỉ xoá file.
5. **Lỗi 180 s có thật; tách beacon khỏi tranh mutex giải đúng sự trộn trách nhiệm.** Source-probe tái hiện record hook 30 s trước, TTL hook 20 s, contender claim TTL 180 s vẫn còn chờ 150000 ms. Không nên giữ lại phép so session id để né lỗi này. Nhưng A11 cho thấy cần định nghĩa hook/grant/beacon đầy đủ.
6. **Claims.lock vẫn ngăn hai acquire cùng item.** `acquireClaim` kiểm existing dưới lock tại `runtime-coordination.mjs:199–207`. A7 không phủ nhận điều đó; nó chỉ ra precondition liên-item về capacity nằm ngoài transaction.
7. **CAS update-ref bảo vệ ref thật trong thử Git.** Commit bị từ chối vì tip đã đổi; không có bằng chứng overwrite ref âm thầm trong ca A5. CAS này không phải mutex cho toàn index/working tree.
8. **D7 sửa nghĩa Node trước rồi port Rust không tự mâu thuẫn với S6.** Tách đổi ngữ nghĩa khỏi đổi ngôn ngữ giúp phân loại lỗi. Điểm chưa đứng vững là lời hứa một authority và hot path không exec, cùng kế hoạch hoàn tất, không phải việc chọn Rust tự thân.
9. **Ledger bất biến hiện có là prior art đáng tái sử dụng.** `publishNextGeneration` xử lý EEXIST bằng đọc lại và không overwrite/unlink generation. Nó tránh lịch dọn pathname của A1. Đây không phải chứng minh toàn bộ ledger vô lỗi: GC, liveness khác host, borrowed child và sink fencing vẫn phải có contract.

## Những phần cần bổ sung vào bộ bằng chứng, không thể thay bằng test vector thuần

Các điểm sau gắn với A1–A14, không cộng thêm finding chỉ để tăng số:

- Các điểm crash sau publish/trước trả handle, sau token check/trước unlink, giữa ref CAS và checkout sync, parent chết trong khi borrower/worker còn sống.
- Lịch xen kẽ có barrier tất định và process thật; stress ngẫu nhiên chỉ bổ sung. Một counterexample hợp lệ đã đủ bác safety, không cần chờ “hai vòng” F1.
- Ma trận migration/rollback qua activated release, hook working-tree, `fgos:dev`, compat Node, Rust init, cùng tài nguyên. Chạy Node/Rust trên hai file riêng chỉ kiểm parity logic, không kiểm mutual exclusion xuyên implementation.
- Thứ tự acquire các lock, nested grant/handle mode, cancellation, timeout với outcome chưa rõ; không xoá `unlock`/`--wait` trước khi các đường overdue có phương án.
- Supported filesystem/platform, hard-link failure, permission denied, foreign/unknown schema, clock jump, pid reuse, host/namespace. Không coi kết quả Linux S6 là bằng chứng Windows.
- Test hook ở clone chưa activation, release thiếu verb, recursion guard; cache identity theo context và quy tắc lineage của claim. Tên native command đi qua registry hiện có, không tạo cửa thực thi thứ hai.
- Doctor/setup/CHANGELOG cùng từng cutover; GC ledger cần high-watermark và không làm thế hệ cũ hợp lệ trở lại.

## Kết luận tổng thể và câu hỏi còn mở

**Chưa duyệt D1–D9 theo gói.** Có thể giữ hướng tách mutex/beacon, quyền theo handle thay vì writer id, tầng process-facts thấp, và port Rust sau proof. Cần sửa A1/A2 trước bất kỳ cutover writer nào; đóng A6/A7 trước khi thu hẹp main mutex; chốt grant/fencing/owner RPC và điều kiện hoàn tất S6 trước khi coi nền chung đã ổn. Một test matrix xanh trên parser không bù được protocol reclaim sai.

Các câu hỏi cần Lead trả lời trong bản sửa, không phải yêu cầu người dùng xác nhận cho phiên chỉ-đọc này:

1. **A1:** điểm tuyến tính hoá nào bảo đảm người dọn bị pause không thể unlink holder mới? Khi sidecar chết, hai người dọn cùng tới được phân xử bằng primitive nào?
2. **A2/A13:** làm sao ngăn writer/reclaimer release cũ và đường compat chạy trong lúc v2/path máy đã active? Rollback cần drain gì, ai chứng nhận đã drain?
3. **A3/A4/A9:** owner chính xác là process nào, trong namespace nào, khi Rust helper thoát/Node chết/Git con còn sống? Unknown liveness có bao giờ cho takeover mutex không?
4. **A4/A12:** grant và claim delegation có scope/lifetime gì, hai sibling có thể dùng cùng quyền không, và nguồn nào cấp quyền mà lineage không bị nâng thành authority?
5. **A5/A6:** phạm vi bảo đảm đối với commit tay, project không có hook, `main-checkout-reset`, checkpoint từ merge-slot và `fgctl init` là gì? Có thay nhánh sync-root sang CAS thật trước khi bỏ mutex không?
6. **A7:** snapshot capacity và acquire claim sẽ cùng transaction ở đâu? Lock ordering của tất cả call site nào được chốt?
7. **A8:** epoch sống ở đâu sau unlink và sink nào thực sự từ chối epoch cũ, đặc biệt với main index/read-tree? GC giữ invariant đó thế nào?
8. **A10:** nếu facade không đạt đủ S6, authority nào còn lại và khi nào Node implementation biến mất? Sẽ xử lý exec release/claims dưới events.lock bằng cơ chế nào?
9. **A11/A14:** hook có grant xử lý beacon ra sao; và “mutex ngắn quanh worktree add” có bound thực sự khi project có hook/filter không?

## Phụ lục bằng chứng chạy được

Lệnh đã chạy, chỉ dùng thư mục tạm:

```sh
python3 /tmp/fgos-lock-redteam-TgXqPp/probe.py
node /tmp/fgos-lock-redteam-TgXqPp/source-probe.mjs
```

`probe.py` là mô hình protocol cộng Git thật; `source-probe.mjs` gọi helper production trên state tạm. Ca capacity mô hình hoá ranh giới sau thay đổi, không monkey-patch `claimWork`. Thử nghiệm không phải full-suite proof và không xác nhận những chi tiết chưa được thiết kế. Để chạy lại sau khi `/tmp` mất, lưu mã dưới đây vào thư mục tạm mới; sửa gốc `/tmp/fgos-lock-redteam-TgXqPp` trong script Node cho khớp. Script Python tự tạo subdirectory riêng. Không chạy vào repo/state thật.

### Kết quả thử mô hình và Git thật

```json
{
  "temporaryRoot": "/tmp/fgos-lock-redteam-TgXqPp/cases-610y1a7b",
  "results": [
    {
      "case": "sidecar-expired-live-reclaimer",
      "twoLiveHolders": true,
      "finalToken": "H1",
      "trace": [
        {
          "actor": "R2",
          "acquired": "H2",
          "R1StillAlive": true
        },
        {
          "actor": "R1",
          "removedToken": "H2",
          "acquired": "H1"
        }
      ]
    },
    {
      "case": "rename-stale-reclaimer",
      "changed": true,
      "restored": false,
      "twoAssumedHolders": [
        "H1",
        "H2"
      ]
    },
    {
      "case": "hook-read-only-vs-land",
      "landUpdateRef": 0,
      "landReadTree": 0,
      "manualCommit": 128,
      "syncError": "",
      "commitError": "fatal: cannot lock ref 'HEAD': is at f8403639a04013e4057d7c7eb28404c58496bbc4 but expected ae544c13cf7b342483be095fb053169e49f47092",
      "landedB": true
    },
    {
      "case": "worktree-add-runs-project-hook",
      "hookEntered": true,
      "gitWaitedOnHook": true,
      "mainMutexHeldThroughHook": true
    }
  ]
}
```

### Kết quả gọi source thật trong thư mục tạm

```json
{
  "root": "/tmp/fgos-lock-redteam-TgXqPp/source-l2WFuG",
  "ttlMismatch": {
    "hookStatus": "acquired",
    "claimStatus": "held",
    "remainingTtlMs": 150000
  },
  "v1AgainstV2": {
    "ownerIsCurrentLiveProcess": true,
    "oldReader": "ambiguous",
    "oldClaimRecovery": "reclaimed",
    "fileExists": false
  },
  "processAdapter": {
    "v2FieldStartTime": "held",
    "existingFieldProcessStartTime": "dead"
  },
  "narrowedClaimModel": {
    "bothPrechecksAllowed": true,
    "ceiling": 1,
    "occupied": 2
  }
}
```

### Mã tái hiện mô hình và Git thật

```python
"""Mô hình thiết kế đề xuất; chỉ ghi vào thư mục tạm của lần chạy.
Không phải implementation holder-lock chưa tồn tại trong repo.
"""
import json, os, pathlib, subprocess, sys, tempfile, time
import multiprocessing as mp
ROOT = pathlib.Path(tempfile.mkdtemp(prefix='cases-', dir=pathlib.Path(__file__).parent))

def publish(path, record):
    tmp = path.with_name(path.name + f'.tmp-{os.getpid()}-{time.time_ns()}')
    tmp.write_text(json.dumps(record))
    try: os.link(tmp, path)
    finally: tmp.unlink()

def dead(pid):
    try: os.kill(pid, 0); return False
    except ProcessLookupError: return True

def first_reclaimer(lock, side, checked, resume, acquired, finish, q):
    observed = lock.read_text()
    publish(side, {'pid': os.getpid(), 'ttlMs': 50, 'ts': time.time()*1000})
    assert lock.read_text() == observed
    assert dead(json.loads(observed)['pid'])
    checked.set()             # pause AFTER final checks, BEFORE unlink
    assert resume.wait(5)
    victim = json.loads(lock.read_text())
    lock.unlink()            # step 4.4.2; stale R1 still believes sidecar is its own
    publish(lock, {'pid': os.getpid(), 'token': 'H1'})
    q.put({'actor': 'R1', 'removedToken': victim['token'], 'acquired': 'H1'})
    acquired.set()
    assert finish.wait(5)

def second_reclaimer(lock, side, acquired, finish, q):
    old = json.loads(side.read_text())
    assert (time.time()*1000-old['ts']) > old['ttlMs']
    assert not dead(old['pid']) # essential: first reclaimer is still alive
    side.unlink()             # step 4.4.4: age alone allows this
    publish(side, {'pid': os.getpid(), 'ttlMs': 50, 'ts': time.time()*1000})
    observed = lock.read_text()
    assert dead(json.loads(observed)['pid'])
    assert lock.read_text() == observed
    lock.unlink()
    publish(lock, {'pid': os.getpid(), 'token': 'H2'})
    side.unlink()
    q.put({'actor': 'R2', 'acquired': 'H2', 'R1StillAlive': True})
    acquired.set()
    assert finish.wait(5)      # H2 has NOT released its critical section

def sidecar_case():
    d=ROOT/'sidecar'; d.mkdir()
    seed=mp.Process(target=lambda: None); seed.start(); seed.join(); assert dead(seed.pid)
    lock=d/'x.lock'; side=d/'x.lock.reclaim'
    publish(lock, {'pid': seed.pid, 'token': 'dead-H0'})
    checked,resume,a1,a2,finish = [mp.Event() for _ in range(5)]
    q=mp.Queue()
    p1=mp.Process(target=first_reclaimer,args=(lock,side,checked,resume,a1,finish,q))
    p2=mp.Process(target=second_reclaimer,args=(lock,side,a2,finish,q))
    p1.start(); assert checked.wait(5)
    time.sleep(.09)            # genuine elapsed wall time, no clock modification
    p2.start(); assert a2.wait(5)
    resume.set(); assert a1.wait(5)
    result={'case':'sidecar-expired-live-reclaimer','twoLiveHolders':p1.is_alive() and p2.is_alive(),
            'finalToken':json.loads(lock.read_text())['token'], 'trace':[q.get(timeout=2),q.get(timeout=2)]}
    assert result['twoLiveHolders']
    finish.set(); p1.join(); p2.join()
    assert p1.exitcode == p2.exitcode == 0
    return result

def rename_case():
    d=ROOT/'rename'; d.mkdir(); lock=d/'x.lock'
    publish(lock, {'token':'dead-H0'})
    stale_observation=lock.read_text()       # R2 judges H0 dead, then pauses
    lock.rename(d/'r1-quarantine')          # R1 reclaims H0
    publish(lock, {'token':'live-H1'})       # H1 is executing
    lock.rename(d/'r2-quarantine')          # R2 moves H1, not H0
    publish(lock, {'token':'live-H2'})       # H2 enters the empty path
    changed=(d/'r2-quarantine').read_text()!=stale_observation
    try: os.link(d/'r2-quarantine',lock); restored=True
    except FileExistsError: restored=False
    assert changed and not restored
    return {'case':'rename-stale-reclaimer','changed':changed,'restored':restored,'twoAssumedHolders':['H1','H2']}

def git_case():
    d=ROOT/'git'; d.mkdir()
    def git(*args, ok=True):
        r=subprocess.run(['git',*args],cwd=d,text=True,capture_output=True)
        if ok: assert r.returncode==0, (args,r.stderr)
        return r
    git('init','-q','-b','main'); git('config','user.name','probe'); git('config','user.email','probe@example.invalid')
    (d/'f').write_text('A\n'); git('add','f'); git('commit','-qm','A'); A=git('rev-parse','HEAD').stdout.strip()
    (d/'f').write_text('B\n'); git('add','f'); git('commit','-qm','B'); B=git('rev-parse','HEAD').stdout.strip()
    git('reset','--hard',A)
    (d/'manual').write_text('manual\n'); git('add','manual')
    hook=d/'.git/hooks/pre-commit'
    hook.write_text('''#!/usr/bin/env python3
import pathlib,time
p=pathlib.Path.cwd()
assert not (p/'main-mutex').exists()
(p/'hook-passed').touch()
while not (p/'resume-hook').exists(): time.sleep(.005)
'''); hook.chmod(0o700)
    child=subprocess.Popen(['git','commit','-m','manual'],cwd=d,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    deadline=time.monotonic()+5
    while not (d/'hook-passed').exists():
        assert time.monotonic()<deadline
        time.sleep(.005)
    publish(d/'main-mutex',{'token':'land'})
    land=git('update-ref','refs/heads/main',B,A,ok=False)
    sync=git('read-tree','-m','-u','HEAD',ok=False)
    (d/'resume-hook').touch()
    stdout,stderr=child.communicate(timeout=5)
    assert land.returncode==0 and child.returncode!=0
    return {'case':'hook-read-only-vs-land','landUpdateRef':land.returncode,'landReadTree':sync.returncode,
            'manualCommit':child.returncode,'syncError':sync.stderr.strip(),'commitError':stderr.strip(),
            'landedB':git('rev-parse','HEAD').stdout.strip()==B}

def worktree_hook_case():
    d=ROOT/'worktree'; d.mkdir()
    def git(*args):
        return subprocess.run(['git',*args],cwd=d,text=True,capture_output=True,check=True)
    git('init','-q','-b','main'); git('config','user.name','probe'); git('config','user.email','probe@example.invalid')
    (d/'f').write_text('base'); git('add','f'); git('commit','-qm','base')
    hook=d/'.git/hooks/post-checkout'
    # Absolutes below point exclusively to this disposable test root.
    hook.write_text('#!/usr/bin/env python3\nimport pathlib,time\np=pathlib.Path('+repr(str(d))+')\n(p/"post-checkout-entered").touch()\nwhile not (p/"finish-post-checkout").exists(): time.sleep(.005)\n')
    hook.chmod(0o700)
    publish(d/'main-mutex', {'token':'claim'})
    child=subprocess.Popen(['git','worktree','add','--detach',str(ROOT/'linked'),'HEAD'],cwd=d,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    deadline=time.monotonic()+5
    while not (d/'post-checkout-entered').exists():
        assert time.monotonic()<deadline
        time.sleep(.005)
    waiting=child.poll() is None
    (d/'finish-post-checkout').touch(); child.communicate(timeout=5)
    assert waiting and child.returncode==0
    return {'case':'worktree-add-runs-project-hook','hookEntered':True,'gitWaitedOnHook':waiting,'mainMutexHeldThroughHook':(d/'main-mutex').exists()}

if __name__=='__main__':
    results=[sidecar_case(),rename_case(),git_case(),worktree_hook_case()]
    out={'temporaryRoot':str(ROOT),'results':results}
    (pathlib.Path(__file__).parent/'probe-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
    print(json.dumps(out,ensure_ascii=False,indent=2))
```

### Mã gọi source thật với state tạm

```javascript
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { acquireMainCheckoutLock, forceReclaimAmbiguousLock } from '/home/vantt/projects/forgentX/src/runner/main-checkout-lock.mjs';
import { getBootId, getProcessStartTime, resolveHolderLiveness } from '/home/vantt/projects/forgentX/src/runner/dispatch/process-identity.mjs';
import { acquireClaim, readClaims, buildEffectiveView } from '/home/vantt/projects/forgentX/src/state/runtime-coordination.mjs';
import { hasWorkerSlotRoom, countWorkerSlots } from '/home/vantt/projects/forgentX/src/state/worker-slots.mjs';
const root=fs.mkdtempSync('/tmp/fgos-lock-redteam-TgXqPp/source-');
const dir=path.join(root,'.fgos'); fs.mkdirSync(dir);
const now=Date.now();
const hook=acquireMainCheckoutLock(dir,{identity:'probe-session',ttlMs:20000,now:now-30000});
const claim=acquireMainCheckoutLock(dir,{identity:process.pid,ttlMs:180000,now});
assert.equal(hook.status,'acquired'); assert.equal(claim.status,'held'); assert.equal(claim.remainingTtlMs,150000);
const output={root,ttlMismatch:{hookStatus:hook.status,claimStatus:claim.status,remainingTtlMs:claim.remainingTtlMs}};
// Replace only the disposable test record, as if a v2 holder had acquired it.
const record={v:2,kind:'mutex',name:'main-checkout',owner:{pid:process.pid,startTime:getProcessStartTime(process.pid),bootId:getBootId(),host:os.hostname()},writer:{id:'v2-live',source:'env'},token:'128-bit-probe-token',epoch:7,acquiredAt:now,renewedAt:now,ttlMs:180000,purpose:'probe'};
fs.writeFileSync(path.join(dir,'main-checkout.lock'),JSON.stringify(record));
const oldReader=acquireMainCheckoutLock(dir,{identity:process.pid+1,ttlMs:180000});
const force=forceReclaimAmbiguousLock(dir);
assert.equal(oldReader.status,'ambiguous'); assert.equal(force.status,'reclaimed');
output.v1AgainstV2={ownerIsCurrentLiveProcess:true,oldReader:oldReader.status,oldClaimRecovery:force.status,fileExists:fs.existsSync(path.join(dir,'main-checkout.lock'))};
output.processAdapter={v2FieldStartTime:resolveHolderLiveness({...record.owner,startTime:'definitely-not-current'},true),existingFieldProcessStartTime:resolveHolderLiveness({...record.owner,processStartTime:'definitely-not-current'},true)};
assert.equal(output.processAdapter.v2FieldStartTime,'held'); assert.equal(output.processAdapter.existingFieldProcessStartTime,'dead');
// Model precisely the proposed shortened transaction: both calls check capacity,
// then existing acquireClaim serializes each record but does NOT recheck capacity.
const durable={work:{a:{id:'a',status:'todo'},b:{id:'b',status:'todo'}}};
const view=buildEffectiveView(durable,{});
const checks=['a','b'].map(id=>hasWorkerSlotRoom(view,{ceiling:1,excludeId:id}));
for(const id of ['a','b']) acquireClaim(dir,{id,actor:'session',source:'main',preClaimStatus:'todo'});
const occupied=countWorkerSlots(buildEffectiveView(durable,readClaims(dir))).execution.occupied;
assert(checks.every(x=>x.allowed)); assert.equal(occupied,2);
output.narrowedClaimModel={bothPrechecksAllowed:true,ceiling:1,occupied};
fs.writeFileSync('/tmp/fgos-lock-redteam-TgXqPp/source-results.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
```

### Dấu băm SHA-256 các đầu vào chính lúc kết thúc kiểm tra

```json
{
  "plans/reports/design-261015-1755-lock-and-identity-foundation-lead-design.md": "db5e3ce79299139552dbe32999aa60f088ee0304e3b0ad5b8866d0b06b9c2ad8",
  "plans/reports/research-261015-1731-lock-inventory-and-standardization.md": "7ccb71a12bdc180c5af21820c16c0756b2ccec72ebefdd3cf60d24b5b7b63d2a",
  "plans/reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md": "c67e1c462d209a1fcb3bf8ff0d5bdc018ee34f0c49cfb36c8d5f47faf2f76a2e",
  "plans/reports/proposal-261015-1715-rust-first-component-hook-identity-lock.md": "18b3f547e3a63f54189805dea2b48d09e4f5231fd739dcdf558fb03780bd6321",
  "plans/reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md": "5a11fb16ed1d1bcb45f81781a51b953fead4014b92396676688344475a2623d2",
  "src/runner/main-checkout-lock.mjs": "3060675690fa7f70212c5754e25f3f8c4579f0484aec99089fa688d69bb388d2",
  "src/runner/claim-port.mjs": "35ad710609ab865512498b5f7dc29811267aeb9a5ff016aa2eeb5dbdb8fa4dbb",
  "src/runner/merge.mjs": "1174ec5027184118c2254398fb90b68054e77ac0c551af720411cc1b09fbdda9",
  ".githooks/pre-commit": "62a1eaf49fdf9b7e1f7beceb9c51355690d0c5ec16d036e90b98bfc716988524",
  "src/util/session-identity.mjs": "c54e73a1b98aaa353d09d8fba9923f818cc8895c46b7dcac3d4b753424472330",
  "src/runner/dispatch/process-identity.mjs": "b225265e60c972b9134a74ff68e5e996c317944bfb9fb80b9405aad38851695d",
  "src/state/events.mjs": "523af5d56c895370027568a8714c93a772e708e1f9651f158deaf3b906508098",
  "src/state/runtime-coordination.mjs": "3aea2a473c4ca87518a7d6da22d18ccc6c6d5fc9380a3719f2b9ed1ff646e18b",
  "src/state/store.mjs": "f6c6b285282fec3f78c88daf6b96d70680d87b37e757ea2e5224ea561d08bb90",
  "src/verbs/merge/sync-root.mjs": "ca679e437f760b67194c4b17f280ceb2e82188d152ab94c159e0f904532953bd",
  "packages/distribution/rust/src/lock.rs": "81c934e4e78e068511eb9673d2d5af7d16ee4d59116b70018a9f312fc2b8e413",
  "packages/observe/rust/src/store_lock.rs": "8508e2cde14603febb4c0a0bd57566b0e429d2acd67d47535650fb418fd98b85"
}
```
