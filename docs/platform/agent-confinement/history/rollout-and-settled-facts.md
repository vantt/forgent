# Added in candidate: rollout and settled facts

```txt
Document type: History
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/specs/confinement-authority.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/specs/confinement-authority.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. New subdivision authorized by Step 8 and constitution kind placement. Original heading levels and numbers are retained. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.

## 10. Lộ trình rollout và trạng thái hoàn thành

| Phase | Kết quả | Trạng thái (Track `confinement-authority-implementation`) |
|---|---|---|
| S0 - Contract | Spec, schema names, error taxonomy, one-door invariant | **Đã hoàn thành (P00)**: Contract đóng băng, repo map, inventory |
| S1 - One-door observe | Hai call site chỉ gọi Authority; adapter execute handle bị ẩn; attestation đính kèm kết quả | **Đã hoàn thành (P02)**: `executeThroughConfinement` gắn tại `spawnWorker` và `executeExecutorCli` |
| S2 - Declare | Capabilities explicit policy / `unconfined`; backend registry machine-local; schema validation | **Đã hoàn thành (P01/P04)**: Closed schema, `~/.fgos/confinement-backends.json`, setup/doctor |
| S3 - Prove | Probe harness committed (8 falsification probes) + doctor checks probe freshness | **Đã hoàn thành (P03)**: `runAllConfinementProbes` + doctor checks |
| S4 - Enforce | `required` fail closed trước spawn; di trú 3 bwrap executor | **Đã hoàn thành một phần (P04)**: 7 refusal gates, F-a đến F-d đóng; di trú 3 bwrap executor sang backend reference CHỈ ở fixture (P04.md R4) — live `.fgos/config.json` migration deferred, chưa hoàn thành |
| S5 - Complete migration | Herdr và legacy confinement hội tụ dưới Authority; evaluateBypassPairing | **Đã hoàn thành (P05)**: Chuẩn hoá v1 controls, bypass pairing bảo đảm |
| Dogfood Proof | Multi-agent coordination với cross-provider execution và bwrap enforcement thật | **Đã hoàn thành (P06)**: Doer/Reviewer/Red-Team live proof xanh, attestation artifacts |
| S6 - Extend | macOS/container/remote/network/secret backend khi có nhu cầu | Tương lai / mở rộng ngoài v1 |

Observe-first là thứ tự rollout, không phải kiến trúc đích. `required` luôn fail-closed. Mọi capability chưa có backend binding hỗ trợ được giữ ở `unconfined` (cho 3 capability tư vấn) hoặc omitted (chờ backend binding). Chế độ strict mode (`runner.confinement.strict`) mặc định giữ `false` với chẩn đoán sẵn sàng từ `fgos doctor`.

## 13. Kết quả giải quyết rủi ro và các tồn đọng mở (Settled Facts & Deferred Items)

Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P00-P06:

1. **`herdr-spawn` convergence:** Pre-adapter checks (`workspace: own` worktree cwd và bypass pairing) đã đưa ra Authority prepare. Bypass pairing được bảo vệ bởi hàm dùng chung `evaluateBypassPairing` cho cả Authority và `herdr-round.mjs`. Quản lý session/home lifecycle được khoanh vùng trong adapter; `fgos doctor` phản ánh trạng thái này là `partial` (P05).
2. **One-door call graph:** AST và import tests (`test/architecture.test.mjs`) bảo đảm không còn production call site nào ngoài `authority.mjs` được phép truy cập adapter execute handle (P02).
3. **`runDir` và grant scoping:** `run-output` được cấp riêng theo từng dispatch; agent không thể ghi đè sang runDir của dispatch khác (P03, probe 4).
4. **Attestation persistence:** Bản ghi `confinement-attestation.v1` được lưu trữ an toàn, gắn liền với kết quả execution, ngăn chặn agent trong sandbox giả mạo bằng chứng (P03).
5. **Probe harness:** 8 bài probe falsification độc lập đã được cam kết tại `src/runner/dispatch/confinement/probes/` và kiểm tra độ tươi qua `fgos doctor` (P03).
6. **Machine backend registry:** `~/.fgos/confinement-backends.json` được định nghĩa theo schema đóng `confinement-backend-registry.v1`, không cho phép project config ghi đè, và tự động bootstrap qua `fgos doctor --fix` (P01).
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR011 (`confinement-authority.v1`, nhãn registry chỉ có trong tài liệu) được đăng ký trong bản đồ kiến trúc candidate; A45 đổi số cũ CTR010 để CTR010 tiếp tục thuộc Gateway REST API. Legacy `docs/architecture-map.md` chỉ đổi tại Phase 9 cutover (P07).

### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên

The maintained recipe and its complete history have one holder in
[spec §13.1](../spec.md#131-pane-herdr-bị-confine-cho-agent-không-phải-claude-công-thức-lịch-sử-vì-sao-từng-bị-quên).
It now declares `credentialStore`; the former `resourceBindings` recipe is
compatibility input, not a second current recipe. This history page retains
the rollout record above, not a stale duplicate of the live contract.
