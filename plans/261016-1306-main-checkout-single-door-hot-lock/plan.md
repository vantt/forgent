---
title: "4.3 Main checkout một cửa + mutex nóng state"
description: "Main mutex sang kernel lock với một cửa withMainCheckout và checkpoint nhận handle, mượn qua fd thay FGOS_MAIN_LOCK_HOLDER_PID, worktree-admin, gộp events.lock + claims.lock thành state có stateTx, exec ra khỏi vùng găng nóng, kiểm trần và thu hẹp claim trong một commit; cutover dừng-toàn-bộ"
status: completed
priority: P1
effort: 50h
branch: worktree-agent-ae86665b911b82fc1
tags: [holder-lock, main-checkout, hot-lock, state, cutover]
created: 2026-10-16
---

# Plan 4.3: Main checkout một cửa + mutex nóng `state`

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §11 entry 4.3, §6.4 mượn quyền, §6.5 `LockScope` + bảng hạng, §6.6 đường nóng (bất biến 1–5), §6.7 fencing / `fgos lock fence`, §6.8 bảng hình dạng, §6.10 main checkout, §5.1 bảng phán (gồm N4). Phản biện [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md): **M4** (không vân tay → tắt mượn; một đường commit, một hook; `lock-borrow-vectors` của 4.2 đỏ = FAIL) áp nguyên; **M5** (lịch trace → cảnh báo → ném cho gác exec) **bị thay** bởi quyết định của anh (dưới).
- **Xây trên 4.2** ([plan](../261016-1104-holder-lock-kernel-lock-foundation/plan.md)): facade `src/holder-lock/` (`acquire/acquireSync/probe/runBorrowed/LockScope`, ném `lock-order-violation` ngay), crate + route `lock-fd`, registry (các dòng owner `4.3` đã có), `placeFences`/`checkStopped`, check doctor `lock-holders`/`lock-fences`/`lock-borrow-vectors`, Node leaf `judge(tuple)` trong `process-identity.mjs` (4.2 P01). **Xây trên 4.4a** ([plan](../261016-1306-fgctl-rust-callers-on-holder-lock/plan.md)): `fgctl` mới chịu được tombstone `main-checkout.lock`.
- **Quyết định của anh 2026-10-16 áp vào đây:**
  - Một người dùng, không tương thích ngược; cutover dừng-toàn-bộ, **xoá đường v1 trong cùng phase**; event log và claim file cũ vẫn đọc bằng đường đọc duy nhất (định dạng dữ liệu không đổi, chỉ đổi lock).
  - **Vi phạm thứ tự lock ném ngay.** Áp cùng lý do cho gác `exec-under-hot-lock` và `hot-lock-reentry`: **ném ngay từ release đầu**, không lịch trace → cảnh báo → ném. Quyết định này **thay** lịch M5 của kongming và r6 §6.6 điểm 2/2b. Bù rủi ro M5 ("chỗ exec thứ tư chưa biết") bằng: full `npm test` + dogfood một ngày trên nhánh tích hợp trước landing; chỗ nào ném thì sửa ngay trong phase gây ra; vẫn là hành vi production, không cờ tắt.
  - `--resume` tường minh chỉ sau khi controller chết (không ảnh hưởng plan này). Không work item. Song song hoá.
- Impact-analysis: GitNexus có mặt; `bin/fgos.mjs` không có symbol được index (tsk-38h), nên mọi trích dẫn trong phase là grep có số dòng; executor chạy `impact` trên symbol ngoài `bin/fgos.mjs` trước khi sửa và báo blast radius.
- Component boundary: **có đổi** (main checkout thành một cửa của holder-lock; state hot-mutex thuộc state store). P09 cập nhật [`component-boundary.md`](../../docs/platform/component-boundary.md).

