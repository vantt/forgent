# Second Opinion: Runtime Recovery

**Verdict: Chưa ổn để implement theo contract v1; ranh giới tổng thể đúng, nhưng admission/fencing và continuation apply còn thiếu semantics atomic, trong khi một số proof yêu cầu hành vi trái chính contract.**

Ngày: 2026-09-11. Review độc lập theo `review-prompt-260911-1654-runtime-recovery-design-second-opinion.md`. Branch `main`, HEAD `797667387583e9f2d85141a7c35b33323b4a0713`, đúng commit được yêu cầu. Report là log review, không phải sửa hay chấp thuận các proposal.

## Phạm Vi Và Bằng Chứng

Đã đọc ba proposal, README principles, amend Run và các contract liên quan; đối chiếu trực tiếp ladder, recovery matrix, assignment runner, session store/replay/engine, dispatch lock, herdr binding và lock primitives. Đã đọc lịch sử quyết định §6–§8; kiểm năm backlog item bằng `node bin/fgos.mjs show <id>`: cả năm còn `todo`. Có đối chiếu dogfood P08/P12 và advisory P02.1.

Đây là review thiết kế và kiểm code tĩnh, không phải chứng nhận triển khai. Chỉ chạy probe thuần, không spawn worker hay tạo session: `evaluateLadder`, `resolveAction`, `paneFateFor`. Không chạy toàn bộ `npm test`, vì không sửa code và contract mới chưa được implement. GitNexus MCP không có trong tool catalog của phiên này; đối chiếu bằng source trực tiếp, không tuyên bố đã chạy graph analysis.

Các tên ngắn dưới đây luôn chỉ đúng file sau; số sau dấu `:` là dòng tại HEAD được review:

| Tên | File |
|---|---|
| RH | `docs/architect/agent-coordination/architecture/run-handle.md` |
| CP | `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md` |
| EF | `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md` |
| Run | `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` |
| Session | `docs/architect/agent-coordination/contracts/coordination-session.md` |
| Flow | `docs/architect/agent-coordination/contracts/flow-definition.md` |
| Visibility | `docs/architect/agent-coordination/architecture/visibility-and-herdr.md` |

`blocking` nghĩa là cần chốt trước khi coi contract đủ cho implementer độc lập, không có nghĩa phải bỏ hướng kiến trúc.

## Findings

