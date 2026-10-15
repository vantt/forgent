<!-- Nguồn: .fgos/assignments/unit-run-1792064393561-99961a32/producer/1/runs/01/outbox/report-1.md — openai/tetcu72, gpt-6-astra (frontier), herdr pane, fgos run read-only, 2026-10-15. Bản sao nguyên văn; evidence-probes.json nằm cạnh bản gốc. -->

# Phản biện kiến trúc vòng 2: nền lock + identity

Ngày 2026-10-15. Assignment `unit-run-1792064393561-99961a32/producer/1`.

**Kết luận: CHƯA duyệt bản 2 nguyên trạng để lập plan triển khai, kể cả W1 nguyên trạng.** Hướng ledger, tách beacon, giới hạn quyền theo process và giữ hot path trong process đều đáng giữ. Tuy nhiên đã tìm được phản ví dụ đa process cho GC + post-check, hàng rào nâng phiên bản và khoảng spawn → bind của grant. W1 cũng bỏ một khoảng bảo vệ có thật của checkpoint dưới merge-slot; vì vậy không chỉ “để nguyên A6 chưa sửa”. Sau sửa nhỏ phạm vi W1 nêu dưới đây, có thể duyệt riêng W1 mà không chờ cả W2–W6.

Báo cáo có **9 phát hiện mới: 3 critical, 4 high, 2 medium**. Mức độ nói về hậu quả nếu triển khai theo bản thiết kế, không đồng nghĩa mọi lỗi đã có trong production. “Đóng” trong bảng A1–A14 nghĩa là đóng câu hỏi ở mức thiết kế; module v2 chưa tồn tại nên không phải chứng nhận implementation.

## Phạm vi, nguồn và phương pháp

Đã đọc toàn bộ bản 2, phụ lục mã probe, phản biện A1–A14 và bản 1; đối chiếu các source được giao, reading-map, các phần liên quan trong runner/work-state/distribution/observe, luật nền và handoff contract. Ký hiệu **V2:dòng** dưới đây chỉ `plans/reports/design-261015-1814-lock-and-identity-foundation-lead-design-v2.md`; mọi source path tính từ gốc repo.

HEAD lúc bắt đầu đối chiếu là `9e4271102d60a15afe202ce2f7f33b09ae033f27`. `git diff --stat 2e739d714 HEAD -- <18 source được brief chỉ định>` không có thay đổi. Vì vậy sai khác phát hiện ở các source này không đến từ việc tác giả V2 đọc HEAD cũ. Dấu băm từng đầu vào được giữ trong `evidence-probes.json` cạnh báo cáo.

Đã kiểm prior art bằng `git log -S`: ledger/GC ở `58613b1c4`, checkpoint mượn pid ở `00aafe0ce`, main merge pid ở `c871cdcf1`, trần worker ở `e7d443c0d`, settlement CAS ở `2681b3898`. Đặc biệt, phần “retry khi file biến mất” của provider chỉ retry khi **mọi** ứng viên biến mất; đây là chi tiết quyết định B1.

Không sửa source/spec/config trong workspace, không commit, không chạy `npm test`/`cargo build`, không acquire/xoá lock thật của repo. Import source chỉ đọc; toàn bộ Git, lock, claim, file tín hiệu và process thử nghiệm dùng thư mục riêng `/tmp/fgos-lock-round2-d3_1vl5c/`. Hai hướng dẫn `fgos-routing` và `gitnexus-exploring` đã được đọc; không gọi lifecycle do brief không giao Work item. Phiên không có GitNexus MCP, nên bằng chứng điều hướng là source trực tiếp và lịch sử Git, không phải kết quả graph.

Các probe mới gồm mô hình protocol ghép helper production, Git thật, process thật và barrier file tất định. Việc chèn barrier quanh syscall chỉ xảy ra trong script tạm; không sửa source production. Không thử PID tái dùng thật, reboot, điều chỉnh đồng hồ hệ thống, Windows/macOS hoặc Rust facade chưa được xây; những phần đó được phân biệt rõ với bằng chứng chạy.

## Trạng thái A1–A14