> **QUYẾT ĐỊNH CỦA ANH 2026-10-17 10:55 — thay mọi ghi chú tạm giữ trước đây.**
> - **Phần khoá repo làm theo plan cũ, bắt đầu khi 4.2 land:** P03 (main door, checkpoint nhận handle, mượn fd, hook), P05 (merge/land/promote/sync-root/approve dưới slot), P06 (`worktree-admin`), P07, P08, cùng phần tương ứng của P00/P09/P10. Ba khoá (main checkout 50, merge target slot 20, worktree-admin 40) và luật thứ tự, mượn fd, hàng rào, check doctor sẽ được component Git (Rust, làm sau) **dùng lại nguyên vẹn**; component Git chỉ chuyển chính sách "thao tác nào lấy khoá nào" vào nó và xoá facade Node `repo-locks.mjs` cùng các chỗ bọc khoá trong các file merge/worktree mà nó thay. Không thiết kế lại khoá.
> - **Phần state tạm giữ, chờ hội đồng event store (đang chạy):** phần state của P00, P01 (hot-lock core), P02 (gộp claims vào `state`), P04. Lý do: luật L3 đã chạm ngưỡng xem lại (nhiều agent ghi đồng thời) và hình dạng event store quyết định `events.lock`/`claims.lock`/`stateTx` còn cần ở dạng nào. Khi có kết luận, cắt lại các phase này **một lần**, và sắp lại thứ tự để P01 + P02 merge được vào main sớm mà không để nhánh tích hợp đỏ (plan 6.2 P09 cần P01 + P02 đã land).
> - **RÀO CHẮN BẮT BUỘC cho phần khoá repo (hội đồng event store `wf-run-1792209767959-7424ddf9`, finding F10; anh duyệt 2026-10-17 12:09).** Phần khoá repo không được chốt hộ thiết kế event store:
>   1. Checkpoint `.fgos` trong P03 là **adapter tuỳ chọn, tháo rời được**, gắn vào main door từ bên ngoài; lõi khoá (main mutex, merge slot, worktree-admin, mượn fd, hook) không import hay biết gì về event log, shard, `events.lock` hay `stateTx`.
>   2. Toàn bộ test của P03, P05, P06, P07, P08 phải **pass khi adapter checkpoint là adapter rỗng** (null adapter).
>   3. Bằng chứng git ở P09/P10 **không dựa vào** `events.jsonl`, shard `.fgos/events/`, hot-lock hay `stateTx`.
>   4. Không đưa vào P00 bảng kê `stateTx` hay call site của state, không đổi `merge=union`, `.gitattributes` hay luật strip `.fgos` trong phần này: các thứ đó chờ kết luận event store.
> - Bối cảnh: [roadmap](../reports/roadmap-261016-2212-fgos-cook-and-git-component.md), [danh mục bài học git](../reports/research-261017-1032-git-lessons-catalogue.md), [probe event store](../reports/investigation-261017-1027-fgos-event-store-git-coupling.md).

