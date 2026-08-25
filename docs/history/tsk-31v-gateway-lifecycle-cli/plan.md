# plan.md — tsk-31v: `fgos gateway start|stop|status`

Mode: **standard** (`fgos submit`'s own auto-classify).

## Approach

1. **New module `src/runner/gateway-control.mjs`**, modeled on
   `src/runner/session.mjs`'s existing PID-liveness/registry pattern
   (`isPidAlive` signal-0 probe, fail-closed on a corrupt registry) — but
   a SEPARATE concern: session.mjs tracks git-worktree lifecycles, this
   tracks one long-lived detached OS process per repo checkout.
   - `startGateway`: refuses (no side effects) when the registry already
     names a live pid; else builds the release binary (`cargo build
     --release --bin herdr-fgos`, cargo's own incremental cache keeps a
     no-op rebuild fast) and spawns it detached (`child_process.spawn`,
     `detached: true`, `.unref()`, stdout/stderr to `.fgos/logs/
     gateway.log`), confirming REAL startup by polling the log for the
     "listening on" line the Rust binary itself prints — never trusting
     a returned pid alone (a pid exists the instant `spawn()` returns
     even if the process panics moments later, e.g. a missing
     `gateway.token`).
   - `stopGateway`: SIGTERM the recorded pid, clear the registry;
     reports `alreadyStopped: true` (not an error) when nothing was
     running.
   - `gatewayStatus`: real pid liveness PLUS a real HTTP reachability
     check against `/v1/contract` (the one unauthenticated endpoint) —
     never a report derived from the registry alone, which goes stale
     the moment the process crashes without anyone calling `stop`.
2. **CLI wiring** (`bin/fgos.mjs`): `case 'gateway'` dispatches
   `start|stop|status`, mirroring `case 'session'`'s own sub-verb
   pattern exactly. Registered in `src/cli/command-registry.mjs`
   (`externalEffect: true` — spawns/kills a real OS process and binds a
   network port, same class as `cleanup`'s branch/worktree deletion).
3. **`.fgos/gateway.json` gitignored** — same class as
   `.fgos/sessions.json` (process/registry state, never committed).
4. **AGENTS.md doctrine** (new section right after "Dispatch — routing
   work to a executor"): any agent that needs the gateway/web dashboard
   running must run `fgos gateway start`, never a raw `cargo run`/
   `nohup`/`tmux`/systemd invocation — closes the chicken-and-egg the
   user found live (2026-08-25): the gateway's own MCP surface
   (`search`/`execute`, `herdr-plugin/src/mcp.rs`) is mounted on the
   SAME process it would need to already be running, so it structurally
   cannot bootstrap itself — this has to be a `fgos` CLI call.

**Files touched:** `src/runner/gateway-control.mjs` (new),
`bin/fgos.mjs`, `src/cli/command-registry.mjs`, `.gitignore`,
`AGENTS.md`, `test/runner/gateway-control.test.mjs` (new),
`test/cli/fgos-gateway.test.mjs` (new).

## Risk map

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| `start` không tạo process mồ côi khi build/spawn thất bại | Thấp | Test thật: refuse-when-already-running xảy ra TRƯỚC khi chạm herdr-plugin/cargo (assert không có side effect) |
| `start` không báo "đã chạy" khi process thật ra panic ngay sau spawn | Thấp | Poll log tìm đúng dòng "listening on" thật (không chỉ tin pid), có timeout thật + tail log vào lỗi |
| `stop` gửi đúng SIGTERM, không giết nhầm | Thấp | Test thật: spawn 1 process thật, stop, `await` sự kiện `exit` thật của process đó — không chỉ tin registry |
| `status` phản ánh thực tế, không chỉ registry cũ | Thấp | Test thật: registry có pid sống nhưng cổng không nghe → `reachable:false`; server thật trả `/v1/contract` → `reachable:true` |
| Toàn bộ pipeline thật (build+spawn+curl+kill) hoạt động trên chính repo | Thấp — không tự động hoá trong test (cargo build chậm) | Chạy tay thật trên `/home/vantt/projects/forgentX`: start (pid 1071178, port 4170) → status (running+reachable) → start-khi-đang-chạy (refuse đúng) → stop → status (not running) → stop-lại (alreadyStopped) → xác nhận `ss -ltnp` cổng đã trống thật |

## Verify

```
node --test test/runner/gateway-control.test.mjs test/cli/fgos-gateway.test.mjs test/cli/fgos-manifest.test.mjs
```

Cố ý KHÔNG chạy toàn bộ `test/cli/*.test.mjs test/runner/*.test.mjs`:
phát hiện 1 lỗi thật đã có sẵn trên `main`, không liên quan
(`test/runner/claim-port.test.mjs:77`, actual 6 !== expected 4 — stale từ
commit `b727d9a7` route claim-port qua multi-file event reads, thuộc
nhánh sweep-checkpoint/events-sharding). Ghi thành bug riêng **tsk-4cf**,
không sửa ở đây — ngoài scope của item này.

## Decide the split

Một mảnh — module + CLI wiring + registry entry + gitignore + doctrine
đều phục vụ đúng một hành vi quan sát được ("agent bật/tắt/kiểm gateway
qua một cửa fgos"), tách nhỏ hơn không tự đứng được.