| Mã | Trạng thái vòng 2 | Nhận định và bằng chứng |
|---|---|---|
| A1 | **Đóng nhưng sinh lỗi mới** | Bỏ sidecar/unlink để giành quyền đóng đúng lịch A1; chạy lại probe 1 chỉ một holder. Nhưng GC + post-check vẫn cho hai holder trong lịch mới B1; V2:145–180, `run-lock.mjs:169–194`, `provider-capacity.mjs:478–496`. |
| A2 | **Đóng một phần** | Marker đọc lại sau acquire chặn được stale reader trước acquire; probe 3c xác nhận. Nhưng lock v1 còn takeover holder sống theo TTL và reclaim TOCTOU; dùng nó làm hàng rào không bảo đảm không có vùng găng v1 đang chạy. Drain cũng chưa ngăn launch cũ sau lần quét; B2. |
| A3 | **Đóng một phần** | Unknown giữ mutex, phân biệt lỗi I/O/schema, adapter `processStartTime` → `startTime` là đúng. Luật “mtime trước boot ⇒ chết” lại dùng thời gian tường làm chứng cứ liveness, có thể kết luận sai; B7. Driver Node/macOS dùng `ps` còn mâu thuẫn hot path; B6. |
| A4 | **Đóng một phần** | Scope một tài nguyên/epoch/con, borrow không release, owner OR child, scrub env đều đúng hướng. Nhưng child chạy trước khi `.bound` xuất hiện; cha chết trong khe này thì takeover được trong lúc Git còn ghi. Kiểm grant cũng chỉ nói so pid cha, chưa bắt buộc khớp tuple của `.bound`; B3. |
| A5 | **Đóng** | V2:285–305 rút đúng tuyên bố hook đọc lock là loại trừ. Commit tay được ghi là ngoài bảo đảm. CAS bảo vệ ref, không bảo vệ toàn checkout. Đây là giới hạn đã nói thật, không phải lỗi đã được chữa. |
| A6 | **Đóng một phần** | Bảng writer sửa đúng sync-root, reset, promote-engine, checkpoint dưới slot; source tương ứng khớp. Nhưng W1 bỏ bảo vệ checkpoint trước khi cửa ghi mới tồn tại (B4), còn `checkpointMainFgos()` luôn acquire lại xung đột với transaction đã giữ main mutex (B5). |
| A7 | **Đóng** | V2:338–348 đặt đếm fresh effective view + kiểm + acquire trong cùng `events.lock`, đúng thứ tự events → claims. Probe hai process bằng helper production cho 1 acquired/1 refused, occupied=1. Đây là proof ranh giới đề xuất, không phải test claimWork v2 đã triển khai. |
| A8 | **Đóng một phần** | Main không có receiver và không takeover holder có thể ghi đã được nói đúng. `settleRunControl` là CAS thật; `isRunControlCurrent` chỉ đọc. High-watermark trên đĩa còn nhưng reader có thể nhận nhầm epoch thấp hơn là cao nhất (B1), nên bảo đảm epoch có thẩm quyền chưa hoàn chỉnh. |
| A9 | **Đóng một phần** | Owner=caller, kiểm `--owner-pid == getppid()`, token có trước, pin binary đều sửa đúng. Probe reparent từ chối. Tuy nhiên inspect sau timeout chưa được đặt sau một điểm xác nhận helper đã dừng; có thể inspect thấy trống rồi helper mới publish (B8). Child mồ côi còn phụ thuộc B3. |
| A10 | **Đóng một phần** | Đã phục hồi đủ cổng S6, nêu hai implementation cùng protocol, nhánh dừng và điều kiện bỏ Node. Nhưng prime identity chưa loại hết exec trong events lock (B6); bảng rank hiện tại phá parallelism/nesting đang có (B5). Microbenchmark không phải cổng đo trên round thật. |
| A11 | **Đóng** | V2:307–327 có bảng beacon riêng, một `windowMs`, không hỏi liveness, grant bỏ qua và không ghi beacon, writer không dùng pid mượn, ghi cuối hook. Những mâu thuẫn logic A11 đã hết. An toàn W1 tổng thể vẫn bị B4. |
| A12 | **Đóng** | V2:350–357 bỏ lineage làm quyền, giữ owner chính xác, delegation theo claimId + attempt + delegateWriterId. Khớp hai lần kiểm ownership hiện có ở `store.mjs:1141–1166`. Khi triển khai phải kiểm delegation lại dưới events + claims, cùng chỗ kiểm fresh claim. |
| A13 | **Đóng một phần** | Resolver chung, handle giữ key, flip cả hai writer và hai inspector, scope user/host, env gốc đã chốt là cải thiện thực chất. Cutover vẫn vướng B2; công thức `FGOS_STATE_HOME` không giống source Rust như tuyên bố (B9). |
| A14 | **Đóng** | V2:329–334 thừa nhận `git worktree add` có hook/filter không bound, chuyển khỏi main mutex sang `worktree-admin`, nêu callback pick không hỗ trợ và timeout. Không còn tuyên bố “mutex ngắn”. Còn phải test crash/timeout child và phạm vi add/remove/prune trước triển khai. |

## Các phát hiện mới

### B1 — critical — Post-check có thể trả nhầm thế hệ cao nhất khi GC chen vào giữa LIST và READ

**Bằng chứng:** V2:145–180; `src/runner/dispatch/run-lock.mjs:149–194,213–235`; `src/runner/dispatch/provider-capacity.mjs:442–498`. Probe mới `probe-new.mjs` + `gc-scan-actor.mjs`, kết quả `new-results.json`, ca `GC-between-postcheck-list-and-read`.

Lịch chạy đã tái hiện:

1. C đọc thế hệ 1 đã release, tính sẽ link 2, bị dừng trước link.
2. A acquire/release 2. B acquire 3. GC giữ 3, xoá 1 và 2.
3. C link lại 2 thành công. Post-check lấy danh sách `[2,3]`, đọc được record 2 của mình, rồi bị dừng **trước read record 3**.
4. B release. D acquire 4 và vào vùng găng. GC giữ 4, xoá 2 và 3.
5. C đọc 3 gặp ENOENT. `listGenerations()` bỏ qua 3, nhưng vẫn giữ record 2 đã đọc trong bộ nhớ. `currentGeneration()` trả epoch 2. Post-check của C **pass** và C vào vùng găng cùng D.

Kết quả: C `acquired`, epoch=2, `inside=2`, `holeFills=0`; D `acquired`, epoch=4; trên đĩa chỉ còn `0000000004.json`. Không có holder bị coi chết sai, không TTL, không ghi đè record, GC luôn tuân thủ “không xoá thế hệ cao nhất”.

Đây không chỉ là việc phụ lục quên dùng reader provider. Reader provider ở dòng 489 cũng `return best` nếu còn **bất kỳ** record nào; chỉ retry `anyVanished` khi `best === null` ở dòng 496. Thay import sang đúng reader ấy vẫn không sửa lịch “2 còn trong snapshot, 3 biến mất”. Câu V2:146 “giữ vòng đọc lại … như provider” chưa đủ chặt.

