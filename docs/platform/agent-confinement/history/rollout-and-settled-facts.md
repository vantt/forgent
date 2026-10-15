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
7. **Bản đồ kiến trúc:** Component `src/runner/dispatch/confinement/`, slice `confinement-enforcement`, và contract CTR010 (`confinement-authority.v1`) đã được đăng ký chính thức tại `docs/architecture-map.md` (P07).

### 13.1 Pane herdr bị confine cho agent không phải claude: công thức, lịch sử, vì sao từng bị quên

**Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):

1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.

**Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).

**Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