| id | doc | file:dòng | mức | bằng chứng | đề xuất sửa |
|---|---|---|---|---|---|
| R01 | Run / CP | Run:94; Run:103; CP:197 | blocking | `run-retried` hiện chỉ mở quyền thay link theo thứ tự event, chưa fence đúng Run. `store.mjs:1977` chỉ tìm một retry sau link gần nhất; không kiểm Run đích của retry. Khi chưa có link, `store.mjs:1996` nhận link đầu mà không kiểm supersession. `replay.mjs:592` đếm retry, `:606` kiểm số đếm, không loại runId cũ. Một late Run cũ có thể chiếm link đầu sau retry; với lịch sử nhiều retry, một Run cũ khác có thể chiếm quyền supersede. | Giữ Run và `run-retried` làm authority đã chốt, nhưng khai rõ current admitted Run/attempt và kiểm eligibility của runId dưới cùng cửa ghi/link, cả writer lẫn replay. Sửa trạng thái implementation: retry declaration đã có, strict result fencing còn phải amend Node. Giữ quyền retry hợp lệ thay view cũ theo Session:194. |
| R02 | Run / RH | Run:68; Run:76; RH:216; RH:237 | blocking | Per-Run lock chỉ serialize cùng runId. Hai caller có thể cùng thấy Assignment trống rồi admit hai attempt khác nhau. Code hiện dùng scan/max + `existsSync`/`mkdirSync(recursive)` (`assignment-runner.mjs:810`), chưa có atomic admission. Crash sau spawn trước bound cần lookup theo runId, nhưng `RuntimeControlPort` chỉ inspect locator đã biết, không có contract reconcile launch khi locator chưa lưu. | Chốt atomic compare/admit trên Assignment trong Run repository hiện có, winner/loser và resume cùng admission. Chốt runtime adapter tạo resource có launch identity và tìm lại bằng identity khi crash. Không cần thành phần admission thứ tư. Proof phải đếm runtime được spawn qua cả cửa sổ admitted/launched/bound. |
| R03 | RH | RH:175; RH:216; RH:241; Run:90 | blocking | Lock có holder/expiry nhưng không có acquisition token, verify/renew hay quy tắc reclaim khi holder sống. `main-checkout-lock.mjs:277` cho reclaim khi TTL hết dù PID còn sống. A kiểm lock, bị pause; B reclaim; A tiếp tục gửi input sau khi tỉnh. CAS handle không chặn input đã gửi. Lock theo handleId cũng cần resolve về Run khi có replacement. | Giữ local exclusive-create, bổ sung lock instance/token, identity của process thật sự điều khiển, release chỉ đúng instance, và quy tắc ngăn stale in-flight control. Default đơn giản có thể không steal lock của process còn sống trong control critical section; expiry chỉ kích hoạt kiểm/recovery. Nếu cho steal thì phải có nơi enforce fencing lúc control thực sự được thực hiện. |
| R04 | CP | CP:88; CP:169; CP:207 | blocking | `BindingStateV1`, `RunSummaryV1`, `RunHandleSummaryV1` chưa định nghĩa. Snapshot chỉ có `flowRef`, thiếu graph/completion facts, actor roster, authorization identity, disposition/aggregation/visibility state, lineage và budget grant để tính các output đã hứa. `accepted` ở CP:110 gộp normalized và linked, bỏ cửa sổ normalized nhưng chưa linked. Pure planner không thể tự load phần thiếu. | Định nghĩa các projection tối thiểu; dùng read evaluator hiện có để đưa legal/missing bindings, close eligibility và reason vào snapshot, tránh planner tự viết graph engine. Tách normalization khỏi link state. Hỗ trợ definitionRef null hoặc refuse agent-led rõ ràng. Định nghĩa action priority khi cùng có result, budget hết và run sống. |
| R05 | CP | CP:125; CP:169; CP:188 | blocking | Hash deterministic không tự tạo transaction. Chưa có nơi lưu apply claim/result, thứ tự dedup so với revision check, canonical serialization hoặc xử lý crash sau open child trước ghi applied. Payload chứa `observedAt`, thứ tự refs/operations có thể khác giữa hai builder. Cùng child ID nhưng khác budget/context không có conflict rule. | Qua store/command handler hiện có: claim theo semantic action identity, kiểm payload fingerprint, revalidate và mutate atomic hoặc có durable pending/completed recovery. Dedup thành công phải trả lại outcome dù revision đã đổi bởi chính lần apply trước. Canonicalize phần semantic; không hash timestamp quan sát. |
| R06 | CP | CP:174; CP:176; CP:182 | blocking | `authority: 'open-request-author'` chỉ là nhãn, không có ref đến grant, số lượng cấp hay remaining từ snapshot. `chainBudgetRemaining` optional nhưng prose bắt buộc giảm; chưa nêu đơn vị và atomic debit. Child ledger không kế thừa graph/quorum, nhưng chỉ liệt kê remainingOperations không làm các node revise/recheck hợp lệ tại entry của flow gốc. Run ở cha không thuộc Assignment ở con nên admission per-Assignment không ngăn redispatch xuyên session. | Chốt grant/lineage tối thiểu và cách debit đúng một lần khi open child. Missing grant thì park. Chốt cách dựng request hợp lệ ở entry hoặc refuse khi remaining graph không materialize được; không cấp quorum/authorization ngầm. Revalidate parent in-flight bằng binding identity, không chỉ mảng runId tại thời điểm plan. |
| R07 | EF | EF:38; EF:123; EF:184; EF:203 | blocking | E-b đòi attempt 1 retry-same rồi attempt 2 fallback khi delivery unknown; §6 lại bắt reconcile rồi park nếu chưa rõ; default §7 chỉ một attempt mỗi executor. Ngoài ra `resolveAction('worker-timeout', 2)` đã park, nên luồng E-b không tới fallback nếu giữ nguyên matrix. | Một bảng default duy nhất: unknown delivery luôn reconcile; chỉ retry sau khi eligibility được chứng minh. Chọn rõ có cho một retry cùng executor không và tính nó vào cùng budget. Sửa proof E-b theo quyết định đó; không giữ cả ba rule mâu thuẫn. |
| R08 | EF | EF:83; EF:197 | blocking | Gán zero-output timeout thành `timed-out-idle` không đúng mọi bug gốc. Dogfood `verification/rust-host-r1-kernel/p08.md:20` ghi rõ `timed-out-ceiling`, gồm trường hợp có ~800 dòng thay đổi. Ladder `liveness.mjs:179` trả ceiling trước idle/quota. Default chỉ xử lý died/idle, nên không giải quyết lớp 35 phút mà E-a dùng làm lý do. `worker-spawn-fail` cũng retry được trong matrix nhưng bị bỏ khỏi điều kiện §7. | Giữ nguyên ladder; mô tả zero output là fact trực giao với outcome. Bổ sung quyết định explicit cho ceiling và launch-failed: reconcile/effect check rồi bounded retry hay park có remedy. Không mặc định ceiling là dead hoặc tự động fallback chỉ vì không stdout. |
| R09 | EF | EF:124; EF:149; EF:167; EF:197 | blocking | `verify(operationId, runId)` chưa chứng minh cùng effect identity, input và dedup scope vẫn được giữ trên candidate khác; optional dedupKey và hai boolean không phân biệt unsupported/unknown/verified. `idempotent` lại bị yêu cầu hỗ trợ dedup như `dedup-keyed`. Matrix hiện đếm per-error/per-claim (`recovery.mjs:122`), khác per-Assignment; Session còn có retry cap riêng (`store.mjs:2043`). Chưa có mapping ladder -> errorClass; truyền `died` trực tiếp sẽ halt. | Khai typed effect verdict theo từng mode, ref tới effect/request identity và scope/window, truyền guarantee cần giữ vào attempt tiếp theo. Unsupported/unknown thì park. Một nguồn lịch sử attempt per Assignment cho dispatch recovery; các cap là predicate trên nguồn đó, nêu rõ cap nào giữ scope claim/session. Không reset do đổi executor/error class. Mapping/error precedence phải explicit. |
| R10 | CP | CP:41; CP:42; CP:135 | blocking | Proof C-b từ chối implementation-cell có fixer+partial, nhưng tsk-5qj yêu cầu giữ partial escape hatch và không auto-close trước fix round; tsk-296 chỉ giữ refusal đó nếu auto-close không được sửa. C-c đã có authorization chưa consumed; remedy code là dispatch với taskKey khác, không authorize thêm. Output dispatch hiện thiếu taskKey/authorizationId, còn authorize-next-operation không có invocationKey. | C-b chứng minh valid request chạy first pass rồi vẫn authorize/execute fix được. C-c reuse đúng authorization hiện có với taskKey gắn authorization/artifact revision; typed action mang identity đủ cho builder. Chỉ đề xuất authorize mới khi thực sự thiếu authority. |
| R11 | RH | RH:123; RH:223; RH:250 | warning | Inspect trả agent status nhưng không có liveness `present` độc lập. Tình huống process present, agent status unknown không biểu diễn được đầy đủ cho ladder. Transition unknown -> running khi inspect thành công có thể làm mất paused provider-limit. Launching -> unknown và unknown -> paused chưa có; any -> terminated khi died lại mâu thuẫn câu cấm paused -> terminated không explicit intent. | Giữ ba trục, không thêm state machine lớn. Tách liveness reading khỏi agent progress; ghi transition table đầy đủ, absence không tự xóa pause và died được xử lý rõ. Thread `absentStreak`, `lastProgressAt`, `blindMs` ở caller-owned classifier state, chỉ rõ reset sau restart. |
| R12 | RH / EF | RH:220; RH:231; RH:242; EF:201 | warning | Chỉ sendInput có signal/key; rename/terminate/snapshot thiếu cancellation/idempotency semantics và capability type chưa định nghĩa. Terminate chưa nói stopped phủ process nào: Visibility:64 đã có bằng chứng setsid descendant sống sau đóng pane. Ladder trả `screenLine`, không trả `retryAfter` như EF §7 nói. `run-handle-missing` dùng ở RH:270 nhưng không nằm trong error union. | Chốt typed operation results, cancellation-before/after-send, unsupported capabilities và dedup scope. `stopped` phải nói rõ worker/resource/process-tree coverage; không suy từ pane đóng. Lưu nguyên quota line, parse retryAfter ở adapter nếu biết, nếu không để absent và có recheck policy rõ. |
| R13 | RH | RH:276; RH:281 | warning | Một `run-handle.json` chứa một handle không đồng thời giữ handle cũ detached và replacement có id mới để get/list theo id. Accepted Visibility:35 đang dùng `visibility.json`; proposal chưa nói thay thế hay derive. Hai writer có thể ghi hai binding nguồn sự thật khác nhau. | Chốt envelope nhỏ current+previous hoặc current-only cùng quy tắc retired-id; không cần index service. Chỉ định RunHandle thay canonical visibility binding hoặc projection một chiều, có migration/read compatibility rõ. |
| R14 | CP / EF | CP:79; CP:72; EF:147 | warning | Planner thuần nhưng được chỉ dẫn import store; kiểm context ownership đặt duy nhất ở request builder adapter. Boolean `ownershipVerified` không thay validation tại mutation door. EF `nextAction: string` dễ tái tạo machine action bằng prose trong khi CP đã dùng typed union. | Application service đọc store qua ports; pure planner nhận values/read-derived facts. Builder giúp dựng request, engine vẫn enforce ownership/visibility. Dùng typed remedy/reason cho machine action, text chỉ để hiển thị. |
| R15 | Cả ba | RH:288; CP:213; EF:206; Run:103 | warning | Default slices chưa nêu amend Node admission/strict fencing là prerequisite. CP default read-only nhưng liệt kê apply/concurrent/budget-chain proof như DoD cùng slice. Người triển khai có thể ship từng helper mà guarantee liên thành phần vẫn chưa tồn tại. | Ghi dependency và acceptance scope mỗi slice: Node Run admission/control/result guarantees trước recovery mutation; planner read-only có DoD riêng; apply proof thuộc slice có mutation. Không cần thêm framework hay crate. |