**Hệ quả:** mất loại trừ cho mọi mutex được port theo protocol này. Stress cũ có post-check 0 vi phạm không chứng minh invariant với GC. Mệnh đề V2:180 “GC không bao giờ thu thứ contender còn dùng” cũng sai: GC có thể thu record/lựa chọn mà contender đang giữ trong snapshot.

**Sửa tối thiểu:** tạm không GC các số epoch cho tới khi chứng minh reader mới. Nếu giữ GC, post-check phải dựa trên high-watermark từ **tên thế hệ**, không chọn max của chỉ những JSON đọc thành công. Acquire/inspect lấy tên max trước; nếu chính max biến mất thì đọc lại từ đầu, không fallback xuống thấp hơn; JSON hỏng/schema lạ phải giữ tài nguyên hoặc báo lỗi. Giữ probe trên làm test tất định, cùng EIO/corrupt-highest và GC song song nhiều người. `link` là điểm ứng viên tuyến tính hoá với điều kiện validation; “link và check” không phải một syscall nguyên tử.

### B2 — critical — Hàng rào đổi phiên bản dựa vào lock v1 chưa an toàn; drain là ảnh chụp, chưa là rào launch

**Bằng chứng:** V2:217–237,423,437; `src/runner/main-checkout-lock.mjs:313–317` và nhánh reclaim phía sau; `packages/distribution/rust/src/init.rs:193–223`; probe `new-results.json`, ca `neutral-v1-holder-outlives-ttl-during-upgrade`.

R-neutral theo V2 chỉ thêm bảo vệ schema + đọc marker sau acquire; nó **không sửa takeover numeric holder sống quá TTL**, còn W1 thừa nhận điều đó ở dòng 437. Một process R-neutral đã đọc marker=1, acquire v1 và vào vùng găng. Nó bị dừng quá TTL. Upgrader acquire v1 thành công, ghi marker=2 và release. Writer v2 vào ledger, trong khi vùng găng v1 cũ vẫn sống và có thể chạy tiếp. Đọc lại marker sau acquire của holder cũ không giúp: nó đã qua check trước khi bị dừng.

Probe dùng source acquire v1 thật, TTL=60 ms cho cả hai caller, chờ thực 100 ms; holder cũ vẫn sống, upgrader `acquired`, v2 `acquired`. Không chỉnh đồng hồ. Ghi `ttlMs` vào record ở W1 cũng không cứu lịch này: hai bên có cùng TTL. Nếu trông cậy heartbeat, một process bị pause hoặc đang exec đồng bộ vẫn có thể không chạy timer. Reclaim đọc-lại-rồi-unlink của v1 còn một lỗ riêng A1 ngay cả khi bỏ TTL takeover.

Drain V2:229–233 cũng chưa chứng nhận phiên bản code **đã nạp vào RAM**: một Node process có thể còn module cũ từ cùng source checkout, trong khi nhánh trên đĩa đã chứa commit neutral. Quét `/proc` rồi nâng marker không ngăn một compat command, daemon hoặc người dùng launch release cũ ngay sau lần quét. Việc workspace đã activate mới không vô hiệu hóa binary/payload cũ. Rollback “đối xứng” cần cùng điều kiện và phải tuần tự hoá người nâng/hạ; marker tăng-only ở 6.2 cũng cần phân biệt với đường rollback 6.4.

**Hệ quả:** cả v1 và v2 cùng ghi tài nguyên; tương tự khi chuyển path dispatch sang phạm vi máy. Probe 3c cũ chỉ chứng minh stale reader **chưa acquire**, không chứng minh holder v1 đang làm việc hoặc reclaimer v1 bị pause.

**Sửa tối thiểu:** với đợt đầu, chọn cutover trong cửa sổ dừng toàn bộ writer/reclaimer của tài nguyên, kể cả R-neutral, đồng thời ngăn launch cũ cho tới khi hoàn tất; công bố downgrade floor ở launch/activation chứ không chỉ prose. Doctor báo “chưa chứng minh drain” khi không biết provenance, không suy từ HEAD hiện tại. Nếu muốn nâng nóng, phải sửa/prove safety của mutex chuyển tiếp trước khi dựa vào nó; không coi vài nhánh neutralize là đủ. Registry process mới không tự giải được process có trước registry hoặc old binary không tham gia.

Lộ trình còn một lệch phụ: mục 6 yêu cầu R-neutral đã có code v2 để chuyển đường, W1 lại có neutralize còn module v2 tới W2a mới có. W1 phải từ chối marker lạ/2 khi chưa có implementation, rồi chỉ nâng sau release có đủ hai giao thức; không hứa redirect vào code chưa tồn tại.

### B3 — critical — Git có thể chạy trước khi grant được gắn; cha chết làm mất bảo vệ con

**Bằng chứng:** V2:247–253; `src/runner/dispatch/provider-capacity.mjs:510–516,606–612,680–688,1017–1019`; probe `probe-git.mjs`, ca `owner-dies-between-spawn-and-bound` trong `git-results.json`.

V2 spawn Git trước, sau đó mới publish grant và `.bound`. Giữa hai bước đó Git đã được OS cho chạy. Nếu cha chết, ledger chỉ thấy owner chết, chưa thấy con nào được gắn, nên contender được acquire. Git con còn sống và vẫn có thể commit. Việc “cha phải chờ con trước release” không áp dụng được khi cha SIGKILL; việc contender giữ khi có `.bound` không giúp khi `.bound` chưa tồn tại.

