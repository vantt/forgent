<!-- Nguồn: .fgos/assignments/unit-run-1792073730919-8c678aa1/producer/1/runs/01/outbox/report-1.md — openai/tetcu72 gpt-6-astra, herdr pane, read-only code review of W1' commits a72d263bc + 49cfc4be3, 2026-10-15. Bản sao nguyên văn; probes nằm cạnh bản gốc. -->

**Review độc lập W1' — kết luận: LAND SAU SỬA NHỎ, chưa land hai commit nguyên trạng.**

Review ngày 2026-10-15, assignment `unit-run-1792073730919-8c678aa1/producer/1`. Có ba phát hiện cần sửa: **W1 high** là regression loại trừ đã tái hiện bằng Git/process thật và so sánh trước/sau; **W2 high** và **W3 high** là phần trung hoà marker/schema chưa đáp ứng điều kiện vòng 2. Không cần kéo ledger hoặc grant v2 vào đợt này.

Đã đọc diff `a72d263bc3c70b50e29e276280f5901be7ea30a5` và `49cfc4be357b4f7758d8aaaee1e595648c099e92`, source trong worktree `/home/vantt/projects/forgentX/.claude/worktrees/agent-a068b1ed9ad8afeb2`, báo cáo implementation, báo cáo phản biện vòng 2 (B4 và “W1 chạy một mình”), thiết kế mục 8/13 và các đoạn spec liên quan. HEAD worktree đúng `49cfc4be3`. Trong lúc kiểm replay, working tree bị thay đổi bởi tác vụ khác (helper checkpoint đã đổi chữ ký); review này không đánh giá các sửa chưa commit ấy. Tôi dựng snapshot bằng `git archive 49cfc4be357b4f7758d8aaaee1e595648c099e92`, xác nhận hash cả 10 source khớp hash ban đầu, và chạy lại toàn bộ probe trên snapshot: bốn lệnh đều exit 0, tái hiện nguyên ba phát hiện. Kết quả snapshot là bằng chứng cuối trong gói đính kèm. Mọi `file:dòng` bên dưới thuộc worktree đó. [Dấu băm source và kết quả probe](evidence-1.json), [script cùng kết quả gốc](probes-1.tar.gz).

Không sửa workspace, không commit, không chạy `npm test`, `cargo build`, `cargo test` hoặc suite test của repo; không acquire/xoá lock thật. Git, checkpoint, merge, `unlock`, `lock-status`, child process và bản thử sửa đều chỉ chạy trong các thư mục tạm riêng: lượt đầu `/tmp/fgos-w1-independent-lomtqj3b/`, lượt replay phát hiện drift `/tmp/fgos-w1-replay-cost9x_h/`, và lượt cuối đã pin source `/tmp/fgos-w1-pinned-cdyqixx0/`. Ngoại lệ ghi workspace chỉ là outbox được brief yêu cầu. Đã áp dụng hướng kiểm caller của skill `gitnexus-pr-review`; GitNexus không có trong tool manifest nên không có bằng chứng graph và không rebuild index. Không dispatch agent hay gọi Work lifecycle. Các nhận định Rust là kiểm source, không phải kết quả thực thi Rust.

**Đối chiếu điều kiện vòng 2**

| Điều kiện | Trạng thái | Bằng chứng và giới hạn |
|---|---|---|
| Tách beacon khỏi mutex, gỡ kẹt claim/land sau commit mới | **Đóng ở implementation** | Hook chỉ ghi beacon cuối đường thành công; claim/land không đọc beacon. Năm đường release theo writer chuyển sang clear beacon. Guard cũ chạy trước grant/beacon. |
| B4: giữ main mutex suốt checkpoint dưới merge-slot | **Đóng một phần** | Probe hai process xác nhận checkpoint giữ lock qua Git commit và nhả sau reset khi commit lỗi; chiều ngược lại bỏ checkpoint. Nhưng cùng process vẫn acquire lồng bằng self-recognition và nhả lock của operation khác: W1. |
| Caller đã giữ main truyền context, không acquire lại | **Đóng cho hai caller trực tiếp, chưa kín toàn bộ wrapper** | `claim-port.mjs:164` truyền `process.pid`; `merge.mjs:939` truyền `identity`; `merge.mjs:807` không truyền vì chỉ có slot. Probe context xác nhận không nhả lock của caller. Wrapper tự acquire vẫn thiếu `allowSelfRecognition:false`. |
| Marker/schema lạ phải fail-closed và không bị phá | **Chưa đóng đầy đủ** | Acquire/inspect chặn JSON có `v`; acquire kiểm marker sau thành công. Inspector, Rust reader và đường ambiguous-reclaim bỏ sót marker; release/renew bỏ sót schema có trường legacy: W2/W3. |
| TTL theo record và phạm vi project ngoài fgOS | **Đóng cho caller production hiện tại** | `recordTtlMs`/`judgeRecord` dùng chung cho Node acquire/inspect; merge-slot/main ghi 180 s, dispatch ghi timeout của holder và heartbeat giữ TTL. Báo cáo/spec đã nói rõ đây là đổi hành vi library ở mọi project. |
| Giới hạn v1 và chuyển release được ghi rõ | **Phần lớn đóng** | Implementation report ghi A1, TTL takeover holder sống, commit tay, reset, promote, claim rộng và writer cũ. Hai tuyên bố “không bao giờ xoá record schema lạ”/“từ chối marker lạ” hiện vượt code; sửa W2/W3 trước khi giữ chúng như settled fact. |

