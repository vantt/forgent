---
item: tsk-pdg
---

# RESEARCH.md — tsk-pdg

## Round 1 — 2026-08-16 (discovery)

**Asked:** Chính xác cần sửa gì trong `src/runner/dispatch.mjs` để một
capacity `kind:agent` đã cấu hình thắng `hasLiveTaskAccess`, và blast
radius thật trên `test/runner/dispatch.test.mjs`.

**Checked (repo search, cited):**

- `src/runner/dispatch.mjs:1149-1180` `decideDispatchMechanism`/
  `decideCapacityDispatchMechanism`: `hasNativeMechanism =
  Boolean(capacity && capacity.kind === 'agent')` — không phân biệt HÌNH
  DẠNG của capacity, chỉ nhìn `kind`. `hasLiveTaskAccess:true` luôn thắng
  thành `in-process` bất kể capacity có `command`/`invocations` riêng hay
  không.
- `src/runner/dispatch.mjs:1089` (`resolveExecutorConfig`,
  `resolvedViaAgentType`): xác nhận có SẴN 2 hình dạng loại trừ lẫn nhau
  cho `kind:'agent'`:
  - **agentType-shaped** — chỉ có `agentType`, không có `command`/
    `adapter`/`invocations` riêng (ví dụ `judge-discovery: {kind:'agent',
    agentType:'judge'}`). `in-process` ở đây ĐÚNG LÀ tôn trọng cấu hình —
    nó chỉ nói "gọi Task tool với agentType này", không có external
    command nào để bỏ qua cả.
  - **cli-spawn-shaped** — có `command` riêng hoặc
    `invocations[].via==='cli'` (ví dụ `agy`/`fgos-coding-implement`).
    `in-process` ở đây nghĩa là **bỏ qua hoàn toàn command đã cấu hình**,
    thay bằng chính Task tool của caller — đây mới là điều user muốn đảo.
  - Hai hình dạng loại trừ nhau (`resolvedViaAgentType` chỉ đúng khi
    `!cliInvocation && !(capacity.adapter || capacity.command)`).
- **Phạm vi sửa thu hẹp lại**: chỉ cần thay đổi cách
  `decideCapacityDispatchMechanism` tính mechanism cho nhánh
  cli-spawn-shaped — trả thẳng `'out-of-process'` không qua
  `hasLiveTaskAccess` — nhánh agentType-shaped giữ nguyên hệt cũ.
  `decideDispatchMechanism` (hàm base, thuần boolean) KHÔNG cần sửa.
  `resolveExecutorConfig`/`spawnWorker`/`executeCapacityCli` không cần sửa
  gì thêm — chúng đã tự động chạy đúng khi
  `decideCapacityDispatchMechanism` trả `out-of-process` (rơi xuống nhánh
  spawn thật sẵn có).
- **Blast radius test — quét toàn bộ `hasLiveTaskAccess: true` trong
  `test/runner/dispatch.test.mjs` (28 chỗ, dòng: 1844/1850/1858/1872/
  1893/1903/1908/1928/1952/1970/1983/1996/2023/2042/2061/2080/2093/
  2781/2839/3248/3261/3262/3297/3298/3326/3331/3393)**: mọi test dùng
  `kind:'agent'` + `hasLiveTaskAccess:true` đều dùng capacity
  **agentType-shaped** (`judge-discovery`, `my-agent-capacity` với
  `agentType`, `fgos-coding-implement` với `agentType:'general-purpose'`
  trong 2 test fanout) — KHÔNG có test nào dùng capacity cli-spawn-shaped
  (`command`/`invocations`) cùng `hasLiveTaskAccess:true` mong đợi
  `in-process`. Các test dùng `kind:'tool'` (`submit-assist-classify`,
  `gather`, `explicit`) không bị ảnh hưởng — `tool` kind chưa từng có
  `hasNativeMechanism:true`.
  **Kết luận: 0 test hiện có bị gãy** — thay đổi backward-compatible hoàn
  toàn với suite hiện tại.
- `docs/decisions/0026-...md` rule 2 lý do gốc (trích): "(a) tránh lãng
  phí khi soul mù re-derive 1 phán đoán soul sống đã làm rồi" — lý do này
  KHÔNG áp dụng cho nhánh cli-spawn-shaped: đó không phải "soul mù
  re-derive", mà là spawn một backend KHÁC theo đúng ý người vận hành đã
  cấu hình rõ ràng. Rule 2 vẫn đúng cho nhánh agentType-shaped (đó chính
  là "dùng native của cùng provider" mà rule 2 mô tả).

**Verdict:** `clear` — code path xác định chính xác
(`decideCapacityDispatchMechanism`), phạm vi thu hẹp đúng (chỉ
cli-spawn-shaped), 0 test hiện có bị gãy, lý do 0026 không bị mâu thuẫn
thật (chỉ mâu thuẫn ở đúng 1 nhánh hẹp, có lý do rõ ràng để tách ra).
Verify đề xuất: `npm test` (regression) + một lệnh kiểm chứng sống thật
(node -e gọi decideCapacityDispatchMechanism với capacity cli-spawn-shaped
+ hasLiveTaskAccess:true → out-of-process, VÀ agentType-shaped +
hasLiveTaskAccess:true → in-process không đổi).