Probe giữ owner Node ở thế hệ 1, spawn Git commit có pathspec `.fgos/events.jsonl`, dừng Git trong hook project tạm, giết owner trước bind, rồi contender acquire thế hệ 2. Cho hook chạy tiếp: Git commit thành công **trong lúc thế hệ 2 đang được giữ**. Đây là project hook thông thường, không cần bypass hay giả mạo fgOS; chính V2:293 thừa nhận project khác không có hook fgOS.

Ngay cả không crash, hook có thể chạy tới check grant trước khi cha publish `.bound`, gây từ chối ngẫu nhiên. Prior art provider có `recordChild()` sau spawn, nên chỉ chứng minh “con đã ghi nhận thì được kiểm”, không chứng minh giao quyền trước khi con chạy là an toàn.

Một thiếu sót cùng contract: `.bound` ghi `{pid,startTime,bootId}`, nhưng bước chấp nhận chỉ bắt buộc **pid cha** bằng pid gắn. Trong cửa sổ grant còn hạn và owner còn sống, pid Git đã thoát có thể được tái dùng; so pid đơn thuần không từ chối process đời mới. `parent-results.json` có vector với parent thật nhưng startTime ghi khác: kiểm pid-only chấp nhận, kiểm tuple từ chối. Đây là mô hình record PID-reuse, **không phải** đã ép kernel tái dùng pid thật.

**Hệ quả:** mất loại trừ khi owner crash; hook tự chặn ngẫu nhiên khi scheduler chạy con trước cha; quyền borrow có thể rơi vào đời process khác nếu implement sát bước 3.

**Sửa tối thiểu:** launch có handshake trước side effect. Child/trampoline đứng chờ trên pipe; cha publish đầy đủ binding rồi mới gửi GO; EOF khi cha chết trước GO buộc child thoát mà chưa chạy Git. Nếu dùng exec để giữ pid, cần cùng process identity qua bước exec và test trên từng nền tảng. Kiểm toàn tuple tương thích host/namespace/boot/startTime của đúng child; unknown thì không cấp quyền nhưng vẫn coi borrower có thể sống khi xét takeover. Hết grant lifetime không được biến một Git còn chạy thành chết. Test crash ở từng cạnh spawn/bind/GO và cả project không có hook fgOS.

### B4 — high — W1 một mình mở cuộc đua checkpoint dưới merge-slot với land

**Bằng chứng:** V2:419–441; `src/runner/merge.mjs:790–804`; `.githooks/pre-commit:471–484`; `src/state/events-jsonl-truncation-guard.mjs:490–514`; `src/runner/merge.mjs:159–163,208–214,1908–1927`; probe `git-results.json`, hai ca `old-hook` và `W1-readonly`.

Checkpoint của `withMergeTargetSlot()` chưa giữ main mutex. Hiện hook của Git commit này acquire `main-checkout.lock` bằng pid mượn, giữ một khoảng bảo vệ sau hook, dù vùng trước hook và TTL vẫn có lỗi. W1 xóa acquire ở hook, nhưng việc bọc checkpoint vào main mutex lại tới W2c.

Cùng một lịch chạy trên Git thật, dùng commit với pathspec như checkpoint production:

| Biến thể | Land lấy main lock | Dirty gate production | Git checkpoint | Đồng bộ checkout của land |
|---|---|---|---|---|
| Hook acquire như cũ | `held` | qua | exit 0 | không chạy |
| Hook chỉ đọc như W1 | `acquired` | qua | exit 128 sau khi HEAD bị land đổi | `read-tree` exit 128 vì Git checkpoint giữ `index.lock` |

Dirty gate không cứu lịch này: `isWorkingTreeClean(repo, ownFileSet)` thực sự chạy trong probe; `.fgos/` bị bỏ qua theo chính policy source. Land có thể đã đổi ref rồi bỏ qua lỗi read-tree ở source dòng 1924–1927. Checkpoint production còn nuốt lỗi ngoài cùng và cố reset pathspec, khiến lỗi có thể không hiện thành thất bại verb. Probe chứng minh checkpoint thất bại và checkout sync thất bại, **không chứng minh mất nội dung file vĩnh viễn**.

**Hệ quả:** W1 gỡ đúng kẹt 180 s nhưng tăng tập lịch gây va chạm cho một writer của fgOS. Nói “A6 chưa đóng” là chưa đủ để gọi W1 an toàn độc lập.

**Sửa tối thiểu:** kéo phần bảo vệ toàn add → commit → reset-on-error của checkpoint dưới merge-slot vào chính W1, dùng main mutex v1 sẵn có và nhả ngay sau transaction. Caller claim/merge đã giữ main mutex truyền handle/context hợp lệ, không acquire lồng vô điều kiện. Chưa cần grant v2 hay ledger cho thay đổi hẹp này. Giữ đúng giới hạn v1 (A1, TTL), không tuyên bố chữa tất cả. E2E phải có checkpoint dưới slot đối đầu land, không chỉ kiểm “không để lại lock file”.

### B5 — high — Rank theo toàn process phá các transaction song song và cửa checkpoint lồng

**Bằng chứng:** V2:193,298,367–383; `src/runner/loop.mjs:1818`; `src/runner/dispatch/assignment-runner.mjs:2217–2224`; `src/runner/merge.mjs:920–934`; `src/runner/claim-port.mjs:118,168`.

V2 yêu cầu acquire hạng lớn hơn **mọi** lock process đang giữ, cấm hai lock cùng hạng. Runner hiện chạy nhiều `claimAndDispatch` bằng `Promise.allSettled` trong một process. Mỗi dispatch mutating có cwd riêng cần một lock hạng 30 sống xuyên run. Dispatch đầu giữ 30 thì dispatch thứ hai vào cwd khác cũng hạng 30 sẽ bị `lock-order-violation`; thậm chí khi task A tạm giữ lock cao hơn, task B acquire lock thấp hơn không cùng chuỗi phụ thuộc cũng bị chặn nhầm. Đây là regression mission #1, không phải chỉ test caller “lệch hạng”.