**W1 — high — Checkpoint tự acquire tái nhập main lock cùng PID rồi release lock của một merge đang chạy**

Bằng chứng: `src/state/events-jsonl-truncation-guard.mjs:49` (nhánh tự acquire ở dòng 51, release ở 56); `src/runner/main-checkout-lock.mjs:401` (self-recognition), dòng 482 (mặc định bật); `src/runner/merge.mjs:807`, dòng 966 (await verify bên trong hold). Probe `probe-extra.mjs`, kết quả `extra-results.json.sameProcess`.

Lịch chạy dùng chính API production, không giả lập acquire:

1. Một Node process gọi `mergeRunnerItem()` với main mutex. Git đã `merge --no-commit`; verify là process shell thật, đứng ở barrier file.
2. Trong khi Promise merge đang chờ verify, cùng Node process gọi `withMergeTargetSlot()` cho một target khác. Có events mới đến và checkpoint đã tới hạn.
3. Checkpoint không có `mainLockHolder`, nên gọi acquire bằng chính `process.pid`. Module tự nhận là holder cũ, refresh record và trả một release closure mới.
4. Checkpoint thử commit pathspec trong khi Git đang merge; Git từ chối partial commit, helper reset pathspec rồi chạy `finally` release. Main lock của operation 1 bị xoá dù operation đó còn đang verify.
5. Một Node process thứ ba acquire main lock thành công. Khi verify được mở barrier, merge 1 trả `lock-lost-mid-merge`; `.git/MERGE_HEAD` vẫn còn.

Đây là lỗi operation khác trong cùng process, không cần PID tái dùng, không chờ TTL, không forge env và không cần nâng marker. Chưa chứng minh một CLI thông thường tự tạo lịch này; probe chứng minh hai API async của library đang sống có thể làm thế khi được ghép trong cùng process. API không có điều kiện cấm đó, và helper mới không được tự nhả hold mà nó chỉ nhận nhờ PID trùng.

So sánh cùng lịch trên Git/process thật:

| Source | Main lock sau checkpoint | Contender ở process thứ ba | Merge đầu |
|---|---|---|---|
| Trước diff (`a72d263bc^`, ba module gốc nạp qua loader tạm) | Còn | `held` | `merged` |
| W1' | Mất | `acquired` | `lock-lost-mid-merge`, còn `MERGE_HEAD` |
| W1' + một sửa thử trong `/tmp`: `allowSelfRecognition:false` ở acquire của checkpoint | Còn | `held` | `merged` |

Hệ quả: operation bên ngoài có thể vào main checkout khi Git merge cũ còn dở; cơ chế ownership check của merge chặn commit muộn nhưng không phục hồi loại trừ đã mất. Đây là regression do nhánh acquire/release mới của diff, khác A1/TTL vốn được chấp nhận còn mở. Probe không khẳng định đã làm mất dữ liệu vĩnh viễn.

Sửa tối thiểu: truyền **`allowSelfRecognition: false` tại nhánh tự acquire của `withCheckpointMainLock`**. Giữ nhánh `mainLockHolder` cho caller có hold hợp lệ; không dùng self-recognition để suy ra context. Thêm test cùng process như lịch trên, bên cạnh test hai process hiện có. Bản thử một dòng đã đóng phản ví dụ; chưa sửa source thật.

