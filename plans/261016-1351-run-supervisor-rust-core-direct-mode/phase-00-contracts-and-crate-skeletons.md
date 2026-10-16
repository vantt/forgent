# Phase 00: contract, crate rỗng, enum `linux-pgroup`

Wave 0, Lead. Nhánh `run-supervisor/p00-contracts`, worktree `.claude/worktrees/rs-p00`, từ main sau khi 4.2 land.

## Đọc trước

r6 §5.3, §6.0.1, §9.2–9.7, §10; plan.md D1–D10; contract 4.2 `packages/holder-lock/contracts/{holder-lock.port.v1.json,predecessor.v1.json,lock-registry.v1.json}` (kiểm dòng `attempt` hạng 15, đường dẫn `runs/NN/attempt.lock`).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/run-supervisor/contracts/envelope.v3.json` — bất biến, có `digest` (sha256 của JSON chuẩn hoá không gồm `digest`): `{v:3, attemptId, unitRunId, runDir, mode: "direct"\|"terminal", protocolId, hostBin, payloadRoot, cwd, mutation: "mutating"\|"read-only", launch:{command, args, env (đã redact), stdinPolicy, briefPath, outboxDir, capture:{stdout, stderr}}, containment:{preferred, bwrapPrefix?}, deadlines:{softAt, idleMs, hardCeiling:{bootId, boottimeNs}}, agentProtocol:{cli, mode}, slot?:{key} (6.3), steps:[{stepId, hostBin, payloadRoot, argv, cwd, env, stepTimeoutMs}], sideFile}`. Side file 0600 `protected/attempt-secrets.json`: `{env (bí mật), controlEpoch, controlToken}` |
| tạo | `packages/run-supervisor/contracts/supervisor-binding.v1.json` — `{v:1, attemptId, envelopeDigest, supervisor:{host, bootId, pidNs, pid, startTime}, gate:{host tuple}, agent?:{tuple}, domain:{kind, id}, guarantee:{containment: kernel\|best-effort, lock: kernel\|job-scoped}, boundAt}` |
| tạo | `packages/run-supervisor/contracts/gate-go.v1.json` — khung trên kênh GO (độ dài 4 byte + JSON): `HELLO{attemptId}` (gate → sup), `GO{attemptId, envelopeDigest}`, `AGENT{tuple}` (gate → sup), `BRIEF_DELIVERED` (6.3), `STOP{cause}`; EOF trước `GO` = không chạy agent |
| tạo | `packages/run-supervisor/contracts/{gate-exit.v1.json, receipt.v1.json, step-receipt.v1.json, stop-requested.v1.json, cancel-requested.v1.json, adopting.v1.json, closed.v1.json}` — `gate-exit {exitCode, signal, stoppedBy: agent\|soft-deadline\|idle\|cancel\|hard-ceiling\|orphan, cause}`; receipt `{outcome: exited\|timeout\|cancelled\|gate-lost\|carrier-lost\|abandoned-not-started, gateExit?, captureDigests, outboxPresent, synthesizedBy: supervisor\|adopt}`; step receipt `{stepId, status: done, at}` (chỉ ghi khi xong) ; mọi file publish bằng temp + `link` (một lần, `EEXIST` = đã có) |
| tạo | `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json` — `fgos internal supervise --envelope <p> --protocol 1`; `gate --protocol 1 --go-fd N \| --go-socket <path>`; `adopt --protocol 1 (--run-dir <p> \| --scan)` (scan: danh sách run dir ở stdin, một dòng JSON mỗi run ở stdout); `attempt-step <stepId> --protocol 1 --run-dir <p>`; lệch protocol → exit 4 `host-version-mismatch` (như 4.2) |
| tạo | `packages/run-supervisor/contracts/home-marker.v2.json` — `{contract:2, attemptId, runDir, resource, createdAt}` |
| tạo | `packages/process/contracts/containment.port.v1.json` — `create(attemptId) → domain{kind, id}`, `spawn_in(domain, spec{argv, fdMap, env, cwd}) → hostTuple`, `is_empty(domain) → empty\|not-empty\|unknown`, `kill_all(domain, graceMs) → ok\|refused`, `guarantee() → {level, escapes[]}`; kind: `linux-gate`, `linux-pgroup`, `windows-job`, `macos-tree` |
| sửa | `packages/holder-lock/contracts/predecessor.v1.json` — thêm `linux-pgroup` vào enum `domainKind` (D5) |
| tạo | `packages/agent-protocol/contracts/agent-protocol.v1.json` — cổng IO `{send(text\|keys, submit), read(lines), activity?}`; kết quả có tên `ready`, `blocked(trust-dialog\|login\|usage-limit)`, `delivered`, `delivery-unknown`, `completed(resultPath)`, `needs-human`, `exited(code)`; bảng `cli × mode` |
| tạo | `packages/run-supervisor/rust/{Cargo.toml,src/lib.rs}`, `packages/agent-protocol/rust/{Cargo.toml,src/lib.rs}` (chỉ `pub mod` rỗng); `packages/process/rust/src/containment/mod.rs` (trait rỗng + `mod linux; mod windows; mod macos;` file rỗng có `cfg`) |
| sửa | `Cargo.toml` gốc (member), `Cargo.lock`, `packages/process/rust/src/lib.rs` (`pub mod containment`) |
| tạo | `test/run-supervisor/contracts.test.mjs` (schema hợp lệ; `digest` chuẩn hoá ra cùng giá trị ở Node và một vector Rust trong `packages/run-supervisor/contracts/vectors/envelope-digest.v1.json`) |

## Bước

1. Viết contract; vector digest (Node `computeSha256Digest` hiện có ở `assignment-runner.mjs` dùng cùng cách chuẩn hoá khoá: kiểm và ghi rõ trong contract).
2. Crate rỗng biên dịch ba target.
3. Kiểm `lock-registry.v1.json` dòng `attempt` (hạng 15, `run`); nếu đường dẫn khác `runs/NN/attempt.lock` thì dùng đường dẫn của registry, không sửa registry.

## Test

`cargo check -p fgos-run-supervisor -p fgos-agent-protocol -p fgos-process` (ba target); `node --test test/run-supervisor/contracts.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Contract đủ để P01–P10 code độc lập; vector digest khớp hai phía. Rollback: revert.