## A. Contract Đầy Đủ?

**RunHandle: chưa đủ** (R02, R03, R11–R13). Ba trục execution/attachment/observation là hướng đúng; không cần thêm status tổng hợp. Cần phân biệt observer mất liên lạc với worker unknown, giữ pause qua thời gian blind, định nghĩa `terminated` là runtime kết thúc chứ không phải task success. Settled Run còn pane mở là tổ hợp hợp lệ và phải được thể hiện mà không suy pane idle thành done.

Lock holder phải là process thực sự gửi control, không mặc định Rust host là cha còn sống. `legacy-cli-transition.md:13`/`:21` mô tả lane exec và signal forwarding; holder contract không được phụ thuộc một mô hình parent-child ngầm. Với exec thay process image, PID có thể giữ nguyên; với spawn/forward, PID khác. Adapter phải resolve local process identity thực tế; lock acquisition identity cần khác resource incarnation. `pid + startTime` của worker không tự giải quyết stale controller lock. Đây là hoàn thiện guarantee đã chốt, không yêu cầu distributed lease.

**Continuation: chưa đủ** (R04–R06, R10). Field có tên nhưng không có semantic definition là lỗ hổng, không chỉ thiếu TypeScript. Ví dụ hai session cùng bindings/runs nhưng một có disposition accept và một chưa có có thể cần action khác nhau; schema hiện không quy định fact phân biệt. Chọn projection của evaluator hiện có là cách nhỏ nhất để không viết lại quorum/graph. `flowRef` bắt buộc cũng chưa phủ session agent-led hợp lệ (`docs/specs/runner.md:1182`).