**W2 — high — Marker chỉ được kiểm sau acquire thành công; hook, lock-status, Rust và unlock vẫn đi qua marker lạ**

Bằng chứng: `src/runner/main-checkout-lock.mjs:488` chỉ kiểm marker nếu `ACQUIRED`; inspector ở dòng 711–724 chỉ đọc lock file, ENOENT trả `free`; `forceReclaimAmbiguousLock` ở dòng 764–782 không đọc marker. Hook gọi inspector tại `.githooks/pre-commit:501`. CLI `bin/fgos.mjs:4239` và dòng 4266 dùng acquire rồi ambiguous-reclaim. Rust `packages/distribution/rust/src/lock.rs:181` trả `Ok(())` ở dòng 184 khi lock file không có, không đọc marker ở bất kỳ nhánh nào.

Probe `marker2`, `markerBad`, `markerUnknown` dựng marker tương ứng `{writer:2}`, nội dung không phải JSON, và `{writer:"future"}`, không có file v1:

- `acquireMainCheckoutLock` trả `held / unsupported-protocol` đúng như yêu cầu.
- `inspectMainCheckoutLock` lại trả `free`.
- `git commit` với bản hook thật **exit 0** và đổi HEAD trong cả ba ca.

Probe thêm marker=2 + lock file hỏng. CLI thật `node bin/fgos.mjs unlock --dir <repo-tạm> --json` exit 0, trả `{cleared:true,reason:"reclaimed"}` và xoá file; `lock-status` tiếp đó trả `free`. Không phải chỉ mô hình suy ra từ helper.

Hệ quả: release được mô tả là “neutral” nhưng không có một quyết định thống nhất khi tài nguyên đã chọn giao thức khác. Chẩn đoán báo rảnh trong khi acquire từ chối; hook vẫn commit; đường repair xoá lock dưới marker không hiểu. Với Rust, các cửa `fgctl` dùng reader này sẽ coi thiếu file v1 là rảnh dù marker đã chuyển; đó là kết luận từ source/caller (`init.rs:940`, các call khác), chưa chạy binary. Không cần chứng minh cutover nóng an toàn mới sửa được các nhánh fail-closed bị thiếu này. A5 về commit tay không loại trừ cũng không miễn cho hook lời hứa từ chối marker lạ.

Sửa tối thiểu: dùng một quyết định marker cho Node acquire/inspect/reclaim và reader Rust. Kiểm trước nhánh “file không tồn tại” và trước mọi repair/reclaim; vẫn giữ **kiểm lại sau acquire** để không mở lại race đọc marker trước khi giành lock. Marker lạ/hỏng trả reason nâng cấp nhất quán, không dọn file; CLI không báo `cleared:true`. Thêm test marker-only cho hook/lock-status/Rust và marker+corrupt-lock cho unlock. Việc cleanup record v1 do chính acquire vừa tạo trong hậu kiểm cần phân biệt với sửa/xoá dữ liệu của protocol khác.

**W3 — high — Release/renew vẫn phá record có `v` nếu record đó giữ `pid` và `ts`**

Bằng chứng: `src/runner/main-checkout-lock.mjs:232` (`parseLockContent` không từ chối `v`), `releaseMainCheckoutLockIfOwn` dòng 610/618/623, `renewMainCheckoutLockIfOwn` dòng 674/682/687. Release closure của acquire gọi helper này ở dòng 513. Test mới `test/runner/main-checkout-lock.test.mjs:637` dùng record v2 **không có `pid/ts` ở top level**, nên release/renew trả ambiguous do thiếu trường legacy; test đó chưa chứng minh bảo vệ trường `v`.

Probe ghi `{v:2,kind:"future-mutex",pid:<PID thật>,ts:<now>,ttlMs:180000,token:"keep-me"}`:

- Acquire và inspect đều nhận `unsupported-protocol`.
- `releaseMainCheckoutLockIfOwn(dir,pid)` trả `released`, file biến mất.
- Viết lại record đó rồi gọi renew: trả `renewed`, record mới chỉ còn `pid/ts/ttlMs`; `v`, `kind`, `token` bị bỏ.
- Closure của một hold v1 có trước cũng xoá record này khi release.