Còn có mâu thuẫn đồng bộ: `withMainCheckout(fn)` giữ main hạng 50; bên trong cần checkpoint, trong khi `checkpointMainFgos()` được định nghĩa **luôn đi qua acquire main**. Callers hiện có `claim-port:168` và `merge:934` nằm dưới main lock. Không re-entry + strict rank sẽ từ chối ngay đường hợp lệ này. Cấp quyền theo writer id trở lại không phải cách sửa.

**Hệ quả:** mất parallelism của runner hoặc runtime exceptions trên claim/merge bình thường. Rank process-local cũng không tự chứng minh thứ tự xuyên helper/Git hook; đó cần context truyền qua facade/grant đã được kiểm chứng.

**Sửa tối thiểu:** theo dõi thứ tự theo **transaction/chuỗi async**, không một tập hạng toàn process; mỗi transaction có stack/held-set riêng, đồng thời lock vật lý vẫn loại trừ các transaction cùng process nếu cùng resource. Cửa checkpoint nhận handle đã giữ với borrow nội bộ bị giới hạn, hoặc chia wrapper acquire và hàm thực thi dưới handle; không acquire lại cùng tài nguyên. Chốt cách quản lý handle trong Node facade trước W5. Test hai dispatch khác cwd trong cùng Node, hai transaction cùng cwd, và checkpoint dưới main/slot.

### B6 — high — Prime identity chưa bảo đảm “không exec bên trong events.lock”

**Bằng chứng:** V2:67–76,94–101,387–390; `src/runner/claim-port.mjs:299–321`; `src/runner/worktree.mjs:222–231`; `src/state/events.mjs:410–421,482`; `src/state/runtime-coordination.mjs:199,228`; `src/util/session-identity.mjs:101–125`.

Prime writer identity giải các lần resolve cold, nhưng vẫn có shellout khác. `claimWork` gọi `currentHead(repoRoot)` tại dòng 316 **bên trong** `withEventsLock`; `currentHead` gọi Git `rev-parse HEAD`. Nếu “không bao giờ exec” là cổng literal của V2, flow này đã không đáp ứng và không có bước nào trong W2/W5 nói chuyển nó đi.

Phần mới còn tự mâu thuẫn: L-os là leaf “không spawn”, nhưng Node driver macOS lại gọi `ps -o lstart`. Khi đang giữ events rồi tranh claims.lock, liveness probe của contender cho claims có thể gọi `ps` **trong outer events.lock**. Câu “chỉ người tranh gọi, holder không gọi” không giải nesting: một process là contender claims đồng thời là holder events. Prime identity không prime được sự thật liveness của mọi contender tương lai.

**Hệ quả:** không thể đạt S6 bằng đúng thay đổi nêu ra; latency và import boundary vẫn bị phá ở hot path. Ném lỗi test nếu identity chưa prime sẽ không bắt những exec này.

**Sửa tối thiểu:** chốt invariant có cấm mọi subprocess hay chỉ cấm bridge identity/lock. Nếu cấm mọi exec, audit call graph của toàn vùng găng, đưa snapshot HEAD ra ngoài với điều kiện nhất quán rõ ràng, xử lý kiểm stale-reclaim tương tự. Node facts trong vùng găng phải đọc in-process; driver không làm được trả unknown hoặc dùng native bridge đã duyệt, không lén spawn `ps`. Test instrumentation chặn spawn/exec trong vùng giữ events, gồm contention claims, không chỉ cache miss của identity. Nếu chỉ cấm RPC thì sửa lời hứa cho chính xác và đo phần exec còn lại.

### B7 — high — `mtime < boot time` không phải chứng cứ process đã chết

**Bằng chứng:** V2:88–90,115–122,390; schema owner và bảng 4.2/4.5. Đây là phản ví dụ logic; không đổi clock/reboot của máy chạy review.

mtime là thời gian tường của filesystem, không phải boot identity. Process sống có thể publish khi đồng hồ máy đang sai rồi đồng hồ được sửa, hoặc file mang timestamp cũ sau restore/copy bảo toàn metadata. Từ `mtime < thời điểm boot` không suy được “file được tạo bởi process của boot trước”. Dùng quy tắc ấy để lấn kết quả pid/startTime còn sống cấp quyền takeover sai. Với record hỏng, càng không có host/bootId đáng tin để chứng minh tiền đề “cùng host”. Bỏ fsync không biến timestamp thành chứng cứ đơn điệu.

Điểm này khác trade-off record mutex mất sau mất điện: mọi holder của boot trước chết thật, nhưng phải nhận diện **boot trước** bằng một nguồn đáng tin, không phỏng đoán từ mtime. Windows suy boot-time bằng đồng hồ hiện tại trừ uptime cũng cần tránh coi mỗi giá trị làm tròn/jitter là một bootId mới.

**Hệ quả:** quy tắc unknown→HELD bị một đường suy luận thời gian mở lại; toàn bộ lập luận “đã chết thì không sống lại” ở 5.3 chỉ đúng khi phép phán chết đúng.

**Sửa tối thiểu:** bỏ mtime khỏi các điều kiện tự cấp quyền. Record hợp lệ dùng boot identity/namespace/process identity được chuẩn hoá; record hỏng giữ unknown hoặc cần phục hồi có bằng chứng/người xác nhận sau quiescence. Nếu cần tự phục hồi sau reboot, định nghĩa metadata boot có thẩm quyền và protocol thay namespace thế hệ sau boot, rồi chứng minh riêng. Vector phải có live holder với timestamp trước boot, clock step và record không đọc được host.