`idempotencyKey` và deterministic child ID chỉ là identity, chưa đủ hội tụ. Cần atomic claim của command hiện có, payload equality và crash recovery. Tối thiểu phải định nghĩa thứ tự: return prior applied outcome nếu cùng semantic claim; nếu chưa applied thì revalidate fresh facts và thực hiện mutation dưới serialization phù hợp. Session revision không bao trùm outbox/RunHandle writes; đọc lại result và Run trước admission là bắt buộc, không chỉ so revision.

**Fallback: chưa đủ** (R07–R09, R12). Candidate resolver nên nhận eligibility verdict đã được operation boundary chứng minh. `effectsObserved: false` không có nghĩa effect không xảy ra; read-only/idempotent/dedup-keyed cần rules riêng. Khi đổi executor/provider, guarantee chỉ còn nếu effect boundary và key vẫn giống nhau. Không cần effect ledger mặc định, nhưng không thể tự động retry mutation sau delivery bằng label chung.

Budget cần chốt công thức: số lần admit Run trên Assignment là nguồn đếm durable; perExecutor là lọc theo executor trong cùng lịch sử, perAssignment là tổng. Existing `resolveAction` dùng per-class/per-claim và coi maxRetries=2 là tổng hai failure attempts trong resolver, trong khi `recordRunRetry` đếm số retry declarations sau initial run. Hai khái niệm không thể truyền cùng số mà không định nghĩa phép chuyển. Session cap vẫn là bound riêng hợp lệ, không nên xóa để ép thành một counter toàn hệ thống.