Hệ quả: hợp đồng “hễ có `v` thì không được dọn/làm mới/release” chưa đúng. Record phiên bản mới hoàn toàn có thể giữ các trường legacy hoặc record lai có thể xuất hiện khi chuyển phiên bản. Không có lý do an toàn để code không hiểu schema chỉ dựa vào PID trùng rồi bỏ schema. Đây là lỗ còn sót của phần trung hoà mới, không phải tuyên bố rằng W1 đã tạo writer v2 trong production.

Sửa tối thiểu: schema guard phải nằm trên **mọi lần đọc phục vụ release/renew**, kể cả lần đọc lại, trước kiểm identity. Có thể cho parser legacy từ chối mọi object mang `v`, hoặc dùng kết quả parse phân biệt unsupported để không làm rơi reason. Rà cả helper release vô điều kiện (`main-checkout-lock.mjs:559`, CLI unlock dòng 4262) theo cùng contract. Thêm vector `v` + đầy đủ trường legacy cho release/renew/closure; không chỉ vector v2 thiếu `pid/ts`. Việc này không cần giải A1 hay xây ledger.

**Các đường đã kiểm và không nâng thành blocker mới**

- **Checkpoint khác process:** production `withMergeTargetSlot` chạy Git commit với hook barrier tạm; contender main lock trả `held`, holder là PID của process checkpoint. Mở barrier: commit thành công, lock được nhả, index trống. Hook exit 1: checkpoint reset, không còn staged events, lock được nhả. Land giữ lock trước: checkpoint không commit, không để staged events, không đổi owner. Đây là proof phần B4 đã sửa đúng; không phủ nhận W1 cùng process.
- **Context `mainLockHolder`:** probe acquire ở caller rồi gọi helper với PID đó; checkpoint qua hook thật, lock vẫn còn của caller cho đến caller release. Ba call site production đã được sửa đồng bộ, không thấy call site còn truyền option `commitEnv` cũ. Context hiện là số PID tin cậy nội bộ, chưa phải token/handle được validate; không gọi nó là grant v2.
- **`FGOS_MAIN_LOCK_HOLDER_PID`:** grant được xét sau guard staged deletion/root-file/worker branch/stale-index/line-regression. Nó không mở đường bỏ qua các guard ấy. Tuy nhiên nó **không xác thực quan hệ cha-con**: probe lấy PID của một process khác đang sống, ghi record fixture trỏ tới PID thật đó, rồi commit từ process không phải con holder với env trùng PID; hook cho qua và bỏ beacon. Không có env thì cùng commit bị từ chối. Đây là hạn chế quyền mượn PID đã có từ trước (hook cũ cũng self-recognize PID env), được W1 chủ ý giữ cho tới W2c; không tính thành regression mới hay buộc triển khai grant v2 để land W1. Comment “commit is fgOS's own” nên được hiểu là tín hiệu phối hợp giữa caller tin cậy, không phải chứng cứ quyền hay confinement.
- **TTL theo record:** probe dùng PID thật, tuổi record được đặt có chủ đích (không chờ 4 giờ, không đổi đồng hồ hệ thống). Legacy chuỗi ở tuổi 25 s → stale/TTL 20 s; legacy numeric ở tuổi 25 s → live/TTL 180 s; legacy composite dispatch ở tuổi 4 phút → live/TTL 4 h. Explicit 1 s ở tuổi 5 s → stale; explicit 10 phút ở tuổi 4 phút → live; TTL trên trần ở tuổi 4 h + 1 ms → stale. Các caller dispatch ở `dispatch/cli.mjs:727` và `dispatch/assignment-runner.mjs:2221` ghi timeout của chính holder, heartbeat renew giữ field đó. Merge-slot ở `merge.mjs:790` ghi 180 s. Test source đã có hai chiều contender ngắn/dài; tôi không chạy lại suite đó.
- **Ảnh hưởng project khác:** contender dài không còn kéo dài cửa sổ của holder dispatch ngắn; contender ngắn không được cắt TTL holder dài. Legacy composite không TTL có thể giữ tới 4 h khi PID còn sống; PID composite chết vẫn được reclaim ngay. Đây là thay đổi semantics có chủ ý và đã được ghi phạm vi. Holder sống quá TTL vẫn bị takeover; heartbeat không cứu khi process dừng hoặc event loop bị chặn. Không kết luận W1 sửa vấn đề ấy.
- **Rust/Node:** numeric và opaque session record ở main lock khớp về 180 s/20 s và TTL explicit có trần 4 h; `v` được Rust reader chặn. **Chưa khớp marker** là W2. Rust xem mọi string là session 20 s và không probe PID embedded, trong khi Node có nhánh composite 4 h/dead-PID. Hiện Rust helper chỉ đọc `main-checkout.lock`, không đọc dispatch lock, và không có writer main production ghi composite, nên tôi không nâng khác biệt đó thành bug đang xảy ra. Không tái dùng helper Rust cho dispatch rồi nói đã parity. Với số TTL vượt JS safe-integer cũng cần vector thống nhất nếu muốn chứng nhận parser parity tổng quát; writer production hiện lọc input hợp lệ.
- **Default API:** `acquireMainCheckoutLock(dir)` không truyền TTL vẫn ghi record thiếu `ttlMs`; probe xác nhận. Các caller production liên quan đều truyền TTL hợp lệ nên chưa làm sai các luồng đang review. Câu “lockRecord luôn ghi ttlMs” trong implementation report mạnh hơn code; nên giới hạn câu đó cho caller production hoặc materialize default khi writer bỏ option.
- **Return/cleanup/compound:** năm replacement chỉ clear beacon cùng writer, không acquire/clear mutex; source vẫn giữ nhánh thành công/thất bại vốn có. Không thấy regression bình thường mới ở các nhánh này. Không thực thi toàn bộ lifecycle return/cleanup trong review này. `lock-status` có beacon riêng đúng hướng, nhưng chưa phản ánh marker (W2). `unlock` chặn record `v` ổn trong ca trực tiếp, còn marker+corrupt-lock thì không.
- **Giới hạn giữ lại:** reclaim đọc-rồi-unlink, PID reuse, live-holder TTL takeover, manual commit/land, reset không mutex, promote đọc tip ngoài lock, worktree hook chậm và wider claim đều vẫn tồn tại như report đã ghi. Không dùng chúng để mở thêm scope của bản vá này.