### B8 — medium — Inspect ngay sau timeout không đóng được acquire đang còn chạy

**Bằng chứng:** V2:259–263. Probe `probe-helper-timeout.mjs`, kết quả `helper-results.json`.

Helper có thể đã nhận token nhưng còn bị dừng trước link. Caller timeout, inspect không thấy token nên kết luận “không giữ”. Helper sau đó chạy tiếp, publish một thế hệ có owner=caller còn sống và thoát. Caller không biết để release; contender sẽ giữ mãi theo liveness, hoặc retry của chính caller tự kẹt vì không re-entry. Token có trước giúp đối soát một kết quả đã ổn định, không bảo đảm kết quả đã ổn định.

Probe process thật cho `inspectAtTimeout: null`, sau đó helper publish epoch 1 với owner còn sống. Đây là mô hình timeout chưa wait/reap helper; không khẳng định một implementation `execFileSync` cụ thể đã có lỗi, vì facade Rust chưa tồn tại. Nếu implementation sẽ luôn kill và chờ helper chấm dứt trước inspect thì cần ghi chính điều đó vào contract.

**Hệ quả:** kết quả acquire vẫn có thể bỏ lửng và gây lock mồ côi về mặt logical transaction dù physical owner còn sống; A9 chưa đóng hoàn toàn.

**Sửa tối thiểu:** timeout/cancellation phải có terminal acknowledgement hoặc terminate + wait/reap đúng helper trước inspect. Nếu chưa xác nhận helper đã dừng thì outcome phải là pending/unknown, không kết luận free hay retry không ràng buộc. Kiểm token **và** chưa release/đúng current protocol khi recover handle. Thêm ca reply bị mất sau link, timeout trước link và activation đổi giữa acquire/release.

### B9 — medium — Công thức root của `FGOS_STATE_HOME` không khớp nguồn Rust được viện dẫn

**Bằng chứng:** V2:104–113; `packages/distribution/rust/src/store.rs:59–75`; `src/runner/dispatch/provider-capacity.mjs:37–39`.

V2 đặt `${FGOS_STATE_HOME:-${XDG_STATE_HOME:-<passwd-home>/.local/state}}/fgos/locks/` và gọi là cùng công thức với store.rs. Nhưng source Rust trả `FGOS_STATE_HOME` **nguyên giá trị**; chỉ nhánh XDG/HOME mới nối `fgos`. Với `FGOS_STATE_HOME=/state/custom`, V2 cho `/state/custom/fgos/locks`, còn resolver store hiện có cộng `locks` sẽ cho `/state/custom/locks`.

Một resolver lock mới dùng thống nhất ở cả hai ngôn ngữ vẫn có thể chọn path nào cũng được. Lỗi ở đây là contract nói “tái dùng cùng công thức” nhưng thực tế đổi nghĩa override, khiến plan dễ tái dùng Rust resolver một bên và chép công thức V2 bên kia. Sự khác biệt `HOME` và passwd-home là thay đổi có chủ đích khác, không nên lẫn với suffix này.

**Hệ quả:** khi triển khai không thống nhất, Node và Rust hoặc setup/doctor có thể nhìn hai authority root; riêng hiện tại chưa có writer v2 nên chưa phải split-brain production được tái hiện.

**Sửa tối thiểu:** định nghĩa một `stateRoot` với đúng nghĩa override hiện hành rồi `lockRoot = stateRoot/locks`, hoặc ghi rõ đổi contract và migrate cả hai bên. Vector path cho FGOS_STATE_HOME, XDG, HOME/private-home, FGOS_LOCK_ROOT, Windows; doctor hiển thị resolved root cùng provenance. Không coi doctor cảnh báo sau khi hai root đã được dùng là exclusion.

## Các điểm đã thử tấn công mà bản 2 đứng vững

1. **Link/EEXIST khi chưa GC:** lịch A1 không còn lấy mất holder mới. R1 bị dừng, R2 lấy epoch 2, R1 tiếp tục nhận `held`. Mấu chốt đúng là không unlink để giành quyền, không phải nhanh/chậm của process.
2. **GC có post-check trên lịch đơn giản của tác giả:** C lấp epoch 2, B epoch 3 còn nguyên suốt scan; C bị từ chối. Giữ max trên đĩa là điều kiện cần đúng. B1 đánh vào snapshot reader phức tạp hơn, không bác kết quả probe này.
3. **Stress nguyên bản:** ba lượt 6 process × 60 vòng với post-check cho 0 vi phạm và 70/63/74 lần lấp lỗ được từ chối. Các lượt không post-check có 112/142/129 vi phạm. Những số này là quan sát trong bộ lịch stress, không là proof mọi lịch.
4. **Marker check sau acquire:** probe 3c không recheck cho hai holder, có recheck thì stale reader v1 chuyển v2 và nhận held. Điều kiện này phải giữ trong giải pháp cutover sau sửa B2.
5. **Trần worker:** hai process cùng dùng fresh effective view, `hasWorkerSlotRoom`, `acquireClaim` dưới events.lock: một thắng, một từ chối, occupied=1. Không cần thêm ledger sức chứa riêng. `acquireClaim` hiện chỉ có production caller tại claim-port:310; đường durable `todo/blocked → doing` đã retired ở `status-fsm.mjs:117–132`, nên không có cơ sở gọi nó là đường bypass đang sống. V2 nên sửa câu “chuyển item sang doing” cho khớp source.
6. **Reparent của helper:** process cha bị giết trước helper kiểm; kernel đổi getppid sang 1, khác `--owner-pid` ban đầu, helper từ chối. Không tìm thấy lỗ cấp quyền chỉ vì reparent trong phép equality này. Helper phải giữ pid kỳ vọng, không thay owner thành parent mới để “tự lành”.
7. **Claim ownership:** giữ so writer chính xác và delegation theo attempt là lời giải trực tiếp cho sibling, không cần common ancestor. Kiểm fresh ownership lần hai dưới hai lock ở store hiện có là prior art cần giữ.
8. **Fencing settlement:** `settleRunControl` publish thế hệ settled theo CAS và `settlement.mjs:445–458` kiểm kết quả trước immutable proof. Đây là receiver thực; `isRunControlCurrent` tự nó chỉ là predicate. Không đưa GC nguy hiểm của B1 vào control ledger trong lúc viện dẫn guarantee này.
9. **Worktree-admin và phạm vi main:** tách lock metadata worktree khỏi main có lý do đúng. Việc thừa nhận hook/filter không bound và cấm recursive pick giúp không quảng cáo sai latency. Rank/context và lifecycle subprocess vẫn phải được sửa như B3/B5, không cần kéo worktree add trở lại main mutex.
10. **Beacon:** bảng riêng và grant không ghi đèn tránh self-collision logic A11. Ghi beacon cuối hook không bảo đảm Git sau hook sẽ commit thành công; V2 đã nói đúng đèn có thể sáng hết window khi commit thất bại.