## B. Run Amend Và Accepted Contracts

Assignment immutable, retry tạo Run mới, giữ evidence cũ và Work boundary đều phù hợp `runtime-model.md:25` và Run:40. Rule một Run đủ điều kiện hiện hành trên một Assignment không cấm retry tuần tự đang chạy. Cần sửa cách diễn đạt “một un-settled” thành “một un-settled, non-superseded current Run”: một worker superseded có thể vẫn sống, và result fencing không phải effect protection.

Hai điểm cần chốt thực chất:

1. **Supersession:** Session:194 cho phép latest valid retry result thay authoritative view trước. CP:197 không được hiểu thành accepted result không bao giờ thay; chỉ *late superseded result* bị cấm. R01 là bằng chứng code mới cho thấy event-order gate chưa đủ strict fencing, không phải đề nghị bỏ quyết định dùng `run-retried`.
2. **Universal bound-before-delivery:** Run:70 yêu cầu RunHandle cho mọi delivery, trong khi RH default chỉ herdr và process adapter là R4. Phải nói scope rollout: các lane chưa hỗ trợ handle vẫn ở legacy contract được nhận diện, hoặc cần minimal binding cho chúng trước khi claim universal guarantee. Không ngầm làm cli-spawn/in-process bị refuse toàn bộ.

Code hiện ghi `run.json` trước adapter (`assignment-runner.mjs:891`), nhưng write thường chưa chứng minh crash durability/atomic admission. Implementation note nên phân biệt “pre-spawn metadata có rồi” với “durable admitted phase và single-admission chưa có”. `attempt` hiện cũng đã scan lịch sử thư mục (`:810`), không reset đơn giản mỗi invocation; phải giữ hành vi đó khi thêm admission gate.

`taskKey`/`invocationKey` thuộc logical invocation/Assignment, không thay Run identity. Recheck dùng Assignment mới gắn revision/authorization (Session:287), retry giữ Assignment. C-c phải giữ phân biệt này. Recovery Rule Session:947 yêu cầu serialized check-and-write, là mẫu đúng cho CP apply.

## C. Hexagonal Và SRP

**Đạt ở cách phân chia lớn:** runtime handle, session planning, executor selection có lý do thay đổi khác nhau; không nên gộp cả ba. Guard có thể orchestration repository + adapter + authority mà vẫn SRP. Repository giữ local lock không bắt buộc tách thêm service. RuntimeControl có nhiều operation nhưng cùng một runtime adapter cũng không tự động là port béo.

**Chưa sạch ở dependency/authority:** CP import store và đặt kiểm grant vào adapter (R14); fallback đang vừa có budget matrix mới vừa gọi matrix cũ mà không định nghĩa quan hệ (R09). Rút các sự nhập nhằng này quan trọng hơn tăng số interface.

`cwd`, `runDir`, diagnostic paths trong RH là hợp lệ vì nó là runtime/infra contract, không phải core graph entity. `agentSessionId` nằm trong adapter locator cũng đúng hexagon. Chỉ không để planner/domain branch theo herdr string hoặc CLI command. `nextAction: string` nên là display-only hoặc typed remedy. README:33 gọi guard là port, RH:70 gọi application service, RH:63 nói ba port + service trong khi bảng chỉ có hai port + guard; sửa terminology để không vô tình tạo abstraction thứ tư.

## D. Semantics Phải Port