**Bằng chứng và chạy lại**

[evidence-1.json](evidence-1.json) gom hash 10 source, 11 ca của probe chính, ca merge cùng process + hai CLI thật, baseline và bản thử sửa. [probes-1.tar.gz](probes-1.tar.gz) giữ script, kết quả và ba module trước diff. Không đóng gói các repository tạm hoặc state thật. `bootstrap.py` dựng snapshot source từ Git object và nối dependency directory hiện có; không build hay cài gì.

Giải nén archive vào **một thư mục tạm mới**, rồi chạy theo thứ tự sau từ đó (git repo nêu đầu báo cáo phải còn chứa hai commit; bootstrap đọc Git object, không dùng working-tree bytes):

```sh
python3 bootstrap.py
node probe.mjs
node probe-extra.mjs
node --no-warnings --experimental-loader ./baseline/loader.mjs ./baseline/probe-before.mjs
node --no-warnings --experimental-loader ./candidate-fix/loader.mjs ./candidate-fix/probe-fix.mjs
```

Script tự tạo repo riêng cạnh chính nó, nên không chạy từ một chỗ đã giải nén rồi chạy lần trước. Baseline loader chỉ thay ba module bằng byte của `a72d263bc^`; các import khác đọc snapshot `49cfc4be3`. Contender dùng reader W1' cho cả ba biến thể; chỉ holder và checkpoint được thay ba module baseline. Contender là process Node độc lập. Candidate loader chỉ thay module checkpoint bằng bản thêm một option; không sửa source production. Barrier file điều khiển verify/hook, không dựa vào đoán thời gian scheduler. Không dùng các kết quả này như bằng chứng Rust executable hoặc full-suite green.

**Điều kiện land cụ thể:** sửa W1, hoàn tất marker trên các cửa W2, bảo vệ schema trên release/renew W3; đưa các phản ví dụ vào regression tests; cập nhật các tuyên bố trong report/spec cho khớp. Sau đó chạy checks phù hợp và full `npm test` theo DoD ở phiên được phép chạy suite. Tôi giữ đánh giá **“land sau sửa nhỏ”** vì cả ba sửa nằm trong phạm vi W1' đã duyệt, và sửa nhỏ nhất cho regression W1 đã qua probe trước/sau. Hai commit hiện tại chưa đạt điều kiện đó; không được dùng review này làm chứng nhận nâng marker lên 2.

Đã thử tạo preview bằng `mdview open` theo AGENTS.md; công cụ trả lỗi `attempt to write a readonly database`, nên không có URL preview. Báo cáo Markdown và gói bằng chứng trên đĩa vẫn đầy đủ.