## W1 chạy một mình: đóng gì và điều kiện nào còn thiếu

W1 **đóng đúng nguyên nhân kẹt 180 s cho commit mới** khi mọi hook liên quan đã chuyển: commit chỉ ghi beacon, claim/land không đọc beacon, record mutex không bị session id của hook tái dùng. Chuyển năm chỗ release theo writer id trong `bin/fgos.mjs:1408,1425,1795,3566,3596` sang beacon là cần thiết. `fgctl init` sẽ không gặp record chuỗi mới do hook W1 tạo.

Tuy nhiên W1 nguyên trạng **chưa an toàn để tách ra ship** vì B4. Cần thêm wrapper main mutex v1 cho checkpoint dưới merge-slot trong cùng thay đổi. Các caller đã giữ main dùng handle/context hiện có, không acquire lồng. Đây là sửa nhỏ cần kéo lên từ W2c; không yêu cầu xây ledger/grant v2 trước khi tách beacon.

Các giới hạn W1 phải ghi chính xác:

- Không đóng A1/reclaim v1, TTL takeover số, manual commit exclusion, reset không lock, promote-engine đọc tip trước lock, hoặc worktree hook chậm. Không thu hẹp claim nên không tự mở race capacity A7.
- Legacy string record còn sót và hook release cũ vẫn có thể tạo đèn ở đường main lock cũ. Node W1 đọc nó theo 20 s không làm Rust `lock.rs:167–173` tự đổi khỏi 180 s. Tuyên bố hết kẹt cho `fgctl init` cần phân biệt trạng thái sau chuyển và cửa sổ còn writer/record cũ.
- Thay mọi writer lưu TTL và mọi reader dùng TTL record là đổi hành vi library ở project ngoài fgOS, không chỉ “trung hoà” như V2:439. Cần test các caller numeric/composite của main, merge-slot, dispatch.
- Khi chưa có v2 code, marker=2/lạ phải fail-closed rõ ràng; W1 không phải giấy chứng nhận được nâng marker. Flip thật chờ sửa B1/B2/B3.
- Test phải giữ cả root guard, chống xoá/regress `.fgos`, linked-worktree bypass đúng phạm vi, và vị trí ghi beacon cuối hook. Các test này chưa chạy trong review vì brief cấm suite; “ba e2e xanh” của V2 là yêu cầu trước writer, không phải kết quả của bản review.

**Gói W1 có thể được duyệt lại ngay** sau khi bổ sung bảo vệ checkpoint, semantics marker chưa hỗ trợ và phạm vi migration TTL. Đó là một gói nhỏ, độc lập W2, nhưng khác W1 được gửi phản biện lần này.

## Khuyến nghị cho bốn câu hỏi mục 17

| Câu | Khuyến nghị | Lý do và phạm vi |
|---|---|---|
| 1. Hai implementation hot path | **Chọn (a)**: Node in-process cho events/claims tới khi use-case store sang Rust; cùng protocol/vector và test Node+Rust trên cùng tài nguyên. | Không kéo cả migration store hoặc addon vào prerequisite. Chấp nhận rõ hai implementation, không gọi vector là proof exclusion. Điều kiện kết thúc có tên là đủ để lập kế hoạch; không hứa ngày xoá Node chưa có ngân sách. Sửa B1/B6 và đo round thật trước flip hot path. |
| 2. Chứng nhận drain | **Chọn (a) đã siết thành quiescence có kiểm soát**, không chọn “scan rồi xác nhận phần còn lại” như hiện viết. | Đợt đầu không cần registry process mới: dừng toàn bộ writer/reclaimer, khóa đường launch cũ trong cửa sổ cutover, có checklist per resource và rollback floor. Nếu vận hành không chấp nhận downtime/không ngăn được launch cũ thì chưa flip; khi ấy mở thiết kế registry/admission gate riêng. Lý do “anh là người dùng duy nhất” không phải invariant sản phẩm cho project khác. |
| 3. Commit tay ở main | **Chọn (a)** với giới hạn rõ: raw Git nằm ngoài loại trừ fgOS. | Không có wrapper nào cứu một raw Git không đi qua wrapper. CAS/dirty gate là bảo vệ bộ phận. Tất cả writer **của fgOS**, gồm checkpoint, vẫn phải đi qua mutex; không dùng (a) để miễn B4. Đọc đúng source: dirty check đã dùng porcelain, thấy index lẫn worktree; rủi ro là policy bỏ qua `.fgos`/ngoài footprint và cửa sổ sau check, không chỉ thiếu `--cached`. |
| 4. W1 độc lập | **Có cho W1 đã chỉnh theo B4 và các giới hạn trên; chưa cho W1 nguyên trạng.** | Gỡ lỗi 180 s là mục tiêu hẹp có thể ship sớm. Đưa full W2–W6 vào plan thực thi ngay bây giờ sẽ buộc implementer tự thiết kế lại ba contract critical. Giữ sửa protocol/probe thành điều kiện trước duyệt phần đó. |

