# Review: `docs/specs/confinement-authority.md` — đủ use-case chưa, đủ đơn giản chưa

Ngày: 2026-09-10. Đối chiếu spec (1185 dòng) với `src/runner/dispatch/{cli,transport,config,resolve,herdr-round}.mjs`, `assignment.mjs`, và 3 executor bwrap trong `.fgos/config.json`.

## Kết luận

- **Shape contract**: dự trù tốt 3 nhóm use case (review-only, workspace-write, container/remote/network). Mở rộng được không đổi nghĩa cũ. Giữ.
- **Chưa đầy đủ**: 7 lỗ hổng khi đối chiếu code thật (mục A). Nặng nhất: use case workspace-write (mission #1) không có policy built-in và không có rule resolve worktree.
- **Chưa đủ đơn giản**: contract trộn *shape* (rẻ, reserve trước) với *obligation* (đắt, phải thoả trước khi ship). Default S4 gánh nhiều obligation chưa có use case (mục B).
- **Dùng**: config user-facing đã gọn (3 dòng capability + 1 dòng executor + registry do setup tự tạo). Rào cản dùng thật nằm ở A1 và B3.

## A. Contract chưa dự trù use-case

| # | Lỗ hổng | Bằng chứng | Đề xuất |
|---|---|---|---|
| A1 | Workspace-write không có policy built-in; `workspace` resource không có rule resolve trên worktree (gitdir `.git/worktrees/<name>` nằm ở main checkout → cần grant thứ hai). Strict mode sẽ đẩy `execute`/`fgos-coding-implement` vào `unconfined` vĩnh viễn | `capabilities.execute.prefer: claude`; §9 chỉ có `host-write-denied` | Thêm built-in `workspace-write` (grants: workspace rw, run-output w, executor-credentials r) + rule resolve `workspace` = cwd + gitdir khi cwd là worktree |
| A2 | Resource → host path không có owner. Chỉ `run-output` có rule. `executor-credentials` (codex `~/.codex/auth.json`, claude `~/.claude/...`), `private-home`, `workspace` không biết resolve từ đâu | §6.3 "Authority resolve" nhưng không nói nguồn; argv hiện hardcode `/home/vantt/.codex/auth.json` | Thêm port `ResourceResolverV1`: `run-output`←dispatch, `workspace`←context, `private-home`←backend, `executor-credentials`←provider normalizer khai host path |
| A3 | Adapter locus: `http` adapter không có process để bwrap; in-process (`decide` → Agent tool) không đi qua cửa nào | `EXECUTOR_ADAPTERS = {cli-spawn, http, herdr-spawn}` | Adapter metadata khai `locus: local-process \| remote`; driver assess dùng locus. Ghi rõ in-process nằm ngoài Authority, attestation không tồn tại (không phải `unconfined`) |
| A4 | Policy anchor tại seam 1 (`spawnWorker`) không nói rõ: capability key = tên stage-skill | `executorIdForWork` → `skillForStage`; `resolve.mjs:292` tra `cfg.capabilities[skillName].prefer` | Một câu: "capability = mọi key resolver tra trong `runner.capabilities`, gồm tên stage-skill"; strict mode = key được tra tới phải có entry |
| A5 | Invariant legacy `permissionMode: bypass ⇒ full confinement` chưa dịch sang policy | `config.mjs:779` | "bypass hợp lệ khi effective `hostWrite: deny`" |
| A6 | Scratch tmpfs (`--tmpfs /tmp`) không phải host write, không phải grant; threat model thiếu khái niệm → probe author đánh dấu sai | codex-bwrap argv | Thêm "backend-private scratch: ngoài phạm vi hostWrite, không cần grant" vào §4 |
| A7 | Strict mode nhắc 4 lần, chưa định nghĩa cờ, default, doctor check | §6.2, §8.1, §9 | Một mục: `runner.confinement.strict: boolean` (default false tới S2), doctor `confinement-policies-declared` |

## B. Contract quá nặng cho default — đơn giản hoá

| # | Nặng ở đâu | Vì sao không cần cho default | Đề xuất |
|---|---|---|---|
| B1 | `home: private` nằm trong `host-write-denied` | Dưới `--ro-bind / /` host home đã không ghi được; private home là *readiness* của codex, không phải protection. Ép lên claude/agy-bwrap làm mất `~/.claude` (OAuth creds, plugins) | Bỏ `home: private` khỏi policy default; provider normalizer khai need `private-home`. Policy default = 1 control có nghĩa + 3 grant = đúng argv hôm nay |
| B2 | Invocation override + partial-order + networkFilter narrowing (~45 dòng rule) | Không use case; F-b là bài học *bỏ* precedence của invocation. §6.10 đã cho phép thêm optional field sau | Cắt khỏi v1. "Muốn chặt hơn → policy id/capability khác". Giữ `NetworkFilterV1` shape |
| B3 | Proof: fingerprint 8 thành phần, "thiếu 1 = không current", required refuse tới khi doctor chạy lại | Mỗi lần upgrade provider CLI, mọi required dispatch refuse cho tới khi người quay lại chạy doctor → trái ưu tiên #2 | `proofProfile` quyết định thành phần bắt buộc; `local-bwrap-v1` = policyDigest + driverVersion + bwrap/kernel + backendConfigDigest. Backend local được tự chạy lại probe khi stale trước spawn |
| B4 | §8.6 journal/lease/PID-reuse/remote-liveness là nghĩa vụ chung của Authority | bwrap local: resource tạm chết cùng process tree; `finally` + startup reaper theo dispatchId là đủ | Lease/liveness là nghĩa vụ của driver `remote`/`container` (profile), không phải Authority chung |
| B5 | §6.9 `refused` trả về value → đổi return shape 2 seam, mọi caller học `status` | Caller hiện xử lý `DispatchError` (`dispatch-in-flight`...) | Union giữ nội bộ Authority; facade throw `DispatchError('confinement-*')` kèm attestation trong details; return của `spawnWorker` chỉ *thêm* `attestation` |
| B6 | `session`/`workspace` là "control" driver phải cover | Là dispatch-context/hygiene, không phải OS protection | Ghi là "context requirement", Authority tự check, driver không assess |

## C. Mức đơn giản sau khi áp dụng

Default v1 còn: 1 driver bwrap, 2 built-in policy (`host-write-denied`, `workspace-write`), 1 resource resolver port, 1 proof profile local. Contract giữ nguyên mọi shape cho container/remote/network; obligation gắn theo profile.

## Unresolved

- A1: `workspace-write` có cần `hostWrite: deny` ngoài workspace không, hay chấp nhận `allow` (= bwrap không cần)? Quyết định sản phẩm.
- B3: probe tự chạy lại trước spawn có được coi "độc lập" theo §6.7 không, hay phải là process doctor riêng?