| Semantic | Code hiện hành | Đánh giá proposal |
|---|---|---|
| Result > blocked > died > ceiling > stale | `liveness.mjs:162` | EF:71 giữ thứ tự đúng. “Ceiling bất kể bận” không vượt blocked/truth. |
| Present/absent/unknown riêng; unknown reset absence | `liveness.mjs:53`, `:157` | Prose giữ đúng; RH inspect contract thiếu liveness riêng (R11). |
| Working là progress dù stdout im; trừ blind time chỉ cho idle | `liveness.mjs:183` | EF nói blind nhưng chưa nêu explicit working veto và ceiling không trừ blind. Cần parity fixtures, không suy stdout im thành idle. |
| Screen được yêu cầu qua needsScreen; threshold mặc định 3 | `liveness.mjs:56`, `:198` | Citation có, snapshot/caller-state ownership chưa chốt. Không tăng absentStreak hai lần cho cùng observation khi đọc thêm screen. |
| Usage limit trả nguyên dòng, không parse reset time | `liveness.mjs:102`, `:202` | EF:201 nói retryAfter “từ ladder” là sai output hiện tại. Pattern mặc định còn ghi NOT MEASURED (`:60`), không phải provider parser đã được chứng minh. |
| Pane failure giữ lại; paused-limit thắng automated closeAlways | `liveness.mjs:81`, `:92` | RH giữ paused đúng; phải phân biệt operator force có chủ đích với cleanup sweep. Timeout/died không tự đồng nghĩa close. |
| Ceiling không phải idle | `liveness.mjs:179`; dogfood `p08.md:20` | EF mapping và default bỏ sót (R08). Probe thuần xác nhận cùng screen quota vẫn ra ceiling khi chạm bound. |
| Matrix có retry/park/halt; unknown error halt | `recovery.mjs:105`, `:133` | EF chưa có mapping/propagation cho halt, config/confinement/launch-failed không có ladder nhưng decision bắt buộc ladder. Không ép fake ladder để tạo decision. |
| Stale Work cần commit + verification, không retry mù | `recovery.mjs:166` | Giữ ở Work runner; ba doc không được port nó thành permission cho executor fallback. Không cần đưa Work transitions vào CP. |

Probe thực chạy: `resolveAction('worker-timeout',1) -> retry`, attempt 2 -> park; `resolveAction('died',1) -> halt/unknown-error-class`; `paneFateFor('paused-limit',{closeAlways:true}) -> keep`. `evaluateLadder` ở 2,100,000ms với ceiling bằng 2,100,000 trả timed-out-ceiling; bỏ ceiling mới trả paused-limit với screenLine, không có retryAfter. Probe không ghi file và không dùng provider live.

## E. Bug Sang Proof: Kiểm Đủ 20 Hàng

Mỗi hàng có một ô proof về hình thức. Chưa phải cả 20 là proof đủ, nhất quán hoặc đã có executable test. Bảng sau đánh giá specification của proof, không ghi PASS cho test chưa tồn tại.