> **CẮT LẠI 2026-10-17 18:50 (lane 4.3, anh duyệt "chọn b").** Thay đoạn "Phần state tạm giữ" ở trên.
> - **Phần khoá repo đã land** 10-17 18:28 trên máy owner: main `56f87bf5b`, [báo cáo landing](../reports/landing-261017-1827-main-door-repo-lock-stop-everything-landing.md). Máy thứ hai land riêng.
> - **Hội đồng event store đã xong:** anh ký D-ADR0055 ([spec](../../docs/platform/event-store/spec.md) §13, §17, §20; [brief cho lane này](../reports/brief-261017-1823-main-door-state-recut-after-event-store.md)). `withStateTx` trên hot-mutex `state` chính là cổng Work mà event store dựng lên trên, nên P01, P02 giữ nguyên như đã viết và không phụ thuộc chỗ event được lưu. Rào F10 điểm 4 vẫn giữ: không đổi định dạng event, `merge=union`, `.gitattributes`, luật strip `.fgos` (thuộc cutover event store, spec §18).
> - **Wave S (phần state), chạy từ main**, nhánh tích hợp `main-door-state/integration` (worktree `.claude/worktrees/ms-integration`), phase `main-door-state/sNN-<slug>` (worktree `.claude/worktrees/ms-sNN`), lead Sonnet, một lead một lúc:
>   1. **S1** = phần state của P00 (contract `hot-lock.v1.json` + test contract) + [P01](phase-01-hot-lock-core.md).
>   2. **S2** = [P02](phase-02-state-cutover-claims-merge.md). Giữ "một lần tra main checkout cho mỗi lần đọc" của `a4b1278ae` (`readClaims`; test đếm spawn trong `test/state/runtime-coordination.test.mjs`).
>   3. **S3** = [P04](phase-04-claim-capacity-and-narrow-claim.md) **đủ cả hai nửa, một commit** (kiểm trần trong `state` + main chỉ giữ quanh checkpoint). Không tách như spec event store §20 gợi ý: kiểm trần trong `state` mà main còn tuần tự hoá mọi claim thì dư; phần thu hẹp là chỗ bớt thời gian chờ `main-checkout.lock` mà spec §17 gán cho P04. Cutover event store sau này chỉ xoá lời gọi checkpoint. P04 không thêm đường lock nên, nếu trễ, được cắt ra và land bằng merge + activate thường, không cần dừng toàn bộ.
>   4. **S4** = phần state của [P09](phase-09-doctor-setup-fences-docs-changelog.md): check `lock-record-unreadable`, hàng rào `events.lock`, `runtime/claims.lock`, `porting/events.lock`, docs, CHANGELOG.
>   5. **S5** = phần A của [P10](phase-10-integration-dogfood-landing.md). **Phần B (một ngày dogfood) thay bằng** (anh chọn phương án b, 18:46): full `npm test` (gác exec cũng ném trong test) + smoke trên clone đủ mọi verb ghi state (`take`, `pick`, `return`, `approve`, `move`, `add`, `edit`, workflow runner, porting) + 1–2 unit `fgos run` thật trên clone. Mọi `exec-under-hot-lock`, `hot-lock-reentry`, `lock-order-violation` được sửa trong phase sở hữu file.
>   6. Landing dừng-toàn-bộ (phần C của P10, cắt cho phần state), anh chọn giờ; máy thứ hai land riêng.
> - **Windows:** hot record trên Windows thiếu `/proc`, `judge` ra `unknown`, nên S1 **fail closed** (không dọn; thoát bằng `fgos lock fence state`), đúng quyết định "Windows báo unsupported, không lùi về đường cũ". Phán holder chết trên Windows chuyển sang [4.4b](../261017-1256-windows-lockfileex-driver-and-macos-handoff/plan.md) P05 ("các nhánh Windows còn lại").
> - **Tiêu chí 2, 3, 5 và phần `withClaimsLock`/`withEventsLock` của tiêu chí 4** thuộc wave S. Plan 4.3 đóng khi wave S land.
> - **Mở khoá sau wave S:** 6.2 P09 (cần P01 + P02: bản ghi nóng có `pidNs`) và phase chuyển Work của event store.

## Phạm vi

Trong 4.3: main mutex v3 + `withMainCheckout(scope, purpose, fn)` + `checkpointMainFgos(mainHandle)`; merge slot v3; land/promote/sync-root/approve dưới slot bên ngoài; mượn qua fd (`runBorrowed`) thay `FGOS_MAIN_LOCK_HOLDER_PID`; hook dùng `--borrowed-check` rồi `probe`; `worktree-admin` quanh `git worktree add`; gộp `events.lock` + `claims.lock` thành hot-mutex `state` với `stateTx` thu hồi được, record nóng tuple đầy đủ, dọn holder chết dưới kernel lock `state.reclaim`, cùng cơ chế cho `porting-events`; gác `child_process` + re-entry ném ngay; HEAD, gốc main checkout, snapshot bằng chứng plan lấy trước lock; kiểm trần worker trong `state` ngay trước claim + thu hẹp claim (main mutex chỉ quanh checkpoint) **trong một commit**; `fgos lock fence` thay `unlock`, `lock-status` đọc v3; `main-checkout-reset` trong mutex; xoá phần v1 còn lại của `lock.rs` (`fgctl`); doctor `lock-record-unreadable`; hàng rào; landing.