## Hồ sơ probe và cách chạy lại

`evidence-probes.json` cùng thư mục chứa nguyên văn tất cả script `.mjs`/`.py`, kết quả JSON, stdout, metadata và SHA-256 của đầu vào source. Có thể kiểm lại mà không phụ thuộc thư mục `/tmp` còn tồn tại. Mã cũ được trích từ đúng các block phụ lục D–J của V2; các import tuyệt đối chỉ đọc source repo. Khi chạy ở máy khác cần đổi đúng prefix repo trong import, không trỏ state thử nghiệm vào `.fgos` thật.

Tạo một thư mục tạm mới; từ JSON, ghi từng mục trong trường `scripts` thành file basename tương ứng vào thư mục ấy, rồi chạy:

```sh
node /tmp/<thu-muc-moi>/probe-ledger.mjs
node /tmp/<thu-muc-moi>/probe-mixed-version.mjs
node /tmp/<thu-muc-moi>/bench-hotpath.mjs
node /tmp/<thu-muc-moi>/probe-new.mjs
node /tmp/<thu-muc-moi>/probe-git.mjs
node /tmp/<thu-muc-moi>/probe-capacity.mjs
python3 /tmp/<thu-muc-moi>/probe-parent.py
node /tmp/<thu-muc-moi>/probe-helper-timeout.mjs
```

Không chạy các lệnh này bằng cwd hay root dữ liệu là `.fgos` thật. Các script dùng vị trí chính script làm cha của thư mục tạm mới. Ca grant thử Git dùng hook project riêng; ca W1 mô hình đúng đoạn hook lock có liên quan, **không phải** chạy toàn `.githooks/pre-commit` production. Ca upgrade dùng acquire production và marker mô hình; R-neutral/v2 implementation chưa tồn tại. Các SIGKILL chỉ gửi tới child PID vừa tạo và đang được giữ bởi harness, không process của repo.

| Nhóm | Kết quả quan sát |
|---|---|
| Ledger A1 | một holder |
| GC lịch cũ không/có post-check | hai holder / một holder |
| GC lịch mới LIST→READ | hai holder, epoch 2 và 4 dù chỉ epoch 4 còn trên đĩa |
| Mixed-version 3a/3b | v1 xoá record v2 / hai đường cùng acquired |
| Mixed-version 3c không/có recheck | hai holder / một holder |
| Upgrade khi holder v1 quá TTL | holder v1 sống + writer v2 acquired |
| W1 checkpoint | baseline exit 0; W1 exit 128, read-tree 128, dirty gate vẫn qua |
| Spawn trước bind | contender epoch 2 acquired, Git con owner cũ vẫn commit thành công |
| Capacity trong events | 1 acquired, 1 refused, occupied 1 |
| Reparent helper | expected parent khác actual 1, từ chối |
| PID reuse | vector startTime mismatch bị pid-only chấp nhận; không ép reuse thật |
| Timeout helper | inspect null rồi có publish muộn epoch 1 |

Benchmark được chạy lại 3000 vòng, rồi chạy riêng lần nữa sau khi các probe tranh chấp kết thúc. Lần riêng, microsecond p50/p95/p99:

| Biến thể | p50 | p95 | p99 |
|---|---:|---:|---:|
| link/unlink | 9,1 | 12,3 | 17,1 |
| Ledger fsync, GC mỗi release | 93,8 | 143,0 | 238,1 |
| Ledger fsync, GC mỗi 16 | 135,8 | 373,0 | 419,9 |
| Ledger không fsync, GC mỗi release | 81,5 | 114,1 | 204,4 |
| Ledger không fsync, GC mỗi 16 | 143,7 | 389,0 | 465,2 |

Các số này khác báo cáo Lead vì filesystem/tải/môi trường thực thi khác; không phải benchmark trên round fgOS thật, không chứng nhận ngưỡng thêm ≤0,5 ms p95/append. Lượt đầu chạy đồng thời các probe có p95 không-fsync/GC-mỗi-release 1257,4 µs; giữ cả hai lượt trong bundle để không chọn một số đẹp rồi gọi là proof. Đặc biệt chưa được bỏ fsync chỉ dựa vào luật mtime của B7.

## Quyết định duyệt

**Lựa chọn cho bản 2 đang được review: CHƯA.** Ba điều kiện critical cần đóng trước plan nền chung là reader/GC, cutover và spawn/bind. W1 có đường đi độc lập ngắn sau sửa hồi quy checkpoint; không cần đợi port Rust hay giải hết các câu hỏi nền tảng mới gỡ lỗi 180 s. Bảng A1–A14 và các ca đứng vững ở trên xác định phần nào nên giữ, không cần thiết kế lại từ đầu.