| Bug / dòng | Đánh giá | Một scenario proof nên chốt |
|---|---|---|
| F-a RH:49 | Đúng phần active guard, chưa thử nhầm pane/incarnation. | Exact stale handle trỏ paneId tái dùng bị refuse và pane mới không bị control. |
| F-b RH:50 | Đúng hướng, `attach` chưa có trong CP union. | Kill coordinator sau bound; caller mới tìm đúng Run, trả wait/reattach, spawn count không tăng. |
| F-c RH:51 | Đúng hướng; “present” chưa biểu diễn ở inspect output. | Caller timeout khi liveness present/working: chỉ freshness đổi, Run không thành failure và không spawn thêm. |
| F-d RH:52 | Đủ mục tiêu nếu force operator được tách. | Paused limit qua auto cleanup và retryAfter: pane giữ, không Run mới, chỉ inspect lại. |
| F-e RH:53 | Không đủ; ghi snapshot không chứng minh phân biệt progress và launch hang. | Zero stdout nhưng adapter working/dirty delta: không idle-fail; delivery unknown không thành launch-failed. |
| F-f RH:54 | Sai phạm vi: bind lock không chứng minh không duplicate spawn trước bind. | Hai coordinator concurrent từ admission tới delivery, kể cả crash trước bound: đúng một runtime launch và một current Run. |
| F-g RH:55 | Đủ cho lock có binding; không phủ pre-bind/corrupt lock. | In-flight refusal có Run/handle thật nếu tồn tại, otherwise reason pre-bind/ambiguous rõ, không bịa id. |
| C-a CP:40 | Đủ khi request mang đủ intended steps/actors. | Full roster nhưng review-only steps thiếu allowedOmissions bị refuse trước open; roster review-only hợp lệ không bị blanket refuse. |
| C-b CP:41 | Sai proof, trái bug intent. | Valid partial escape hatch + first pass không terminal sớm; fixer còn authorizable, sau đó close theo đúng disposition/quorum. |
| C-c CP:42 | Remedy hiện tại phát sinh authorization mới dư thừa. | Existing unconsumed authorization được consume bằng distinct taskKey gắn identity, không authorize thêm hoặc replay kết quả binding cũ. |
| C-d CP:43 | Ownership chỉ là nửa đầu; hash không cấp visibility. | Ref thuộc session nhưng chưa reveal/grant vẫn bị engine refuse; foreign ref cũng refuse qua cùng cửa. |
| C-e CP:44 | Đủ mục tiêu thời gian. | Clock vượt createdAt + wallTimeMs: planner và apply đều không dispatch trong parent dù round mới bắt đầu. |
| C-f CP:45 | Đủ raw-unlinked; thiếu normalized-unlinked và malformed. | Crash sau normalize trước link: resume link đúng Run một lần; receipt/malformed raw không được coi accepted. |
| C-g CP:46 | Chỉ kiểm có field, chưa chứng minh budget authority. | Hai caller open child từ cùng exhausted parent: một child hợp lệ, debit một lần; thiếu grant thì park. |
| E-a EF:37 | Fake zero-output không đủ eligibility và khác outcome lịch sử. | Replay zero-output ceiling thật: reconcile live/effects trước; fallback chỉ khi chứng minh eligible và candidate compiled. |
| E-b EF:38 | Không thể đồng thời pass với §6/§7 và matrix hiện tại. | Unknown delivery -> reconcile/park; nhánh đã chứng minh safe mới retry theo một budget/default duy nhất. |
| E-c EF:39 | Đúng, nhưng retryAfter không luôn parse được. | Quota line -> park cùng Run, giữ raw line; có/không timestamp đều không tự admit lúc reset. |
| E-d EF:40 | Presence đơn lẻ chưa chứng minh đang tiến triển; genuine idle cũng present. | Caller timeout + chưa có terminal ladder outcome + live worker -> wait, không spawn; không phủ nhận ceiling hợp lệ. |
| E-e EF:41 | Đủ registration/capability; thiếu giữ constraints quan trọng. | Ordered candidate bị governance/confinement refuse được ghi reason, candidate hợp lệ giữ original constraints/provenance qua compiler và runtime gate. |
| E-f EF:42 | Chỉ phủ semantic, chưa phủ ba domain lỗi như tên hàng. | Table-driven config-invalid/launch-failed/semantic-reject cho ba classification đúng, không fake timeout và không fallback semantic failure. |

## F. Default Vừa Đủ?

**Giữ:** một local repository, một herdr adapter, scan thay index, pure planner, static ordered candidates, compiler/confinement hiện có. Distributed lease, generic incarnation field, health observation store/scoring/cooldown, effect ledger và dashboard đều có thể tiếp tục deferred. Không có bằng chứng cần đưa chúng vào default để chữa 20 bug.

**Cần có trước khi bật recovery mutation:** atomic Run admission/reconcile orphan, strict result eligibility, local stale-controller protection, mapping/budget thống nhất, typed apply claim và continuation budget/entry semantics. Đây là nội dung của những contract đã chọn, không phải architecture mới. Planner chỉ `show --json` có thể ship trước, nhưng không tuyên bố đã chữa C-g hay concurrent apply.

**Có thể giảm khỏi default:** rename/display labels không chữa vấn đề correctness; multi-handle replacement không nên hứa giữ lịch sử nếu storage chỉ hỗ trợ current handle. Future health fields như candidate-in-cooldown được giữ ở contract extension nhưng không đòi module runtime chưa cần. Quan trọng nhất: bỏ hai default retry mâu thuẫn trước khi thêm backoff/cooldown knobs.

Node amend phải đi trước Rust writer port. Migration §11 (`node-to-rust-component-migration.md:337`) yêu cầu lock, atomicity, idempotency, crash recovery và mutual exclusion đã explicit/tested. Lưu ý độ chính xác nguồn: §4 Not-Thin hiện không liệt kê tên coordination/dispatch trực tiếp; kết luận giữ legacy writer vẫn được hỗ trợ bởi §4:165 và §11, không nên trích như một dòng inventory đã có.

