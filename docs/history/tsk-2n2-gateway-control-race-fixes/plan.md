# plan.md — tsk-2n2: fix real gaps found reviewing tsk-31v

Mode: **standard**.

## Approach

Found by re-reading `src/runner/gateway-control.mjs` critically after
tsk-31v shipped, not guessed:

1. **No lock around `start`/`stop`'s read-check-write sequence.**
   `session.mjs` (the module `gateway-control.mjs` claims to model
   itself on) guards its registry with `acquireSessionsLock`;
   `gateway-control.mjs` had none. Two concurrent `fgos gateway start`
   calls could both pass the "not running" check before either wrote the
   registry, and both appended to the SAME fixed `.fgos/logs/
   gateway.log` — one invocation's "listening on" poll could see the
   OTHER's process line and record the wrong pid.
   - Fix: `.fgos/gateway.lock`, PID-liveness-based staleness (no TTL —
     ported session.mjs's own link-atomic-create algorithm, since a cold
     `cargo build --release` can legitimately run 60-90s and a TTL sized
     for that is the exact "expires mid-operation" flake class this repo
     has already hit elsewhere). `start`/`stop` both acquire it for their
     whole critical section.
   - Fix (independent, kept even with the lock): each `start` gets a
     unique log path (`gateway-<timestamp>-<pid>.log`), so no two
     attempts can ever share one file's content.
2. **`gatewayStatus`'s `fetch()` had no timeout.** A hung-but-alive
   gateway made `status` hang forever instead of reporting
   `reachable:false` promptly. Fixed with `AbortSignal.timeout(3000)`.
3. **`execFileSync`'s cargo build call used the 1MB default `maxBuffer`.**
   Bumped to 32MB — a verbose cold build's combined stdout/stderr can
   exceed 1MB, which would throw an unhelpful ENOBUFS instead of a real
   build error.
4. **`stopGateway` cleared the registry immediately after SIGTERM**,
   without confirming the process actually died — a `status` call right
   after `stop` could briefly still report `running:true`. Fixed: wait up
   to `STOP_TIMEOUT_MS` for a graceful exit, escalate to SIGKILL once,
   wait a SECOND full window for that to take effect, then clear the
   registry.

**A real bug was caught building fix #4's own test**, not just in the
original code: the first draft of the escalation logic checked liveness
only ONCE, immediately after sending SIGKILL, and gave up right away if
the process had not been reaped that exact instant — treating a real (if
brief) kernel delay as permanent failure. Rewritten so both the graceful
and forced phases share one `waitUntilDeadOrDeadline` helper, each with
its own real wait window.

**Files touched:** `src/runner/gateway-control.mjs`,
`test/runner/gateway-control.test.mjs`.

## Risk map

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| Lock loại trừ thật giữa 2 process khác nhau | Thấp — đã chứng minh cross-process thật | Test thật: spawn 1 process khác giữ lock, process hiện tại thử acquire timeout ra đúng lỗi kèm đúng pid người giữ; sau khi holder tự release, acquire lại thành công |
| Escalate SIGTERM→SIGKILL không bỏ cuộc sớm | Thấp — bug thật bắt được khi viết chính test này | Test thật: process con có handler nuốt SIGTERM thật, đo thời gian `stopGateway` chờ đủ ~5s rồi escalate, xác nhận chết thật sau đó |
| `status` không treo vô hạn khi gateway treo | Thấp | `AbortSignal.timeout` — test cũ (port không nghe) đã phủ nhánh catch |
| Toàn bộ pipeline thật vẫn hoạt động sau fix | Thấp | Chạy tay thật trên chính repo: start (log path có timestamp/pid riêng) → status → refuse start-khi-đang-chạy → stop (nhanh, gateway thật phản hồi SIGTERM đúng) → status → port trống thật |

## Verify

```
node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs test/architecture.test.mjs
```

`test/architecture.test.mjs` thêm vào lần này vì tsk-31v từng bị `blocked`
đúng ở check này (thiếu manifest row) — chạy lại để chắc không tái phạm,
không có file `.mjs` mới nào lần fix này nên không cần sửa manifest thêm.

## Decide the split

Một mảnh — cả 4 fix đều sửa cùng 1 module, cùng phục vụ đúng một tính
chất quan sát được ("gateway lifecycle CLI an toàn khi có nhiều agent
dùng đồng thời"), tách nhỏ hơn không tự đứng được.
