# W1': gỡ kẹt 180 s trên main-checkout.lock

Ngày 2026-10-15. Phạm vi: W1 của [thiết kế bản 2](design-261015-1814-lock-and-identity-foundation-lead-design-v2.md) (mục 6, 8.5, 13) cộng các điều kiện của [phản biện vòng 2](red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md) (B4 và mục "W1 chạy một mình"). Không có gì của W2+ (ledger, grant v2, holder-lock). Quyết định ghi ở [docs/specs/runner.md](../../docs/specs/runner.md) mục 0064.

## Đã đổi gì

| Việc | Nơi | Ghi chú |
|---|---|---|
| Đèn hoạt động riêng | [`src/runner/main-checkout-activity.mjs`](../../src/runner/main-checkout-activity.mjs) (mới) | `.fgos/runtime/main-checkout-activity.json`, record `{v:1, kind:'beacon', writer:{id,source}, writtenAt, windowMs, auditPid}`. Một trường thời hạn `windowMs`, do người ghi khai. Đèn hỏng, schema lạ hoặc ghi ở tương lai xa thì cho qua và hook cảnh báo. `clearBeaconIfOwn` đọc lại trước khi xoá. |
| Hook | [`.githooks/pre-commit`](../../.githooks/pre-commit) | Không còn acquire/ghi `main-checkout.lock`. Sau mọi guard cũ (stale index, xoá `.fgos`, `.fgos` trên nhánh worker, root file, nhánh `fgw/*`, regress dòng `.jsonl`) hook đọc khóa một lần, không chờ. Commit của fgOS (pid trong `FGOS_MAIN_LOCK_HOLDER_PID` khớp đúng holder sống) bỏ qua đèn và không ghi đèn. Holder pid số khác còn sống, giao thức lạ hoặc khóa hỏng thì từ chối. Writer khác còn trong `windowMs` thì từ chối. Đèn được ghi cuối hook. Phạm vi linked worktree không đổi. |
| Ttl theo record | [`src/runner/main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs) | `lockRecord` luôn ghi `ttlMs`. `judgeRecord`/`recordTtlMs` dùng chung cho acquire và inspect: dùng ttl của record, chặn ở 4 h. Record cũ không có ttl: chuỗi phiên 20 s (`HOOK_TTL_MS`), pid 180 s, composite dispatch 4 h. Ttl của contender chỉ là giá trị nó ghi khi acquire. |
| Trung hoà | cùng file | Record có trường `v` thì HELD `reason: unsupported-protocol` và không được dọn, làm mới hay release, kể cả qua `forceReclaimAmbiguousLock`, `unlock` hay tự lành của claim. Sau acquire, đọc lại `<.fgos>/runtime/locks/<tên khóa>/protocol.json`: vắng hoặc `{writer:1}` thì đi tiếp; nội dung khác (kể cả hỏng) thì nhả và từ chối với "upgrade fgOS". Không chuyển sang v2 vì chưa có code v2. |
| B4: checkpoint | [`src/state/events-jsonl-truncation-guard.mjs`](../../src/state/events-jsonl-truncation-guard.mjs) | Checkpoint (tầng kernel) không import mutex của tầng runner. Caller truyền `mainCheckoutWriter`, hàm chạy trọn add → commit → reset-khi-lỗi trong main mutex v1. Caller đã giữ khóa (claim, merge không slot) truyền `heldMainCheckoutWriter(pid)`, nên không acquire lồng và không re-entry theo identity. Đường merge slot truyền `acquiringMainCheckoutWriter(dir)`: acquire, nhả ngay sau giao dịch, và bỏ lượt khi khóa đang bị giữ. Không có writer thì checkpoint không commit. Option `commitEnv` bị bỏ. |
| Caller | [`claim-port.mjs`](../../src/runner/claim-port.mjs), [`merge.mjs`](../../src/runner/merge.mjs) (slot ~804, không slot ~934, land, failFast inspect), [`dispatch/cli.mjs`](../../src/runner/dispatch/cli.mjs), [`dispatch/assignment-runner.mjs`](../../src/runner/dispatch/assignment-runner.mjs) | Truyền ngữ cảnh checkpoint. Thông báo HELD thêm `lockRefusalDetail`. Vùng claim giữ nguyên độ rộng. |
| Năm lời release theo writer id | [`bin/fgos.mjs`](../../bin/fgos.mjs) cleanup ×2 (~1409/1426), compound (~1796), return ×2 (~3567/3597) | `releaseMainCheckoutLockIfOwn(dir, writerId)` thành `clearBeaconIfOwn`. Không còn lời gọi nào chạm `main-checkout.lock` bằng writer id. `unlock` từ chối giao thức lạ. `lock-status` thêm trường `activity` cho đèn. |
| Rust | [`packages/distribution/rust/src/lock.rs`](../../packages/distribution/rust/src/lock.rs) | `LockRecord.ttl_ms` và `effective_ttl_ms()` theo cùng luật. Record cũ: chuỗi 20 s, pid 180 s. Record có `v` trả lỗi `lock-unsupported`. `init.rs` không đổi; khóa activation vẫn đọc như cũ. |
| Docs | [CHANGELOG](../../CHANGELOG.md) `[Unreleased] / Fixed`, [runner.md](../../docs/specs/runner.md) (mục "Khóa hoạt động cây chính", pointer của lock và hook, quyết định 0064), mô tả `lock-status` trong [command-registry](../../src/cli/command-registry.mjs) | |

Caller đã đổi (tìm bằng grep, vì index GitNexus cũ hơn HEAD): `claimWork`, `withMergeTargetSlot`, `mergeRunnerItem`, `landCasMergeUnderLock`, `mergeRootIntoMainCas` (failFast), `executeExecutorCli` (dispatch cli), assignment-runner cwd lock, `runOpportunisticMainCheckoutChecks`, các verb `cleanup`/`compound`/`return`/`unlock`/`lock-status`, hook, Rust `check_main_checkout_lock`. Caller dùng chung module mà không đổi code: `execution/run.mjs` (guard resume chỉ đọc pid) và `reconciliation-planner.mjs`; hai chỗ này có luật đọc riêng, thuộc W2b.

Không đổi ranh giới component. Không thêm check doctor: file đèn nằm dưới `.fgos/runtime/`, thư mục này đã bị git bỏ qua.

## Đóng được

- Claim, land và approve không còn bị chặn tới 180 s sau mỗi commit ở main, kể cả của chính phiên vừa commit (e2e: commit rồi `claimWork` ngay thì qua).
- Record của hook cho pid mượn trong checkpoint dưới merge slot không còn được tạo ra.
- `fgctl init` không gặp record chuỗi mới, và record chuỗi cũ chỉ còn chặn tối đa 20 s (Rust cùng luật).
- B4: checkpoint dưới merge slot loại trừ được với land. E2E dùng probe "W1-readonly" làm mẫu: khi git của checkpoint đang dừng trong hook, land nhận `held` với holder là pid của checkpoint. Chiều ngược lại: khi land đang giữ khóa, checkpoint bỏ lượt và không để lại gì trong index.
- RT2-2 ở main mutex: hook không còn giữ mutex bằng session id.
- Code của release này không bao giờ xoá record của giao thức lạ, và từ chối khi marker khác 1.

## Không đóng (nói rõ)

- **A1, reclaim v1:** dọn holder chết vẫn là đọc lại rồi unlink, còn khe giữa hai bước.
- **Cướp holder số còn sống khi quá ttl:** nay tính theo ttl của chính holder, nhưng holder sống mà bị dừng quá ttl vẫn bị lấy mất. B2 không được sửa bằng W1.
- **Commit tay không bị loại trừ (A5):** hook chỉ kiểm sớm một lần. Project không có hook fgOS thì không có cả bước kiểm đó.
- **`main-checkout-reset --confirm`** vẫn chạy `reset --hard` mà không giữ khóa.
- **promote-engine** vẫn đọc tip ngoài lock, và main lock vẫn bị lấy bên trong callback.
- **Hook `post-checkout` hoặc `git worktree add` chậm** vẫn nằm trong vùng claim (A14). Vùng claim chưa được thu hẹp (A7).
- **Writer bản cũ đang chạy** (hook hoặc release cũ chưa thay) vẫn có thể ghi record chuỗi mới. Node và Rust đọc record đó theo 20 s, nên `fgctl init` chỉ hết bị chặn hẳn khi mọi hook và release đã chuyển.
- **Đổi hành vi thư viện:** đọc ttl theo record áp cho cả merge-slot và dispatch ở mọi project. Dispatch có ttl ngắn không còn được giữ theo ttl dài của contender. Có test cho cả hai chiều.
- **Nâng marker lên 2:** release này chỉ từ chối. Flip thật chờ sửa B1/B2/B3.

## Tests

Chạy trong worktree bằng `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID node --test <files>`:

| Bộ | Kết quả |
|---|---|
| `test/e2e/main-checkout-activity-beacon.test.mjs` (mới, 9 ca) | 9/9 xanh. Cùng file chạy trên cây HEAD trước thay đổi (chỉ thêm module đèn để file nạp được): 0/9. Claim bị `expires in 2m59s`, land `acquired` giữa lúc checkpoint commit. |
| `test/runner/main-checkout-lock.test.mjs` + `test/runner/main-checkout-activity.test.mjs` | 92/92. 10 ca cũ mã hoá luật ttl theo contender được viết lại theo ttl của record. Ca mới: ttl cũ 20 s/180 s/4 h, ghi ttl, merge slot, dispatch ngắn và dài, giao thức lạ, marker. |
| Đợt 1: claim-port, events-jsonl-truncation-guard, concurrent-claim-eventlog-loss, merge-target-slot-multiprocess, lock-wait, lock, dispatch-reconciliation, promote-engine, main-checkout-reset-guard, cli claim/claim-2/return/approve-6/post-merge/post-merge-3/merge, direct/merge-gate | 358/363. 5 ca đỏ là các test release-theo-writer-id ở return, cleanup và compound. Sau khi viết lại theo đèn, `fgos-return` + `fgos-post-merge`: 75/75. |
| Đợt 2: dispatch, execution/run-herdr, worktree, setup checks và checks-doctor-config, merge, report/enduser-index, ba e2e hook cũ, e2e mới, hai file unit | 892/892 |
| Ba e2e hook có sẵn (main-checkout-lock-hook, worktree-commit, root-file-guard) | 44/44. Fixture copy thêm `main-checkout-activity.mjs`. Hai assertion đổi từ "hook ghi lock" sang "hook ghi đèn". |
| `cargo test -p fgos-distribution` | 64 + 8 + 15 xanh, gồm 4 test mới trong `lock::`. `rustfmt --check` sạch. |
| `test/rust-host/fgctl-init*.test.mjs` | **Chưa chạy được ở đây.** Fixture dựng release tree cần `node_modules` (`yaml`) mà worktree không có, và hook môi trường chặn em tạo nó. Các ca lock trong hai file này tương thích theo luật mới. Lead chạy cùng `npm test`. |

Không chạy full `npm test`.

## Sửa sau lượt tích hợp của Lead

Full `npm test` trên nhánh tích hợp có ba lỗi thật của W1':

1. `src/runner/main-checkout-activity.mjs` chưa có row trong [`docs/architecture-manifest.json`](../../docs/architecture-manifest.json). Đã thêm, layer `infra`, giống `main-checkout-lock.mjs`.
2. Checkpoint thuộc tầng `kernel` (`src/state/events-jsonl-truncation-guard.mjs`) đã import `src/runner/main-checkout-lock.mjs` thuộc tầng `infra`, tức là import ngược lên. Đã bỏ cạnh đó: kernel nhận `mainCheckoutWriter` từ caller. Tầng runner cung cấp `heldMainCheckoutWriter(pid)` (caller đã giữ khóa) và `acquiringMainCheckoutWriter(dir)` (đường merge slot). Không có writer thì checkpoint không commit, vì commit không có khóa sẽ đua với land. Test kiến trúc giữ nguyên.
3. Hai e2e đỏ trong suite: nguyên nhân là `scripts/run-tests.mjs` đặt `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` cho cả suite. Checkpoint bị tắt ngay trong process (claim không commit) và trong env mà process con thừa hưởng (process con không bao giờ tới hook đang dừng, nên chờ file `paused` tới timeout). Đã tái hiện: bản test cũ chạy với `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` cho 7/9, đúng hai ca đó đỏ. Sửa trong test: mọi process con được spawn bỏ biến này khỏi env; claim chạy checkpoint thì xoá biến tạm thời quanh lời gọi rồi khôi phục. Hàm chờ dừng ngay, kèm stderr, nếu process con thoát trước. Không thêm sleep, không có nhánh production dành cho test. Ca "checkpoint bị bỏ lượt khi land giữ khóa" trước đây xanh mà không chứng minh gì, vì checkpoint vốn đã bị tắt; nay nó kiểm thật.

## Sửa theo review độc lập (gpt-6-astra, "land sau sửa nhỏ")

Báo cáo gốc: `.fgos/assignments/unit-run-1792073730919-8c678aa1/producer/1/runs/01/outbox/report-1.md`.

- **W1 (high): checkpoint tái nhập hold của operation khác cùng process.** Writer tự acquire của checkpoint (`acquiringMainCheckoutWriter`) dùng `allowSelfRecognition: false`. Holder cùng pid, chẳng hạn một merge đang chờ verify, được coi là holder khác: checkpoint bỏ lượt, không chạy bên trong hold đó và không nhả nó. Caller đã giữ khóa vẫn dùng `heldMainCheckoutWriter`. Test: một hold cùng process, writer không chạy giao dịch và record không đổi.
- **W2 (high): marker chỉ được kiểm sau acquire.** Nay là một quyết định marker chung. `acquireMainCheckoutLock` kiểm trước khi ghi gì (vẫn kiểm lại sau acquire). `inspectMainCheckoutLock` kiểm trước nhánh "không có file", nên hook và `lock-status` không còn thấy `free`. `forceReclaimAmbiguousLock` kiểm trước mọi sửa. `fgos unlock` từ chối và không báo `cleared:true`. Rust `check_main_checkout_lock` đọc marker trước khi kiểm file. Test: marker-only (`{writer:2}`, không phải JSON, `{writer:"future"}`) cho acquire và inspect; marker kèm lock hỏng cho reclaim; e2e cho hook, `lock-status` và `unlock` (CLI thật); Rust `test_marker_only_state_is_refused_without_a_lock_file`.
- **W3 (high): release/renew phá record `v` có đủ `pid`/`ts`.** `parseLockContent` từ chối mọi object mang `v`, nên mọi lần đọc và đọc lại của release/renew dừng trước khi kiểm identity. `releaseMainCheckoutLock` (xoá vô điều kiện, dùng ở `unlock`) không xoá record `v`. Test: record lai `{v:2, pid, ts, ttlMs, token}` qua acquire, inspect, release-if-own, renew, release vô điều kiện, closure của hold cũ, và self-recognition; nội dung giữ nguyên byte.

Kiểm sau hai vòng sửa, với `env -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` (cùng điều kiện suite), một lượt gồm toàn bộ `test/e2e/*.test.mjs`, `test/architecture.test.mjs`, truncation-guard, main-checkout-lock, main-checkout-activity, claim-port, merge-target-slot-multiprocess, concurrent-claim-eventlog-loss, merge, promote-engine, dispatch, lock-wait và CLI claim/claim-2/return/post-merge/merge/approve-6: 977 test, 972 pass, 0 fail, 5 skip. E2E đèn mới có 10 ca. `cargo test -p fgos-distribution`: 65 + 8 + 15 xanh.

Chưa đổi theo review: `FGOS_MAIN_LOCK_HOLDER_PID` vẫn không xác thực quan hệ cha-con. Review ghi nhận đây là hạn chế có từ trước, để tới W2c (grant v2), không tính là regression.