## G. Simple Và Clean

Việc bỏ patch-log và giữ một contract mỗi file đã cải thiện rõ. Shared README principles có hệ quả thật trong ba doc: result-first, no authority from observation, owner/version refusal, compiler reuse. Không cần xóa mọi câu nhắc lại invariant ở nơi áp dụng; đó là redundancy có ích.

Chỗ còn lặp đáng sửa là **nguồn quyết định**, không phải số dòng: fallback budget so với recovery matrix; graph/quorum suy lại trong planner; binding ở visibility.json so với run-handle.json; lock embedded trong handle so với lock file nếu không nói cái nào authoritative. Nguyên tắc “typed/cancellable/idempotent” ở RH:231 và “hai caller hội tụ” ở CP:169 hiện mạnh hơn contract cụ thể. Sửa signature/transaction hoặc hạ claim, không thêm đoạn nguyên tắc thứ hai.

Khuyến nghị hình dạng cuối: Run admission và settlement ở runtime owner; RunHandle guard quản lý control; operation boundary cấp effect eligibility; fallback chỉ sắp candidate và xin compile; CP chọn một action từ facts do evaluator hiện có cung cấp; command handler hiện có apply có claim/revalidation. Không thêm service, policy engine hay framework tổng quát.

## Bảy Quyết Định Đã Chốt

| Quyết định | Tuân thủ / vi phạm |
|---|---|
| 1. Run admission, runId, run-retried; không thành phần thứ tư | Tuân thủ hướng ở Run:59, RH:39, CP:25, EF:27. Claim strict fencing đã có chưa đúng code (R01); atomic admission/orphan reconciliation chưa đủ (R02). Hoàn thiện ngay owner đã chọn. |
| 2. Lease/incarnation mandatory, primitive local | Tuân thủ vị trí và locator RH:166; guarantee control chưa kín R03. Không đề nghị defer guarantee hay bắt distributed lease. |
| 3. Ladder/matrix/fallbackExecutors tái dùng | Tuân thủ tham chiếu EF:66/196. Chưa tuân thủ semantics nhất quán ở retry/default/mapping/counters (R07–R09). `FallbackPolicy.candidates` chỉ nên derived từ effective PolicyPatch, không một config list có quyền riêng. |
| 4. Không đổi partialPolicy/authorization semantics | Phần trách nhiệm CP:48 đúng; proof C-b blanket refusal và remedy C-c sai intent (R10). tsk-296 đã ghi rõ refusal C-b là conditional theo kết quả tsk-5qj. |
| 5. Health store/cooldown/scoring deferred | Tuân thủ EF:194/213. Không cần đưa vào default. |
| 6. Runtime spawn sở hữu state, unknown version refuse | Tuân thủ RH:79 và README:66. Cần bind owner immutable với process thật, phân biệt controller hiện tại; operator runtime kia route về owner hoặc typed refuse. Không đề nghị dual writer. |
| 7. Implement amend Node rồi port Rust | Không bị bác bỏ, nhưng chưa được đặt thành dependency cụ thể trong slices (R15). Report giữ quyết định này; implementation status vẫn phải thành thật về guarantee chưa có. |

## Câu Hỏi Chưa Chốt

Đây là các câu contract cần trả lời, không yêu cầu người dùng chọn một kiến trúc mới:

1. Default có một retry cùng executor sau khi delivery được reconcile safe, hay luôn chuyển candidate? Per-Assignment budget và Session maxRetries chuyển đổi chính xác thế nào?
2. Local lock có được steal từ holder process còn sống sau TTL không? Nếu có, nơi nào chặn control đang in-flight của holder cũ?
3. Continuation child bắt đầu bằng flow/request hợp lệ nào khi remaining operation không reachable từ entry? Grant chain budget được tham chiếu và debit ở cửa ghi nào?
4. RunHandle thay `visibility.json` hay là projection từ nó; lane ngoài herdr được rollout dưới contract version nào?

**Status: DONE_WITH_CONCERNS**. Review hoàn tất; giữ cách chia thành phần hiện tại, nhưng cần đóng các blocking finding về semantics và proof trước khi coi thiết kế simple, clean và đủ để triển khai độc lập.