Ngoài: lock attempt, supervisor (6.2); hot-mutex sang Rust (điều kiện kết thúc r6 §6.6, việc sau); dispatch cwd phạm vi máy (hoãn có tên r6 §11).

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Cửa main checkout ở module mới `src/runner/repo-locks.mjs`: `withMainCheckout`, `checkpointMainFgos`, `withMergeTargetSlot` (dời từ [`merge.mjs:770`](../../src/runner/merge.mjs)), `withWorktreeAdmin`. Xoá phần main của [`main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs); giữ file chỉ khi còn export không phải lock (`formatLockDurationMs` nếu còn người dùng), không thì xoá file | Một cửa cho ba lock repo của runner; P03 tạo, các phase caller chỉ import |
| D2 | Hot-mutex ở module mới `src/state/hot-lock.mjs`; `withEventsLock` đổi tên `withStateTx(fgosDir, fn, {resource})`, `resource ∈ {state, porting-events}` | Tên nói đúng việc (một transaction trên state); porting dùng cùng cơ chế, tài nguyên khác (registry 4.2 đã có hai dòng) |
| D3 | `releaseClaim`, `acquireClaim`, `readClaim(s)` giữ chữ ký công khai, tự mở `withStateTx` khi gọi ngoài; bản trong transaction là `*Tx(tx, …)` | Hai chỗ gọi ở `bin/fgos.mjs` (`:4167`, `:4181`, `unclaim`) không phải đổi, tránh đụng file của P07 |
| D4 | Merge slot tombstone: mọi `refs/heads/*` có lúc cutover (`git for-each-ref`) | Slot theo ref; liệt kê một lần là rẻ; dừng-toàn-bộ đã chặn ref mới của code cũ |
| D5 | `withLockRetry` ([`lock-wait.mjs:47`](../../src/runner/lock-wait.mjs)) giữ tên và cờ `--wait`/`--no-wait`, thân đổi sang chờ của facade (`acquire({waitMs})`); bỏ ETA/TTL trong thông báo | Kernel lock chờ thật, không cần đoán TTL; 7 chỗ gọi không đổi |
| D6 | Hook ([`.githooks/pre-commit`](../../.githooks/pre-commit)): (1) env `FGOS_LOCK_FD=main-checkout:3` + `--borrowed-check` qua → bỏ qua beacon và lock; (2) không thì `probe(main-checkout)` một lần, `held` → từ chối; beacon W1' giữ nguyên | r6 §6.4 điểm 2, §6.10; kongming M4: một hook, không chế độ tắt mượn |
| D7 | `fgos lock fence <name>` thay `fgos unlock` (xoá verb `unlock`); skill `fgos-unlock` đổi tên `fgos-lock-fence`; `lock-status` giữ tên verb, đọc v3 cho mọi lock trong registry | r6 §6.7, §11/4.3; `lock-status` đã là verb quen; không thêm verb nào khác |
| D8 | `worktree-admin` chỉ bọc `git worktree add` (9 chỗ), không bọc `remove`/`prune` | Đúng phạm vi bản 2 §8.6 mà r6 giữ; `remove`/`prune` không có sự cố đã ghi |

## Phase và phụ thuộc

Tiền đề: **4.2 đã land** (bắt đầu code). **4.4a đã activate ở ba workspace** (chỉ chặn P08 và landing P10).

| Phase | Nội dung | Phụ thuộc (nghiệm thu) | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-and-call-site-inventory.md) | Contract hot-lock, registry chi tiết, bảng call site | 4.2 landed | 0 | 3 |
| [01](phase-01-hot-lock-core.md) | `hot-lock.mjs`: fast path, reclaim dưới kernel lock, record tuple, `stateTx` thu hồi, gác exec + re-entry ném ngay | 00 | 1 | 7 |
| [02](phase-02-state-cutover-claims-merge.md) | Gộp claims vào `state`; mọi caller sang `withStateTx`; exec ra khỏi vùng găng (store, runtime-coordination) | 00; 01 | 2 | 7 |
| [03](phase-03-main-checkout-door-and-hook.md) | `repo-locks.mjs`, checkpoint nhận handle, mượn qua fd, hook, xoá v1 main | 00 | 1 | 7 |
| [04](phase-04-claim-capacity-and-narrow-claim.md) | Claim: kiểm trần trong `state` + thu hẹp main **một commit** | 01, 02, 03 | 3 | 4 |
| [05](phase-05-merge-land-promote-under-slot.md) | Merge/land/promote/sync-root/approve dưới slot; `lock-wait` | 03 | 2 | 6 |
| [06](phase-06-worktree-admin-callers.md) | `worktree-admin` cho `git worktree add` (trừ merge.mjs, bin) | 03 | 2 | 2 |
| [07](phase-07-verbs-lock-fence-status-reset.md) | `bin/fgos.mjs`: `lock fence`, `lock-status`, bỏ `unlock`, reset trong mutex, take/pick; skill | 03 | 2 | 4 |
| [08](phase-08-fgctl-drop-v1-main-read.md) | `lock.rs`: xoá đường đọc v1 + marker | 4.4a activated; 03 (đường v3) | 2 | 1 |
| [09](phase-09-doctor-setup-fences-docs-changelog.md) | Doctor, setup, hàng rào, spec, boundary, CHANGELOG | 00; docs từ wave 1; check sau 01–03 | 1–3 | 5 |
| [10](phase-10-integration-dogfood-landing.md) | Tích hợp, full test, dogfood, dừng-toàn-bộ, activate, hàng rào | 00–09; 4.4a activated | 4 | 4 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P03 ∥ P09(docs)
wave 2: P02(sau P01) ∥ P05 ∥ P06 ∥ P07 ∥ P08   (P05–P08 sau P03)
wave 3: P04 (một commit: trần + thu hẹp)  ∥ P09(check)
wave 4: P10 (Lead, dogfood) — cần 4.4a activated
```

Nhánh tích hợp `main-door/integration` (worktree `.claude/worktrees/md-integration`); phase `main-door/pNN-<slug>`, worktree `.claude/worktrees/md-pNN`, từ đỉnh nhánh tích hợp đầu wave. Thứ tự merge: P00 → P01 → P03 → P09 (docs) → P02 → P05 → P06 → P07 → P08 → P04 → P09 (check). Giữa P01 và P04, nhánh tích hợp **được phép** đỏ ở test claim (gác exec ném ở `currentHead` trong claim cho tới P04); full suite chỉ bắt buộc từ sau P04. Chủ file dùng chung: registry, contract → P00; `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, docs → P09; `bin/fgos.mjs`, `src/cli/command-registry.mjs` → P07; `src/runner/merge.mjs` → P05; `src/runner/claim-port.mjs` → P04. Không phase nào sửa `test/test-ownership.mjs`.

**Quan hệ với plan khác:** đổi tên trong `fences.mjs`/`registry.mjs` của 4.2 đi qua P09. 4.4a chạm `lock.rs` trước; P08 tạo nhánh từ main đã có 4.4a. 6.5 chạm `registrations.mjs` và `CHANGELOG.md`: ai land sau rebase (xung đột chỉ ở danh sách thêm vào).

## Data flow

```text
claim (fgos take/pick)                             merge / land
  prefetch ngoài lock: HEAD, mainFgosDir,            withMergeTargetSlot(scope, ref)          [slot 20]
    writer id, snapshot bằng chứng plan                ├─ merge + verify trong worktree tạm
  withMainCheckout(scope,'checkpoint') [main 50]       ├─ withMainCheckout(scope,'checkpoint') [50]
    └─ checkpointMainFgos(h) ─ runBorrowed(h, git commit)  │    └─ checkpointMainFgos(h)
  withStateTx(state) [60]                               └─ withMainCheckout(scope,'land') [50]
    ├─ đọc view + claims (tx)                                 update-ref CAS + read-tree
    ├─ kiểm trần worker   ← cùng vùng găng với claim
    └─ acquireClaimTx(tx, {headAtTake = HEAD đã lấy})
  withWorktreeAdmin(scope) [40] ─ git worktree add (từ SHA đã ghi trong claim)
hook pre-commit ở main: FGOS_LOCK_FD + borrowed-check → borrower; không thì probe(main) một lần
```

## Tiêu chí xong

1. Đa process trên code thật: hai land loại trừ; checkpoint dưới slot vs land; hook từ chối khi land giữ main; commit tay ↔ land ở khe `update-ref`/`read-tree` (có/không hook); staged-but-uncommitted khi land `read-tree` (r6 §6.10); mượn: hai con cùng env → một borrower, anh em bị từ chối; cha chết khi git chạy → lock giữ tới khi git thoát; hai item tranh slot worker cuối → đúng một claim.
2. Hot lock: lịch A1 → một holder; stress 8 process có SIGKILL trong vùng găng → 0 vi phạm; zombie holder bị coi là chết; record không đọc được không bao giờ bị dọn; ghi qua `stateTx` sau release (continuation async) → ném; re-entry → `hot-lock-reentry` ngay (không chờ 5 s).
3. Gác exec: test gọi lại đúng ba chỗ cũ (`currentHead` trong claim, `getMainFgosDir` trong `acquireClaim`, `assertPlanEvidence` trong `moveWork`) với code trước P02/P04 → `exec-under-hot-lock`; với code sau → không ném. Import có tên `execFileSync` cũng bị gác (`syncBuiltinESMExports`).
4. `rg` trong `src/ bin/ scripts/ .githooks/` không còn: `HOLDER_PID_ENV_VAR`, `FGOS_MAIN_LOCK_HOLDER_PID`, `allowSelfRecognition`, `forceReclaimAmbiguousLock`, `withClaimsLock`, `withEventsLock`, `acquireMainCheckoutLock`, `renewMainCheckoutLockIfOwn`, `heldMainCheckoutWriter`, `acquiringMainCheckoutWriter`, `claims.lock` (trừ registry v1Path); `packages/distribution/rust/src/lock.rs` không còn `read_to_string` file lock v1.
5. Benchmark round thật (`fgos take` → `return` trên repo tạm, 50 lần): fast path `state` không chậm hơn hôm nay quá 10% (p50).
6. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`; dogfood một ngày không ném `exec-under-hot-lock`/`lock-order-violation` chưa sửa; sau landing doctor xanh ở ba workspace.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Chỗ exec thứ tư trong vùng găng nóng ném ở luồng thật (M5) | TB × Cao | Gác bọc mọi `child_process` export; full suite + dogfood một ngày trước landing; sửa trong phase gây ra; rollback P10 |
| Thu hẹp claim mà kiểm trần còn ngoài `state` → vượt trần | Cao nếu tách × TB | P04 là **một** commit; test hai item tranh slot cuối |
| Description main rò qua hook/gc → main bị giữ sau commit | Thấp × Cao | `runBorrowed` tắt `gc.auto`/`maintenance.auto`; `lock-borrow-vectors` (4.2) chặn activate; `lock-holders` |
| Thứ tự lock sai ở merge (slot → main → worktree-admin) ném ở luồng thật | TB × TB | Bảng hạng: `worktree-admin` 40 < main 50, nên `git worktree add` phải ra ngoài main; P05 giữ `merge.mjs:1807` (worktree tạm của CAS land) ngoài main như hôm nay và test thứ tự slot → worktree-admin → main |
| `fgctl` cũ gặp tombstone main | Thấp × TB | Điều kiện landing: 4.4a activated (P10 kiểm `which -a fgctl`) |

## Rollback

Trước bước đặt hàng rào ở P10: revert merge trên main, activate release trước. Sau: dừng mọi writer; revert; activate release trước; `rm -r` tombstone theo `fenceStatus`; file nóng v3 (`.fgos/locks/state.hot`) chỉ là lock, xoá được. Event log và claim file không đổi định dạng nên không cần chuyển ngược.

## Câu hỏi mở cho anh

Không còn câu hỏi chặn. Một điểm để anh biết: quyết định "ném ngay" thay lịch M5 của kongming; cái giá là một ngày dogfood bắt buộc trước landing (P10 bước B).
