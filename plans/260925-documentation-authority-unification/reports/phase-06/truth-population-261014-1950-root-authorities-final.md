# Final root authorities truth population

Author session: codex-session:22@2026-10-14
Content commit: cd82746a8ba169600d987eeb0f5ca274304712f3
Authorization: A35 item 3 / A28 item 3(a)

All 1,072 mapped Step 5 source rows are decided; 350 current-content units below bind the final bytes. Population SHA256 (compact JSON rows): `dc840481482a4b8215e7a030b5cd5e57e097ec54a4c87afb61f100506b80ae1f`. No author draw or truth verdict is supplied. The independent reviewer draws 30, records seed and selected IDs, checks every asserted current fact and applies the >10% rule. Dated law rationale and intended vision are preserved; distinguish them from current implementation claims. The original population/sample/review stay untouched as historical evidence.

Machine population and exclusion accounting: [truth-population-261014-1950-root-authorities-final.md.json](truth-population-261014-1950-root-authorities-final.md.json).

## claim_cb64adb8074de40f3c4a8f86254f6b03

`docs/platform/coexistence/spec.md#unheaded-block-2`
Unit SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`
Shown SHA256: `7e62385ddc90d8d132134a247995fd6979516a226b5d8581507b4b4b23775ef5`

```text
fgOS đôi khi chạy trong một project **cùng lúc với một harness agent khác** đã
có mặt (một công cụ điều phối agent bên ngoài fgOS — ví dụ có thể là quy trình
quản lý phiên, hook chặn ghi, hay bộ skill riêng của công cụ đó). Tài liệu này
là doctrine thi hành cho yêu cầu nền tảng ở `docs/decisions/0009-chong-giao-thoa-luc-cai.md`:
fgOS không giao thoa tiến trình với harness khác cùng máy. Nội dung dưới đây
mô tả hành vi của fgOS — không mô tả, không sửa, hành vi phía harness khác.
```

## claim_0e88ce9bec6eedfd4dfb8f2054ac9ad1

`docs/platform/coexistence/spec.md#unheaded-block-3`
Unit SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`
Shown SHA256: `54bd827efe52f713ee77267e027dd72235d5a6360dd2c2278ca21eb40d933521`

```text
fgOS chỉ ghi/khóa trong phạm vi:
```

## claim_63ddee0e3d9a78ee0d017a03791f28f5

`docs/platform/coexistence/spec.md#unheaded-block-4`
Unit SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`
Shown SHA256: `3eff74f1ff0c6baf75fe6cd4cd141617f14528cb728a17773c7a57843a641323`

```text
| Path | Vai trò |
|---|---|
| `.fgos/` (theo cwd của project) | data dir — event log, view, manifest coexistence |
| `<tmpdir>/fgos-worktrees` (ngoài cây project) | worktree tạm cho mỗi work-item runner xử lý |
| nhánh `fgw/*` | nhánh git runner tạo cho mỗi worktree |
```

## claim_a02fea012fb206c2ad06c5741144fed0

`docs/platform/coexistence/spec.md#unheaded-block-5`
Unit SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`
Shown SHA256: `3a51a9f8c9df009dfd174e9660ec9c5f32c34b5817a7c22045bd4d9d57dccf3c`

```text
Ngoài ba phạm vi trên, fgOS chỉ ghi vào đúng hai cửa **có chủ** — luôn qua một
cổng có kiểm soát, không phải một hook quơ rộng:
```

## claim_c4db013a526cbdcbc15b72897386bbe2

`docs/platform/coexistence/spec.md#unheaded-block-6`
Unit SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`
Shown SHA256: `e3320381434b8c090ebb654ce15209469300643cda58396dd0b44ee535db6b8a`

```text
1. **Merge-vào-trunk qua cổng duyệt người** (`fgos review`/`approve`/`reject`
   — spec: `docs/specs/runner.md`) — ghi vào trunk repo chỉ sau khi người
   duyệt một đề xuất.
2. **Chính source repo khi một runner worker được giao việc** — worker nhận
   dispatch, làm việc, commit lên nhánh `fgw/*` của chính nó; đây là bề mặt đã
   có chủ (runner), không phải một ghi tùy tiện ngoài lãnh địa.
```

## claim_06c99c1622fcfaef1db94ba3347642dd

`docs/platform/coexistence/spec.md#unheaded-block-7`
Unit SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`
Shown SHA256: `23de78bfd6233e6be40e9b4a85b90b2355ef4d270ef61850a2932846f9d12aa4`

```text
Lãnh địa được ghi thành **manifest máy-đọc được**: `.fgos/coexistence.json`
(xem [Manifest schema](#manifest-schema-fgoscoexistencejson) dưới đây) — một
harness khác có thể đọc file này để biết chính xác fgOS ghi ở đâu, thay vì
đoán hoặc quét toàn cây.
```

## claim_78c389d4ede2606172a631f317c67f8f

`docs/platform/coexistence/spec.md#unheaded-block-8`
Unit SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`
Shown SHA256: `2620e281e1857265ac8d29ec6f70e429d4fa14fc9552f8673ee0a08839af451b`

```text
Trong một phiên agent, chỉ **một** bên điều phối: harness mà người gọi phiên
đó chỉ định. fgOS không tiêm mệnh lệnh điều phối vào phiên của một harness
khác — fgOS không tạo, không sửa `AGENTS.md` của project host để chèn khối
điều phối của mình vào đó. Khi một runner worker của fgOS được spawn, nó nhận
đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`) — không
liên quan gì tới nhạc trưởng của phiên host.
```

## claim_e75bdce8c24ce86cfc79f86ce8a67db8

`docs/platform/coexistence/spec.md#unheaded-block-9`
Unit SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`
Shown SHA256: `787c56fbaae6d796210e94fc81178a80ebb7a12f0e6d582399504adaa83c669e`

```text
`fgos init` quét **read-only** project để nhận diện dấu hiệu (marker) một
harness khác đã có mặt: một số thư mục dấu ấn phổ biến (ví dụ `.bee/`,
`.claude/`, `.codex/`, `.cursor/` — tập khởi đầu, mở rộng được bằng cách thêm
dòng dữ liệu, không phải nhánh logic mới) và một khối managed trong
`AGENTS.md` của host nếu có (ví dụ một khối đánh dấu bằng comment mở/đóng
riêng của harness đó).
```

## claim_963cadeea08fd64451da20f7c44965ba

`docs/platform/coexistence/spec.md#unheaded-block-10`
Unit SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`
Shown SHA256: `dc6ca9e9b25c3b5742da559f7f532ddd616ebd835ec0049e0e490f66c989a868`

```text
Ứng xử khi phát hiện:

- **Ghi nhận** — in ra output của `init` và lưu vào manifest
  (`detected_harnesses`), để cả người lẫn agent thấy ngay.
- **Không đè, không sửa** — `fgos init` không bao giờ ghi, đổi tên, hay xóa
  bất kỳ file nào thuộc về harness khác. Nếu host không có `AGENTS.md`, `fgos
  init` bỏ qua bước đó và **không tạo** file này — fgOS không tự ý đưa mình
  vào doctrine của một phiên do harness khác điều phối.
- **Lỗi đọc không chặn `init`** — nếu một marker không đọc được (ví dụ
  `AGENTS.md` bị hỏng quyền), `init` ghi nhận lỗi đó vào manifest chứ không
  làm hỏng lượt `init`.
```

## claim_6f1071753432344f79a59d0a404e3601

`docs/platform/coexistence/spec.md#unheaded-block-11`
Unit SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`
Shown SHA256: `3d25f914a61385efbe7bfb0515d8b6067929d046ce13e49fc952558c9cee09e4`

```text
`init` luôn thành công bất kể phát hiện gì.
```

## claim_f30d7f5c2c03d4b1a3b42a602699350e

`docs/platform/coexistence/spec.md#unheaded-block-12`
Unit SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`
Shown SHA256: `bb3ecfdb26db74e2c1994e836bfa3948342cbe40c06066f4a34a4f9f8609ff79`

````text
```json
{
  "v": 1,
  "territory": {
    "data": ".fgos/",
    "worktrees": { "descriptor": "<tmpdir>/fgos-worktrees", "resolved": "/abs/path" },
    "branches": "fgw/*"
  },
  "detected_harnesses": [{ "name": "example-harness", "markers": [".example-dir"] }],
  "agentsMdReadError": "optional — chỉ có khi AGENTS.md tồn tại nhưng đọc lỗi"
}
```
````

## claim_41a2f6ca434cd96e74da038c8c880a3e

`docs/platform/coexistence/spec.md#unheaded-block-13`
Unit SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`
Shown SHA256: `c251c70cd142a978cc0298ae1697eddb857d8634f5aef616f7d21e51e889843d`

```text
`territory` mô tả đúng những gì `fgos.mjs`/`worktree.mjs` đã làm từ trước —
không phải một quy ước path mới được tính lại. `detected_harnesses` là mảng
gộp theo tên (một harness có cả marker thư mục lẫn khối AGENTS.md thì gộp
thành một entry).
```

## claim_c0e66645dd2b60cea07911f0fcab32ab

`docs/platform/coexistence/spec.md#unheaded-block-14`
Unit SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`
Shown SHA256: `83bb4a6e15e98dfa5915fc97930900e83c87b6bf1e1fc6550c4823b760c03644`

```text
Nguyên tắc 2 của record ADR0009 ("hook gate theo path của mình — không quơ lên
path harness khác") hiện **chưa được thi hành ở phía harness ngoài fgOS**
trong đợt cài này. Một canary thật (spawn hook chặn-ghi thật của một harness
tham chiếu, chạy trong xưởng phát triển fgOS — xem
`docs/history/install-coexistence/reports/canary-run.md`, hồ sơ xưởng, không
thuộc repo sản phẩm này) đo được **hai loại chặn nhầm lãnh địa fgOS, hai CƠ
CHẾ hoàn toàn khác nhau**:
```

## claim_f833b4f304d4876cd947d7758fe7eeb0

`docs/platform/coexistence/spec.md#unheaded-block-15`
Unit SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`
Shown SHA256: `108ef42eb0f9b4c14b52945810ca180e81f45f1de7c5bd7175a2856f3733c95f`

```text
1. **Chặn theo-phase (phase-contingent):** một cổng "idle intake" của harness
   đó, khi phiên harness ở trạng thái nghỉ, deny MỌI ghi ngoài một allowlist
   tĩnh — bao gồm cả ghi vào `.fgos/`. Đây không phải luật nhắm riêng fgOS:
   một ghi bất kỳ khác ngoài allowlist (không liên quan gì tới fgOS) bị deny
   y hệt. Flip khi cổng này biết đọc territory manifest (`.fgos/coexistence.json`
   hoặc một registry tương đương) thay vì chỉ dùng allowlist tĩnh.
2. **Containment phi-phase (phase-independent):** một guard containment của
   harness đó deny ghi ra ngoài checkout vật lý của chính nó, kể cả khi đích
   ghi là worktree tạm hợp lệ của fgOS (`<tmpdir>/fgos-worktrees`) — guard này
   không quan tâm phase, chặn vô điều kiện. Flip khi guard này biết miễn trừ
   (exempt) một lãnh địa đã đăng ký của harness khác.
```

## claim_88fe2992aef5d34eea48889e6e583929

`docs/platform/coexistence/spec.md#unheaded-block-16`
Unit SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`
Shown SHA256: `711282804d4c2908e7dbb68401a2665068b10040172acbff0fc76c86c23ae15e`

```text
Hai fix trên **độc lập với nhau** — không có một sửa chung nào giải quyết cả
hai. Cả hai đều thuộc về cây mã nguồn của harness kia, không thuộc fgOS: fgOS
không tự sửa một harness khác. Bash — tức là gọi `fgos <verb>` như một lệnh
shell thường — không bị chặn bởi cả hai cơ chế trên.
```

## claim_f099e149aece60d1ae83ac13d1466da4

`docs/platform/coexistence/spec.md#unheaded-block-17`
Unit SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`
Shown SHA256: `979a7e6604657c12b8bb38e12a421854e0173f21b7c0dbca549b336f4c7a94d2`

```text
Phần fgOS của STR10 (manifest, detection, nhường-nhịn, canary pin đúng thực
trạng) đóng đủ ở đợt này. Gap ở trên là gap phía-ngoài, được pin làm known-gap
có bằng chứng sống, không phải bị che giấu — flip khi phía kia sửa.
```

## claim_49b30bb0157496fe2b3c4994ced95aa9

`docs/platform/coexistence/spec.md#unheaded-block-18`
Unit SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`
Shown SHA256: `092c4defefefd6fe98bd926a924d821599937c976c30136cd332d1daaa01f81c`

```text
- `docs/decisions/0009-chong-giao-thoa-luc-cai.md` — quyết định nguồn của 4
  nguyên tắc trên.
- `src/install/coexist.mjs` — cài đặt detection + manifest.
- `bin/fgos.mjs` verb `init` — điểm gọi detection.
- `test/e2e/coexistence-canary.test.mjs` — canary pin known-gap + footprint +
  nhường-nhịn.
- `docs/backlog.md` (STR10) — trạng thái backlog, trỏ tới hồ sơ xưởng.
```

## claim_2f7cbb5fabfc5e77f7014c54f020c524

`docs/platform/contracts/architecture-manifest.json#file-block`
Unit SHA256: `c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85`
Shown SHA256: `fb5b4a5569bf3ce3083f23a4af40b856b6a469a6ef9043c6c87fc7513c9bbfff`

```text
{
  "contract": "architecture-manifest.v1",
  "map": "docs/architecture-map.md",
  "layers": [
    "entry",
    "use-case",
    "infra",
    "domain",
    "kernel"
  ],
  "rules": [
    "one-directional-layer",
    "domain-siloing"
  ],
  "components": [
    "packaging-distribution"
  ],
  "domains": [
    "coding",
    "marketing"
  ],
  "files": {
    "bin/fgos.mjs": "entry",
    "bin/fgos-runner.mjs": "entry",
    "src/runner/loop.mjs": "use-case",
    "src/runner/paths.mjs": "infra",
    "src/runner/dispatch.mjs": "infra",
    "src/runner/operation-capability.mjs": "domain",
    "src/runner/rigor.mjs": "kernel",
    "src/runner/dispatch-log.mjs": "infra",
    "src/runner/fanout-batch.mjs": "infra",
    "src/runner/work-compat.mjs": "infra",
    "src/runner/dispatch/adapters.mjs": "infra",
    "src/runner/dispatch/config.mjs": "infra",
    "src/runner/dispatch/confinement/policies.mjs": "infra",
    "src/runner/dispatch/confinement/bypass-pairing.mjs": "infra",
    "src/runner/dispatch/confinement/backend-registry.mjs": "infra",
    "src/runner/dispatch/confinement/authority.mjs": "infra",
    "src/runner/dispatch/confinement/request.mjs": "infra",
    "src/runner/dispatch/confinement/resources.mjs": "infra",
    "src/runner/dispatch/confinement/cleanup.mjs": "infra",
    "src/runner/dispatch/confinement/attestation-store.mjs": "infra",
    "src/runner/dispatch/confinement/drivers/bwrap.mjs": "infra",
    "src/runner/dispatch/confinement/probes/harness.mjs": "infra",
    "src/runner/dispatch/resolve.mjs": "infra",
    "src/runner/dispatch/mechanism.mjs": "infra",
    "src/runner/dispatch/plan.mjs": "infra",
    "src/runner/dispatch/transport.mjs": "infra",
    "src/runner/dispatch/prepare.mjs": "infra",
    "src/runner/dispatch/result-ladder.mjs": "infra",
    "src/runner/dispatch/assignment.mjs": "infra",
    "src/runner/dispatch/assignment-layout.mjs": "infra",
    "src/runner/dispatch/assignment-normalizer.mjs": "infra",
    "src/runner/dispatch/execution-contract.mjs": "infra",
    "src/runner/dispatch/effective-execution-contract.mjs": "infra",
    "src/runner/dispatch/agent-result-claim-contract.mjs": "infra",
    "src/runner/dispatch/evidence-attribution.mjs": "infra",
    "src/runner/dispatch/run-result.mjs": "infra",
    "src/runner/dispatch/usage-parsers.mjs": "infra",
    "src/runner/dispatch/runtime-inspection.mjs": "infra",
    "src/runner/dispatch/reconciliation-planner.mjs": "infra",
    "src/runner/dispatch/assignment-policy.mjs": "infra",
    "src/runner/dispatch/operation-prompt-templates.mjs": "infra",
    "src/runner/dispatch/provider-adapter.mjs": "infra",
    "src/runner/dispatch/provider-capacity.mjs": "infra",
    "src/runner/dispatch/provider-auth-failure.mjs": "infra",
    "src/runner/dispatch/provider-credential-probe.mjs": "infra",
    "src/runner/dispatch/provider-account-probe.mjs": "infra",
    "src/runner/dispatch/provider-credential-renewal.mjs": "infra",
    "src/runner/dispatch/assignment-runner.mjs": "infra",
    "src/runner/dispatch/settlement.mjs": "infra",
    "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
    "src/runner/dispatch/cli.mjs": "infra",
    "src/runner/dispatch/detached-run-supervisor.mjs": "infra",
    "src/runner/prompt-templates.mjs": "infra",
    "src/runner/worker-log.mjs": "infra",
    "src/runner/agent-roster.mjs": "infra",
    "src/runner/agent-definitions.mjs": "infra",
    "src/runner/agent-listing.mjs": "infra",
    "src/runner/worktree.mjs": "infra",
    "src/runner/promote-preflight.mjs": "infra",
    "src/runner/promote-engine.mjs": "infra",
    "src/runner/session.mjs": "infra",
    "src/runner/gateway-control.mjs": "infra",
    "src/runner/goal-check.mjs": "infra",
    "src/runner/iron-law-gate.mjs": "infra",
    "src/runner/frozen-judge.mjs": "domain",
    "src/runner/merge.mjs": "infra",
    "src/runner/main-checkout-lock.mjs": "infra",
    "src/runner/main-checkout-reset-guard.mjs": "infra",
    "src/runner/github-adapter.mjs": "infra",
    "src/state/drift-status.mjs": "infra",
    "src/state/postland-drift.mjs": "infra",
    "src/state/store.mjs": "infra",
    "src/state/gate-bypass.mjs": "infra",
    "src/state/cursor.mjs": "use-case",
    "src/state/porting-store.mjs": "infra",
    "src/state/tool-registry.mjs": "domain",
    "src/install/coexist.mjs": "infra",
    "src/runner/recovery.mjs": "domain",
    "src/runner/anti-loop.mjs": "domain",
    "src/runner/attestation-guard.mjs": "domain",
    "src/runner/claim-port.mjs": "infra",
    "src/runner/claim-liveness.mjs": "infra",
    "src/runner/lock-wait.mjs": "infra",
    "src/runner/write-queue.mjs": "domain",
    "src/runner/root-affinity.mjs": "domain",
    "src/state/status-fsm.mjs": "domain",
    "src/state/decision-question.mjs": "domain",
    "src/state/handoff.mjs": "domain",
    "src/state/porting.mjs": "domain",
    "src/state/frontier.mjs": "domain",
    "src/state/impact.mjs": "domain",
    "src/state/priority-formula.mjs": "domain",
    "src/state/replay.mjs": "domain",
    "src/state/events-compaction.mjs": "domain",
    "src/state/dep-graph.mjs": "domain",
    "src/state/graph-harness.mjs": "domain",
    "src/state/graph-metrics.mjs": "domain",
    "src/state/awaiting-context.mjs": "domain",
    "src/state/cleanup-harness.mjs": "domain",
    "src/state/cleanup-pool.mjs": "domain",
    "src/state/discover-pool.mjs": "domain",
    "src/state/plan-pool.mjs": "domain",
    "src/state/retro-pool.mjs": "domain",
    "src/state/retrospective-doors.mjs": "domain",
    "src/state/worker-slots.mjs": "domain",
    "src/intake/discovery.mjs": "use-case",
    "src/intake/plan.mjs": "use-case",
    "src/intake/plan-verdict-from-plan-md.mjs": "use-case",
    "src/intake/verify-pattern-check.mjs": "kernel",
    "src/cli/command-registry.mjs": "kernel",
    "src/cli/deprecation.mjs": "kernel",
    "src/cli/version.mjs": "kernel",
    "src/cli/invocation-fault-log.mjs": "infra",
    "src/cli/approve-fault-log.mjs": "infra",
    "src/report/enduser-index.mjs": "domain",
    "src/report/enduser-index-generate.mjs": "infra",
    "src/report/decision-index.mjs": "infra",
    "src/report/capability-plan-lint.mjs": "infra",
    "src/report/context-render.mjs": "domain",
    "src/report/frontmatter.mjs": "domain",
    "src/report/authoritative-match.mjs": "domain",
    "src/evolve/iron-law.mjs": "domain",
    "src/state/events.mjs": "kernel",
    "src/state/events-jsonl-truncation-guard.mjs": "kernel",
    "src/state/main-checkout-guard-warnings.mjs": "kernel",
    "src/state/work.mjs": "kernel",
    "src/state/envelope.mjs": "kernel",
    "src/intake/risk-keywords.mjs": "kernel",
    "src/verbs/merge/merge.mjs": "use-case",
    "src/verbs/merge/iron-law-level.mjs": "use-case",
    "src/verbs/merge/approve.mjs": "use-case",
    "src/verbs/merge/review.mjs": "use-case",
    "src/verbs/merge/sync-root.mjs": "use-case",
    "src/verbs/merge/catchup.mjs": "use-case",
    "src/verbs/merge/reject.mjs": "use-case",
    "src/verbs/merge/promote-to-component.mjs": "use-case",
    "src/verbs/state/edit.mjs": "use-case",
    "src/verbs/state/move.mjs": "use-case",
    "src/verbs/state/read.mjs": "use-case",
    "src/verbs/dispatch/show-run.mjs": "use-case",
    "src/verbs/dispatch/inspect.mjs": "use-case",
    "src/verbs/dispatch/reconcile.mjs": "use-case",
    "src/verbs/dispatch/watch.mjs": "use-case",
    "src/verbs/dispatch/recover.mjs": "use-case",
    "src/report/item-trace.mjs": "domain",
    "src/util/format-bytes.mjs": "kernel",
    "src/util/format-duration.mjs": "kernel",
    "src/util/normalize-path.mjs": "kernel",
    "src/util/release-binary-path.mjs": "kernel",
    "src/util/release-targets.mjs": "kernel",
    "src/util/session-identity.mjs": "kernel",
    "src/util/unique-tmp-tag.mjs": "kernel",
    "src/util/host-bin.mjs": "infra",
    "src/convention/convention-client.mjs": "infra",
    "src/observe/friction-client.mjs": "infra",
    "src/intake/classify.mjs": "use-case",
    "src/setup/ansi.mjs": "domain",
    "src/setup/config-merge.mjs": "domain",
    "src/setup/shell-rc.mjs": "infra",
    "src/setup/project-launcher.mjs": "infra",
    "src/setup/bin-discovery.mjs": "infra",
    "src/setup/skill-wrappers.mjs": "infra",
    "src/setup/instruction-registry.mjs": "infra",
    "src/setup/git-hooks.mjs": "infra",
    "src/setup/claude-code-hooks.mjs": "infra",
    "src/setup/agent-hooks.mjs": "infra",
    "src/setup/agy-permissions.mjs": "infra",
    "src/setup/agent-cli-trust.mjs": "infra",
    "src/setup/blind-steps-proven-pools.mjs": "use-case",
    "src/setup/workflow-pool-independence.mjs": "use-case",
    "src/setup/checks.mjs": "use-case",
    "src/setup/executor-profile-warnings.mjs": "infra",
    "src/config/global-config.mjs": "infra",
    "src/setup/registrations.mjs": "use-case",
    "src/config/shared-config-file.mjs": "domain",
    "src/state/knowledge-registry.mjs": "domain",
    "src/report/knowledge-resolver.mjs": "domain",
    "src/report/knowledge-projection.mjs": "domain",
    "src/state/fgos-file-registry.mjs": "kernel",
    "src/state/runtime-coordination.mjs": "infra",
    "src/runner/dispatch/brief.mjs": "infra",
    "src/runner/dispatch/dispatch-error.mjs": "infra",
    "src/runner/dispatch/proof-helpers.mjs": "infra",
    "src/runner/dispatch/herdr-agent.mjs": "infra",
    "src/runner/dispatch/herdr-diagnosis.mjs": "infra",
    "src/runner/dispatch/herdr-round.mjs": "infra",
    "src/runner/dispatch/herdr-reconcile.mjs": "infra",
    "src/runner/dispatch/worker-artifacts.mjs": "infra",
    "src/runner/dispatch/liveness.mjs": "infra",
    "src/runner/dispatch/visibility-session.mjs": "infra",
    "src/runner/dispatch/recovery-planner.mjs": "infra",
    "src/runner/dispatch/run-lock.mjs": "infra",
    "src/runner/dispatch/process-identity.mjs": "infra",
    "src/runner/dispatch/trust-store.mjs": "infra",
    "src/runner/dispatch/worker-home.mjs": "infra",
    "src/runner/dispatch/stop-processes-inside.mjs": "infra",
    "src/runner/dispatch/worker-session.mjs": "infra",
    "src/runner/dispatch/worker-session-boot.mjs": "infra",
    "src/runner/dispatch/recovery.mjs": "infra",
    "src/setup/instruction-composition.mjs": "infra",
    "src/setup/instruction-projections.mjs": "infra",
    "src/runner/execution/unit.mjs": "infra",
    "src/runner/execution/bind.mjs": "infra",
    "src/runner/execution/account-rotation.mjs": "infra",
    "src/runner/execution/dry-bind.mjs": "infra",
    "src/runner/execution/role-ledger.mjs": "infra",
    "src/runner/execution/commit-unit-work.mjs": "infra",
    "src/runner/execution/handoff-refs.mjs": "infra",
    "src/runner/execution/unit-run-history.mjs": "infra",
    "src/runner/execution/unit-summary.mjs": "infra",
    "src/runner/execution/run.mjs": "use-case",
    "src/runner/execution/patterns/index.mjs": "domain",
    "src/runner/execution/patterns/panel.mjs": "domain",
    "src/runner/execution/patterns/presets.mjs": "domain",
    "src/runner/execution/patterns/reviewed.mjs": "domain",
    "src/runner/execution/patterns/role-tasks.mjs": "domain",
    "src/runner/execution/patterns/solo.mjs": "domain",
    "src/workflow/definition.mjs": "kernel",
    "src/workflow/dir-guard.mjs": "infra",
    "src/workflow/loader.mjs": "infra",
    "src/workflow/store.mjs": "infra",
    "src/workflow/integrate.mjs": "infra",
    "src/workflow/plan-source.mjs": "infra",
    "src/workflow/runner.mjs": "use-case",
    "src/workflow/index.mjs": "use-case",
    "src/workflow/checked.mjs": "infra",
    "src/workflow/ref-digests.mjs": "infra",
    "src/workflow/seat-providers.mjs": "infra",
    "src/workflow/seats.mjs": "infra",
    "src/workflow/steps.mjs": "kernel",
    "src/state/domain-registry.mjs": "kernel",
    "src/state/step-fsm.mjs": "domain",
    "src/verbs/state/step.mjs": "use-case",
    "src/runner/operation-choice.mjs": "use-case",
    "src/runner/work-dispatch.mjs": "infra"
  }
}
```

## claim_ba0c9cd1f2cfc511475c4784853c192f

`docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-2`
Unit SHA256: `74905aad03f2d4da0c0835483e4c8fd51193bbb34ae9acfc4cc9684ce2e04403`
Shown SHA256: `74905aad03f2d4da0c0835483e4c8fd51193bbb34ae9acfc4cc9684ce2e04403`

```text
This is the top-level portal for fgOS documentation.
```

## claim_93255773ca1dc6fccf3f939d6920671c

`docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-3`
Unit SHA256: `d6a38a7d39b908a31d499a0a332bac7373c5b6113358b7620b70ec1fc1d02f35`
Shown SHA256: `d6a38a7d39b908a31d499a0a332bac7373c5b6113358b7620b70ec1fc1d02f35`

```text
| Need | Read |
|---|---|
| Documentation rules | [doc-governance.md](../../../../doc-governance.md) |
| What to read first | [reading-map.md](../../../../reading-map.md) |
| Platform/system design docs | [platform/README.md](../../../README.md) |
| Current legacy product/source map | [specs/reading-map.md](../../../../specs/reading-map.md) |
| User docs | [user/](../../../../user) target; existing [how-to/](../../../../how-to), [reference/](../../../../reference), [explanation/](../../../../explanation) during migration; `docs/tutorials/` is a planned/legacy slot not present in this checkout |
```

## claim_1d227620ae77d15f8b158587e8b9e37c

`docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-4`
Unit SHA256: `c81e53c7c41201d4badcfb982d2c1013939e9348b29f89fbd7208e442041839a`
Shown SHA256: `c81e53c7c41201d4badcfb982d2c1013939e9348b29f89fbd7208e442041839a`

```text
| Space | Role |
|---|---|
| [platform/](../../..) | Platform-wide and area-specific system docs |
| [user/](../../../../user) | Target user-facing docs organized by Diataxis |
| [generated/](../../../../generated) | Target generated projections |
| [knowledge/](../../../../knowledge) | Retrospective learning |
| [history/](../../../../history) | Archive, discussions, migration source, retired context |
| [templates/](../../../../templates) | Documentation templates |
```

## claim_b00f909fee587b0a67a8f47701485ca4

`docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-5`
Unit SHA256: `86a39793e8e5d6c3c7d89b6a7db02f7130f2f25ca816fc65b791ce32980f1e59`
Shown SHA256: `86a39793e8e5d6c3c7d89b6a7db02f7130f2f25ca816fc65b791ce32980f1e59`

```text
The documentation system is being migrated. Legacy roots such as
`docs/specs/**` and `docs/architect/**` remain active until their content is
promoted, redirected, or retired.
```

## claim_71c1d68fd7d5e236176997c2fa26a965

`docs/platform/documentation/operations/portals/docs-portal.md#unheaded-block-6`
Unit SHA256: `b2a132aacd33976f63ffb60602febcd806ef74b77e0ee5746b04275f374b992c`
Shown SHA256: `b2a132aacd33976f63ffb60602febcd806ef74b77e0ee5746b04275f374b992c`

```text
| Relationship | File |
|---|---|
| governs documentation system | [doc-governance.md](../../../../doc-governance.md) |
| routes readers by purpose | [reading-map.md](../../../../reading-map.md) |
| platform documentation portal | [platform/README.md](../../../README.md) |
| legacy/current detailed source map | [specs/reading-map.md](../../../../specs/reading-map.md) |
```

## claim_55e740e30362cea64b18530021248825

`docs/platform/documentation/switchboard.md#unheaded-block-2`
Unit SHA256: `dfd0315d706d69359ec37166314c3fe2f4934d1e0186c8bdf0c3780bed399869`
Shown SHA256: `dfd0315d706d69359ec37166314c3fe2f4934d1e0186c8bdf0c3780bed399869`

```text
This switchboard is the operative authority router for repository-local platform
documentation during the active unification migration. It stops authority split
and reader guesswork before atomic cutover.
```

## claim_9316894b7b752b8c08f7a6c020ff2c90

`docs/platform/documentation/switchboard.md#unheaded-block-3`
Unit SHA256: `483ff23c2fb5ee1ed30ace1aa06ce631274817a62e150b44774309a9d100e2bc`
Shown SHA256: `483ff23c2fb5ee1ed30ace1aa06ce631274817a62e150b44774309a9d100e2bc`

```text
1. **One claim has one canonical owner.** Summary documents link; they do not fork authority.
2. **`docs/platform/**` is the target topology, not yet the universal live authority.**
   Do not treat `docs/platform/**` as fully canonical across all areas. Currently, only
   Packaging-Distribution, Host Invocation Routing, and Agent Coordination have promoted portals,
   and each retains explicit legacy source delegations for detailed contracts, ADRs, or proofs.
   All other platform areas remain `legacy-current` under `docs/specs/**` or root documents.
3. **No guessing by file path, date, or bare metadata.**
   Readers and writers must not infer authority from a directory path, a newer git commit date,
   richer prose, or a bare `Canonical:` frontmatter string. Follow the explicit current route below.
4. **Never dual-author prose.**
   Do not write the same normative, behavioral, or architectural content in both legacy roots and
   candidate target documents. Update the declared current owner once, then record candidate impact.
5. **Phase status truth.**
   Phase 00 (truth reset) and Phase 01 (containment switchboard and ratchets) are completed;
   Phases 02–09 remain unauthorized. This switchboard does not promote, migrate, relocate, or
   delete any legacy source.
```

## claim_bf92583669fa0c4590f0a4ad3e2512ad

`docs/platform/documentation/switchboard.md#unheaded-block-4`
Unit SHA256: `130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902`
Shown SHA256: `130d01325ca439a9c92832cb477fc845a32ef7d393c7b2d584dcf348ff298902`

```text
| Area / surface | authorityStatus | fileClass | Current Route / Canonical Owner | Retained / Subordinate Sources | Role / Scope Summary |
|---|---|---|---|---|---|
| Platform laws | candidate | maintained-authority + retained-source + generated | `docs/platform-foundations.md` (authoritative text); enter at `docs/platform/platform-foundations.md` (candidate entry/summary) | `docs/specs/platform-foundations.md` (non-authority spec projection; binding source: `docs/platform-foundations.md`) | Complete binding wording, rationale, sources, and review thresholds are owned exclusively by `docs/platform-foundations.md`; generated projections never establish authority. |
| Platform vision and work lifecycle | candidate | maintained-authority + retained-source | `docs/work-item-lifecycle-vision.md` and `docs/platform-foundations.md` (retained sources/locked wording); enter at `docs/platform/vision.md` (candidate entry/navigation) | `docs/work-item-lifecycle-vision.md` | Target vision is candidate ("Yes, after review"); retained root docs own locked mission/priority wording. |
| Whole-system architecture and component boundaries | candidate | maintained-authority + retained-source | `docs/architecture-map.md` (full architecture map); enter at `docs/platform/component-boundary.md` (candidate boundary portal) | `docs/architect/component-boundary/**` | `docs/architecture-map.md` owns full architecture map; component-boundary entry routes to detailed sources under `docs/architect/component-boundary/`. |
| System overview | legacy-current | maintained-authority | `docs/specs/system-overview.md` | None | Live Area Map and Shared Entities sections remain the consolidated current cross-area spec. |
| Work state / work lifecycle engine | legacy-current | maintained-authority + retained-source | `docs/specs/work-state.md` | `docs/io-contract.md`, `docs/work-item-lifecycle-vision.md` | `docs/specs/work-state.md` owns core state, events, fsm, store, and envelope. `docs/io-contract.md` owns CLI I/O contract. Candidate route `docs/platform/work-state/**` (scope candidate-target): candidate target, not read by any reader; canonical route stays `docs/specs/work-state.md`. |
| Runner / dispatch / merge lifecycle | legacy-current | maintained-authority | `docs/specs/runner.md` | `docs/routing-handoff-contract.md` | `docs/specs/runner.md` owns runner loop, dispatch, merge gate, and worker log. Agent-to-agent boundary owned by `docs/routing-handoff-contract.md`. |
| Packaging-distribution | promoted | maintained-authority + retained-source | `docs/platform/packaging-distribution/README.md` | `docs/specs/distribution.md`, `docs/distribution-vision.md`, `docs/architect/packaging-distribution/**` | Portal owns active navigation and implementation-alignment; legacy specs are consulted only in roles assigned by portal. |
| Host invocation routing | promoted | maintained-authority + retained-source | `docs/platform/host-invocation-routing/README.md` | `docs/architect/host-invocation-routing/**` | Portal owns active navigation; retained sources under `docs/architect/host-invocation-routing/**` remain legacy-current only where not drained. |
| Agent coordination | promoted | maintained-authority + history-evidence | `docs/platform/agent-coordination/README.md` | `docs/architect/agent-coordination/**`, `docs/specs/runner.md` | Target portal owns navigation and status summary; exact accepted contracts, schemas, ADRs, and verification remain in `docs/architect/agent-coordination/**` until explicitly superseded. |
| Agent confinement | legacy-current | maintained-authority | `docs/specs/confinement-authority.md` | `src/runner/dispatch/confinement/**` | Spec owns runtime confinement contract, machine backend registry, and driver rules; verified by test suite. |
| Claude plugin surface | legacy-current | maintained-authority | `docs/specs/fgos-plugin.md` | `plugins/fgOS/**` | Spec owns slash-command wrappers and plugin manifest behavior. |
| Herdr gateway and web dashboard | legacy-current | maintained-authority | `docs/specs/herdr-web-dashboard.md` | `docs/operator-runbook-herdr-cockpit.md`, `docs/specs/runner.md` | Spec owns web dashboard client behavior; runbook owns cockpit operations. |
| End-user authoring, index, and knowledge registry | non-authority | maintained-authority (user profile) + generated | `docs/specs/enduser-docs-authoring.md`, `docs/specs/enduser-docs-index.md` | `docs/doc-registry.{md,json}`, `docs/knowledge/**` | Distinct user/end-user knowledge corpus; does not own platform authority. |
| Decision citation drift | legacy-current | maintained-authority | `docs/specs/decision-citation-drift.md` | `scripts/check-decision-citation-drift.mjs` | Spec owns citation drift detection invariants and baseline ratchet rules. |
| Distillery / reference learning | legacy-current | maintained-authority | `docs/specs/distillery.md` | `.agents/skills/distill/SKILL.md` | Spec owns bounded reference-learning behavior; skill owns operational surface. |
| Observe (metrics and friction) | legacy-current | maintained-authority | `docs/specs/observe.md` | `packages/observe/rust/**` | Spec owns observation behavior (metrics and friction); the Rust package owns the implementation. |
| Skills and domainization | legacy-current | maintained-authority + generated | `domains/<domain>/AGENTS.md`, `docs/architect/domainization/README.md`, canonical skills (`.agents/skills/**`, `core/skills/**`) | `plugins/fgOS/skills/**` (generated mirrors) | `domains/<domain>/AGENTS.md` owns domain-specific doctrine; canonical skill definitions live in `.agents/skills/` and `core/skills/`; generated mirrors are projections. |
| UI specification | legacy-current | maintained-authority | `docs/ui-spec/00-overview.md` (entry for `docs/ui-spec/**`) | Relevant area spec | Visual and UI layout contracts; functional behavior owned by area specs. |
| Coexistence | legacy-current | maintained-authority | `docs/coexistence.md` | `src/install/coexist.mjs` | Living doctrine for running alongside foreign agent harnesses. |
| Documentation system | legacy-current | maintained-authority + retained-source | `docs/doc-governance.md` (governance); `docs/reading-map.md` (reader routing); this switchboard (authority routing) | `docs/platform/proposals/documentation-system-unification.md` (long-horizon proposal), `plans/260925-documentation-authority-unification/plan.md` (migration plan) | Governance and routing documents are active authority; proposal is non-canonical architecture; plan is active migration. |
```

## claim_b41c10df81d233d03104ac37d7195a0c

`docs/platform/documentation/switchboard.md#unheaded-block-5`
Unit SHA256: `478b035a4311b7f2a578cbd08ac4be552e1eebae3a016bec1791a3c396059cf7`
Shown SHA256: `478b035a4311b7f2a578cbd08ac4be552e1eebae3a016bec1791a3c396059cf7`

```text
| Root document | authorityStatus | fileClass | Current Role / Route |
|---|---|---|---|
| `docs/README.md` | legacy-current | maintained-authority | Top-level documentation overview. |
| `docs/architecture-map.md` | legacy-current | maintained-authority | Full current system architecture map (v0.2, ADR0010). |
| `docs/backlog.md` | non-authority | generated | Product backlog projection from event-sourced PBI records. Do not edit manually. |
| `docs/coexistence.md` | legacy-current | maintained-authority | Living doctrine for non-interference with foreign agent harnesses. |
| `docs/distribution-vision.md` | non-authority | retained-source | Historical vision; superseded for active navigation by Packaging-Distribution portal. |
| `docs/doc-governance.md` | legacy-current | maintained-authority | Canonical documentation governance (types, authority, placement, lifecycle). |
| `docs/doc-registry.md` | non-authority | generated | Projection of end-user knowledge registry; does not own platform authority. |
| `docs/id-systems-audit.md` | non-authority | history-evidence | Audit and rationale for identifier systems; non-authority evidence. |
| `docs/io-contract.md` | legacy-current | maintained-authority | Canonical CLI/runner I/O envelope and exit code contract. |
| `docs/operator-runbook-herdr-cockpit.md` | legacy-current | maintained-authority | Supported operator procedures for herdr cockpit. |
| `docs/platform-foundations.md` | legacy-current | maintained-authority | Canonical platform operating laws (L1–L8). Target file is summary/entry. |
| `docs/reading-map.md` | legacy-current | maintained-authority | Top-level reader routing; links to this switchboard. |
| `docs/routing-handoff-contract.md` | legacy-current | maintained-authority | Canonical agent-to-agent handoff contract and trust boundary. |
| `docs/work-item-lifecycle-vision.md` | non-authority | retained-source | Directional foundation; active navigation starts at `docs/platform/vision.md`. |
```

## claim_7ff57ecf53d4725f792ae1d2eb773b04

`docs/platform/documentation/switchboard.md#unheaded-block-6`
Unit SHA256: `6c8ffa6b696bd0d9cd1f281a052d676ddb98751b0c16bf663c16ae53c67003b7`
Shown SHA256: `6c8ffa6b696bd0d9cd1f281a052d676ddb98751b0c16bf663c16ae53c67003b7`

```text
1. **Identify the topic or claim** you need to read or update.
2. **Find the surface row** in Section 2 (Area Authority Routes) or Section 3 (Root Document Routes).
3. **If `authorityStatus` is `promoted`:**
   - Navigate to the promoted portal (`docs/platform/<area>/README.md`).
   - Follow the portal's explicit current-source mapping.
   - If the portal delegates the specific contract, ADR, or proof to a retained source, that retained source owns that claim.
4. **If `authorityStatus` is `legacy-current`:**
   - Navigate directly to the current canonical route listed in the table (typically `docs/specs/<area>.md` or root doc).
   - Do NOT attempt to read or author candidate files under `docs/platform/<area>/` for that topic.
5. **If `authorityStatus` is `candidate`:**
   - Enter at the target portal for orientation, but use the retained legacy source for binding claims.
   - Do not treat candidate text as binding authority until Phase 08 promotion.
6. **For authors during migration:**
   - Consult [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md).
   - Update only the single declared current owner.
   - Never dual-author.
   - Edits under legacy roots (`docs/specs`, `docs/architect`) require a reviewed exception in `scripts/check-legacy-docs-ratchet.exceptions.json`.
```

## claim_32457fbd57b803df6ad3f019e8a112eb

`docs/platform/documentation/switchboard.md#unheaded-block-7`
Unit SHA256: `510e84f66628bea9a409aa79883aaa8f3c91fb99b30fd5131a1a92cca7e723fc`
Shown SHA256: `510e84f66628bea9a409aa79883aaa8f3c91fb99b30fd5131a1a92cca7e723fc`

```text
| Relationship | File |
|---|---|
| reader orientation | [docs/reading-map.md](../../reading-map.md) |
| platform portal | [docs/platform/README.md](../README.md) |
| documentation governance | [docs/doc-governance.md](../../doc-governance.md) |
| migration authoring rules | [docs/platform/migration-authoring-rules.md](../migration-authoring-rules.md) |
| Phase 00 authority map (evidence) | [plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md](../../../plans/260925-documentation-authority-unification/current-authority-map-2026-09-25.md) |
| active unification plan | [plans/260925-documentation-authority-unification/plan.md](../../../plans/260925-documentation-authority-unification/plan.md) |
```

## claim_289c7284a3da9b223a96c0a62bb425fe

`docs/platform/governance.md#unheaded-block-2`
Unit SHA256: `405df32d0d9bc4863fd36d2af33005f1a29e06a3d0710c3f5f7de1fc3e52e765`
Shown SHA256: `405df32d0d9bc4863fd36d2af33005f1a29e06a3d0710c3f5f7de1fc3e52e765`

```text
This document is the governance contract for maintained fgOS documentation.
It defines how docs declare authority, where they belong, and how temporary
discussion becomes canonical knowledge.
```

## claim_d7588e6ef5a31ad8c7b104444d2a9594

`docs/platform/governance.md#unheaded-block-3`
Unit SHA256: `583f411b5ad348b19a1233ec6bebe2010de82b71453d6e995f3bd98db2aa481f`
Shown SHA256: `583f411b5ad348b19a1233ec6bebe2010de82b71453d6e995f3bd98db2aa481f`

```text
Documentation must support human presence. A human should be able to enter the
docs, understand the current shape, review trade-offs, challenge decisions, and
approve or reject agent recommendations without chat history.
```

## claim_2403077eb4c68fb4ad18f4aa5a8daf11

`docs/platform/governance.md#unheaded-block-4`
Unit SHA256: `64ab4802c8d34a064923c09ded3d7e4558195bb8af592cde664318e94ed46f38`
Shown SHA256: `64ab4802c8d34a064923c09ded3d7e4558195bb8af592cde664318e94ed46f38`

```text
One claim should have one owner. Other documents may summarize and link to that
claim, but must not fork authority.
```

## claim_3ea0f6d319afd9e84b6a642f58f91e07

`docs/platform/governance.md#unheaded-block-5`
Unit SHA256: `3a2144a14bfdeb20f5695c5a8320201e1e01a2bb773dafd3e5dc5bdd498fd748`
Shown SHA256: `3a2144a14bfdeb20f5695c5a8320201e1e01a2bb773dafd3e5dc5bdd498fd748`

```text
Agent authorship is provenance, not authority. Authority comes from document
type, status, owner, evidence, and approval.
```

## claim_27679f61b3c23810d58003e5bb07c70d

`docs/platform/governance.md#unheaded-block-6`
Unit SHA256: `7ef9b5241735031868e2cc5040922cbf257d86a58d6ff0b524efc98b21e0dea1`
Shown SHA256: `7ef9b5241735031868e2cc5040922cbf257d86a58d6ff0b524efc98b21e0dea1`

```text
Generated output never outranks its source.
```

## claim_aaa34e85df8d9f5ab183ad271e19541e

`docs/platform/governance.md#unheaded-block-7`
Unit SHA256: `ef21ba805cd74f7adf24adc665c8232ce5fc3effa92fb1f749087ad9fb9663af`
Shown SHA256: `ef21ba805cd74f7adf24adc665c8232ce5fc3effa92fb1f749087ad9fb9663af`

```text
Documentation is a reading graph, not only a set of files.
```

## claim_4ca189e9f160e3dfbc354112c549d161

`docs/platform/governance.md#unheaded-block-8`
Unit SHA256: `8760bf58d94690311beab037edc4d136902cd6381450fb2184ed4e654b5edcc5`
Shown SHA256: `8760bf58d94690311beab037edc4d136902cd6381450fb2184ed4e654b5edcc5`

````text
Target platform docs:

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    intent-preservation-ledger.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md
    contracts/
    decisions/
    verification/
    history/

    <area>/
      README.md
      vision.md
      intent-preservation-ledger.md
      spec.md
      subcomponents/
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
  knowledge/
  history/
```
````

## claim_5b5a580db0ae9d5c736f4ac01e521bc5

`docs/platform/governance.md#unheaded-block-9`
Unit SHA256: `a528a4cd176f459c5c3fbc34a3cd0bd333710cd992362ca8363da04be26a3966`
Shown SHA256: `a528a4cd176f459c5c3fbc34a3cd0bd333710cd992362ca8363da04be26a3966`

```text
There is no `docs/platform/system/` and no `docs/platform/areas/`.
Platform-wide authority lives directly under `docs/platform/`; area-specific
documentation lives under `docs/platform/<area>/`.
```

## claim_ca1f1e0a123a6575e789e8fb68eaa9fe

`docs/platform/governance.md#unheaded-block-10`
Unit SHA256: `bc65a01fb8f66e0dbdda47038d180d8e76746091c0629d26e18e57f1f0dfdabf`
Shown SHA256: `bc65a01fb8f66e0dbdda47038d180d8e76746091c0629d26e18e57f1f0dfdabf`

```text
During migration, existing `docs/specs/**` and `docs/architect/**` remain valid
legacy/current sources until their content is promoted or redirected.
```

## claim_6e5c73ef7deac391f60dc650ea36eeff

`docs/platform/governance.md#unheaded-block-11`
Unit SHA256: `7fd9e092c3fbfa09fca5d4be0da9bc155e4e83702c59c84d1789153bbeef3bfa`
Shown SHA256: `7fd9e092c3fbfa09fca5d4be0da9bc155e4e83702c59c84d1789153bbeef3bfa`

```text
External governed surfaces may remain outside `docs/`:
```

## claim_158be2e97aaeb89073804c1f6bca38a6

`docs/platform/governance.md#unheaded-block-12`
Unit SHA256: `fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9`
Shown SHA256: `fd6f97edf98ce6716fa567c1af023f6149a977a91fbfff2f704119881fc938d9`

````text
```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```
````

## claim_cd782363f7312fd63c77b95d75332c5a

`docs/platform/governance.md#unheaded-block-13`
Unit SHA256: `712b25def116afd126d457573aee97c662dafefa81fc405d6f94b5d4d03714f4`
Shown SHA256: `712b25def116afd126d457573aee97c662dafefa81fc405d6f94b5d4d03714f4`

```text
They are still governed by this taxonomy.
```

## claim_e9d0096bced5b17a13d762e199cd6e38

`docs/platform/governance.md#unheaded-block-14`
Unit SHA256: `5f867769c5cbc8969b6e84567141d62e3d7da073aa49942d89df51b7dec68d9d`
Shown SHA256: `5f867769c5cbc8969b6e84567141d62e3d7da073aa49942d89df51b7dec68d9d`

```text
| Type | Authority | Purpose |
|---|---|---|
| Area portal | Canonical navigation | Enter one platform area and choose what to read next |
| Subcomponent portal | Canonical sub-area navigation | Enter one child component inside a larger area |
| Vision | Direction authority | State the full intended direction, mission fit, and non-scope |
| Intent preservation ledger | Intent traceability authority | Preserve big-picture design intent across simplified implementation slices |
| Spec | Canonical state authority | Current behavior, state, entities, operations, and gaps |
| Architecture | Canonical design authority | Why, shape, boundaries, responsibilities, trade-offs |
| Contract | Canonical normative authority | Exact obligations, schemas, state rules, handoff rules |
| Decision | Canonical decision provenance | What was decided, why, alternatives, supersession |
| Verification | Evidence authority | Proof for a claim, contract, behavior, or decision |
| Proposal | Non-canonical candidate | A design option before acceptance |
| Discussion scratchpad | Non-canonical shaping memory | Active human-agent exploration before promotion |
| Guide / runbook | Operational guidance | How to perform supported workflows |
| Generated doc / index | Derived projection | Machine-written view from declared sources |
| History | Archive/evidence | Retired context, old discussions, migration source |
| Knowledge | Retrospective learning | Lessons and reusable observations, not direct design authority |
```

## claim_a17d655c580536a9024b8ce0c0bff030

`docs/platform/governance.md#unheaded-block-15`
Unit SHA256: `6ab5d773a4442551c9f288f9fd1a299276b7fc53b9bc5f150ca903d18def8225`
Shown SHA256: `6ab5d773a4442551c9f288f9fd1a299276b7fc53b9bc5f150ca903d18def8225`

```text
| Artifact | May establish | Must not establish |
|---|---|---|
| Discussion scratchpad | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Vision | North-star direction, full intended shape, mission/non-scope | Current implementation detail or phase proof |
| Intent preservation ledger | Preserved intent, deferred capabilities, must-not-preclude constraints, revisit triggers | Current behavior, new design by itself, unbounded wishlist |
| Area portal | Area ownership, subcomponent map, read-first routing | Detailed subcomponent behavior or hidden authority changes |
| Subcomponent portal | Child component ownership, read-first routing, local boundary summary | Area-wide ownership or cross-area contracts without parent links |
| Spec | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Boundaries, responsibility allocation, design rationale, trade-offs | Detailed present behavior as timeless truth |
| Contract | Exact obligations, invariants, inputs/outputs, compatibility | Optional guidance phrased as mandatory |
| Decision | Decision provenance and supersession | Silent rewriting of historical intent |
| Generated doc | Faithful projection of sources | New policy or interpretation |
| Guide/runbook | Supported procedure | Override of specs or contracts |
| History | Archived context | Current authority |
```

## claim_3e14226ae19efb44afc0e18696b01db5

`docs/platform/governance.md#unheaded-block-16`
Unit SHA256: `5bf700dc39385dc8534b7f6a711a1d46334c0e70ef1acb6957522abe15d664d9`
Shown SHA256: `5bf700dc39385dc8534b7f6a711a1d46334c0e70ef1acb6957522abe15d664d9`

```text
Conflict rules:

- Contracts outrank guides/runbooks.
- Current specs outrank stale architecture wording about present behavior.
- Newer approved decisions supersede older decisions.
- Generated output never outranks its source.
- A conflict is a documentation defect. Surface and reconcile it; do not let an
  agent silently choose a winner.
```

## claim_82642146e7b828e815d06cd9e38ebbfc

`docs/platform/governance.md#unheaded-block-17`
Unit SHA256: `75056aa118940baf3e88c1a2faad9eadbac3991bd4c2ccf55cdc8d8e69d3f502`
Shown SHA256: `75056aa118940baf3e88c1a2faad9eadbac3991bd4c2ccf55cdc8d8e69d3f502`

```text
Maintained docs should use a compact header. Use plain fields or front matter
consistently within a doc family.
```

## claim_2e3d498577d03a40ba522728e6ba13b5

`docs/platform/governance.md#unheaded-block-18`
Unit SHA256: `2e80ccc8f9bdb89a8d89f2898f3b7dbe80816921046df5580f02aaa32324584b`
Shown SHA256: `2e80ccc8f9bdb89a8d89f2898f3b7dbe80816921046df5580f02aaa32324584b`

````text
Required baseline:

```txt
Document type:
Audience:
Purpose:
Design status:
Implementation:
Provenance:
Writer type:
Canonical for:
Use this when:
Do not use this for:
Last reviewed:
Related:
```
````

## claim_bb256b5e3eb65746ca2a06fcc9c5bf0e

`docs/platform/governance.md#unheaded-block-19`
Unit SHA256: `271cdbab8602886c2eb00fa14e9522e5b70710e17fc560201c29616010bfb6f1`
Shown SHA256: `271cdbab8602886c2eb00fa14e9522e5b70710e17fc560201c29616010bfb6f1`

```text
Metadata is an orientation block, not the only navigation surface. Because this
project keeps metadata inside fenced code blocks, `Related:` entries are plain
text and do not render as clickable links. Any maintained doc that lists related
paths in metadata must also expose those relationships as markdown links in the
body, either in a dedicated `Related Files` section or an existing read-first /
canonical-docs table.
```

## claim_aaa72c913f079f0362774422779962d6

`docs/platform/governance.md#unheaded-block-20`
Unit SHA256: `bbd05650fff03e29629acc6cd54b07715cabbbc74d631593f73e5c308cb33708`
Shown SHA256: `bbd05650fff03e29629acc6cd54b07715cabbbc74d631593f73e5c308cb33708`

```text
Optional governance fields for higher-risk docs:
```

## claim_10abe46978bf5f36b25f304c205c47ea

`docs/platform/governance.md#unheaded-block-21`
Unit SHA256: `8e225cf56785a0a2d4458905f3873de96b44da193d48f5c6ee476d24238e1066`
Shown SHA256: `8e225cf56785a0a2d4458905f3873de96b44da193d48f5c6ee476d24238e1066`

````text
```txt
Owner:
Approvers:
Approved at:
Effective at:
Review due:
Supersedes:
Superseded by:
Evidence:
Change trigger:
```
````

## claim_74b29b91baf775a43b553fa78649c71f

`docs/platform/governance.md#unheaded-block-22`
Unit SHA256: `3a6dcb2e47ba74a351cb9c2daca6c6cd6fff98df8e40eec2f9c3e0d8a72d2561`
Shown SHA256: `3a6dcb2e47ba74a351cb9c2daca6c6cd6fff98df8e40eec2f9c3e0d8a72d2561`

```text
Docs that contain normative design or behavior claims should also track
implementation alignment. Use a compact table in the doc itself or link to a
verification doc:
```

## claim_d7a1b8363a17225037d4baee65a1757f

`docs/platform/governance.md#unheaded-block-23`
Unit SHA256: `3aa0f5b7584e22b3043a156283c5b43075f0ee29ba28dd1c5ef686fe1ad27e24`
Shown SHA256: `3aa0f5b7584e22b3043a156283c5b43075f0ee29ba28dd1c5ef686fe1ad27e24`

```text
| Design claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|
| Short, testable claim | `implemented`, `partial`, `planned`, `superseded`, or `unknown` | Code/test/doc links | What remains or why no action is needed |
```

## claim_4155af67ddd368b832baecf3ea044d8a

`docs/platform/governance.md#unheaded-block-24`
Unit SHA256: `3c8c296371bb5208297504c1672e81e4b82ee585b54be162bae0d7bd4b5544f0`
Shown SHA256: `3c8c296371bb5208297504c1672e81e4b82ee585b54be162bae0d7bd4b5544f0`

```text
Use this whenever design can move ahead of implementation. It prevents accepted
architecture, current shipped behavior, and future target state from collapsing
into one undifferentiated document.
```

## claim_d4d4b3d88a4c93fa154f799283a44165

`docs/platform/governance.md#unheaded-block-25`
Unit SHA256: `aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add`
Shown SHA256: `aa363dc9381146743f854ff9ce3429a15cc15f1c6a56364b34b542e06a9c7add`

```text
Generated docs additionally declare:
```

## claim_13628767ffbdca4338cb2da59a026540

`docs/platform/governance.md#unheaded-block-26`
Unit SHA256: `254b6fe8f459303477ac0d2ad489dcc3d01fd69b2aee918063c20d66406f675b`
Shown SHA256: `254b6fe8f459303477ac0d2ad489dcc3d01fd69b2aee918063c20d66406f675b`

````text
```txt
Source of truth:
Generator:
Generator version:
Generated at:
Freshness check:
Do not edit: true
```
````

## claim_2ab851b832d33fc40334031f5ff2d6e3

`docs/platform/governance.md#unheaded-block-27`
Unit SHA256: `07c04c58c784fe4f17444c92d5492e2800c34ce9ac4da840c114ef21e0ba0f29`
Shown SHA256: `07c04c58c784fe4f17444c92d5492e2800c34ce9ac4da840c114ef21e0ba0f29`

```text
| Writer type | Meaning |
|---|---|
| Human author | A person intentionally wrote or edited the doc |
| Human + agent coauthor | Human and agent shaped the doc together |
| Agent draft writer | Agent produced draft text for review |
| Runtime generator | A command writes a projection from source state |
| Build generator | A build/spec tool writes derived artifacts |
| Migration script | A controlled migration rewrites or moves docs |
| Execution worker | Worker/reviewer/panel writes evidence or reports |
| Mirror/projection writer | Setup/projection materializes runtime instruction copies |
| Registry/event writer | Event/state layer records facts later projected into docs |
```

## claim_132ed5b0aa7be61fde380b3286e92c93

`docs/platform/governance.md#unheaded-block-28`
Unit SHA256: `71369fc2f4512a23f3d862342ba71039f22035ac30881629e784bfe2c2daa7d6`
Shown SHA256: `71369fc2f4512a23f3d862342ba71039f22035ac30881629e784bfe2c2daa7d6`

```text
Use a discussion scratchpad for multi-round shaping.
```

## claim_afe8412d74d7b8fe2f2ee90de4872082

`docs/platform/governance.md#unheaded-block-29`
Unit SHA256: `c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07`
Shown SHA256: `c0000ebfd3df6287bae1b1bdb4ce65226e2b20b6459b438f90475e8e0c3f8e07`

````text
Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```
````

## claim_737d148640abfd2083a4c3181a67ee3c

`docs/platform/governance.md#unheaded-block-30`
Unit SHA256: `2f7e7af32084b843937efc37699aa6c623283562a4328117052cd584d7372333`
Shown SHA256: `2f7e7af32084b843937efc37699aa6c623283562a4328117052cd584d7372333`

```text
Rules:

- Mark it as non-canonical.
- Capture questions, hypotheses, evidence, proposals, tentative decisions, and
  promotion targets.
- Promote settled content into the right canonical document.
- Replace promoted content with a pointer or remove it from the scratchpad.
- Delete after draining by default.
- Archive only when the discussion itself has long-term diagnostic or rationale
  value.
```

## claim_00bee22a8c9a288d9cdc6051c3b6d288

`docs/platform/governance.md#unheaded-block-31`
Unit SHA256: `4baf8ebcc7c873fea3e1f7f6b5a66da8606e010600fc223f2358b1b9e0735d01`
Shown SHA256: `4baf8ebcc7c873fea3e1f7f6b5a66da8606e010600fc223f2358b1b9e0735d01`

```text
Promotion targets:

- Current truth -> spec.
- Full intended direction -> vision.
- Settled intent that is deferred or simplified in implementation -> intent
  preservation ledger.
- Design rationale or boundary -> architecture.
- Mandatory precision -> contract.
- Choice and rationale -> decision.
- Proof -> verification.
```

## claim_68005b83bb2c1a83434acdb56cbd2f8e

`docs/platform/governance.md#unheaded-block-32`
Unit SHA256: `c2b6a77542134ab59d46cdd5b888feb5914eecfd23cc945bf6278ad8e762828e`
Shown SHA256: `c2b6a77542134ab59d46cdd5b888feb5914eecfd23cc945bf6278ad8e762828e`

```text
Use an intent preservation ledger when an area has a full design direction that
will be implemented through smaller, simpler slices.
```

## claim_013805ddb96fd31f2bfd5351cefb9a94

`docs/platform/governance.md#unheaded-block-33`
Unit SHA256: `c109f65eaf9a8cb77f4761aef1eba002abddd31f4577d6d1eb3c4319ff8ffe20`
Shown SHA256: `c109f65eaf9a8cb77f4761aef1eba002abddd31f4577d6d1eb3c4319ff8ffe20`

```text
The ledger protects against a common failure mode: an agent later reads only the
simplified slice, mistakes it for the final intended shape, and extends the
system from that reduced form. The result is patchwork that drifts away from
the original vision.
```

## claim_d1ce93e387f1e8be255aebffe441c2f2

`docs/platform/governance.md#unheaded-block-34`
Unit SHA256: `d931f845e0473acf0cd4dcd87b399a9eb0a22a6fe13ccc47ae4299b850428c81`
Shown SHA256: `d931f845e0473acf0cd4dcd87b399a9eb0a22a6fe13ccc47ae4299b850428c81`

```text
Vision and intent ledger work together:
```

## claim_d0a69ac0621ef7d766b61ddd97f700cd

`docs/platform/governance.md#unheaded-block-35`
Unit SHA256: `cbcd46946204f1fee09cc538210be3a601fff688a5dc3d80693a266801610daf`
Shown SHA256: `cbcd46946204f1fee09cc538210be3a601fff688a5dc3d80693a266801610daf`

```text
| Document | Role |
|---|---|
| Vision | States the full intended direction and why it matters. |
| Intent preservation ledger | Tracks which parts of that intent are implemented, deferred-preserved, superseded, rejected, or still unknown. |
| Spec | States what is currently true. |
| Architecture | Explains the accepted design shape and trade-offs. |
| Verification | Proves whether current implementation matches the claim. |
```

## claim_60fedf3d264167af48b4564b61f84798

`docs/platform/governance.md#unheaded-block-36`
Unit SHA256: `33cdf0a2eddb5fedf99f57789161602fb8317475a23027d03a9bb311f2c1ebd6`
Shown SHA256: `33cdf0a2eddb5fedf99f57789161602fb8317475a23027d03a9bb311f2c1ebd6`

```text
Ledger entries should include:
```

## claim_ec1a9e0779c070ee067d8c0336a7ace8

`docs/platform/governance.md#unheaded-block-37`
Unit SHA256: `cba0b3b0edf54c0b57207b604486599011f90d42110e6b761309fc8682b08c1f`
Shown SHA256: `cba0b3b0edf54c0b57207b604486599011f90d42110e6b761309fc8682b08c1f`

```text
| Field | Meaning |
|---|---|
| `ID` | Stable area-scoped id, such as `AC-I004` or `HI-I002`. |
| `Original intent` | The full design intent that must not be lost. |
| `Source` | Vision, discussion, decision, or older source document. |
| `Status` | `implemented`, `partial`, `deferred-preserved`, `accepted-not-implemented`, `superseded`, `rejected`, or `unknown`. |
| `Current slice` | What the current simplified implementation actually covers. |
| `Must not preclude` | What future evolution must remain able to do. |
| `Revisit trigger` | Concrete condition that should reopen the intent. |
| `Proof / evidence` | Links to implementation, verification, or decision evidence. |
```

## claim_8d2d644c796466ee36b93f7c5b91ddcc

`docs/platform/governance.md#unheaded-block-38`
Unit SHA256: `0756c95549ccda581c1a34db1a971c70a94fd97cf12436ad67ffff69e35246c6`
Shown SHA256: `0756c95549ccda581c1a34db1a971c70a94fd97cf12436ad67ffff69e35246c6`

```text
Rules:

- A simple implementation does not shrink the vision by itself.
- Omission from a phase does not mean rejection.
- Mark a preserved intent `superseded` or `rejected` only with explicit human
  decision and rationale.
- Every implementation plan that narrows a vision should include an intent
  traceability table and a must-not-preclude check.
- Keep the ledger close to vision: platform-wide at
  `docs/platform/intent-preservation-ledger.md`, area-specific at
  `docs/platform/<area>/intent-preservation-ledger.md`.
```

## claim_bc714a9a506fd9ea5b27d7837be13a39

`docs/platform/governance.md#unheaded-block-39`
Unit SHA256: `a670e0c640fc61fbad780241925b7f6bfb462d556bdfbbe415e64fbbd3901be6`
Shown SHA256: `a670e0c640fc61fbad780241925b7f6bfb462d556bdfbbe415e64fbbd3901be6`

```text
Use subcomponent structure when one area contains multiple child components with
their own ownership, contracts, verification, or implementation status.
```

## claim_51693f21d28cb2d171f9676b098b8000

`docs/platform/governance.md#unheaded-block-40`
Unit SHA256: `bca34db225717d91dbb7f65331beb3711f03b821dc9bac7dc907762f8549f9b5`
Shown SHA256: `bca34db225717d91dbb7f65331beb3711f03b821dc9bac7dc907762f8549f9b5`

```text
An area can represent a whole platform component. A subcomponent is a child
inside that area. Subcomponents must make the area easier to understand; they
must not hide cross-area authority or create a second source of truth.
```

## claim_d845c0cbf3ed5cdcaec06705dd79ab18

`docs/platform/governance.md#unheaded-block-41`
Unit SHA256: `fa708f78f4d84fd2940db28767e941e4073362f9cea8aaaff6859c0b3c1ba8f5`
Shown SHA256: `fa708f78f4d84fd2940db28767e941e4073362f9cea8aaaff6859c0b3c1ba8f5`

````text
Default shape:

```txt
docs/platform/<area>/
  README.md
  vision.md
  intent-preservation-ledger.md
  spec.md
  subcomponents/
    README.md
    <subcomponent>/
      README.md
      spec.md
      architecture/
      contracts/
      verification/
      decisions/
      history/
```
````

## claim_86fc3d9b662c4e9df57d4210dd99e93e

`docs/platform/governance.md#unheaded-block-42`
Unit SHA256: `329fe80b5a5cbe6c9b8ebbc2822e1068f3f5dc727783467fd22b27c995746d01`
Shown SHA256: `329fe80b5a5cbe6c9b8ebbc2822e1068f3f5dc727783467fd22b27c995746d01`

```text
Rules:

- Every large area README should include a `Subcomponent Map`, even when
  subcomponents do not yet have their own directories.
- Create a subcomponent directory only when the child has enough independent
  behavior, contracts, proof, or lifecycle to justify local navigation.
- Area-level `vision.md` and `intent-preservation-ledger.md` remain the parent
  direction. A subcomponent may have its own vision/ledger only when its intent
  is large enough to drift independently.
- Area-level `spec.md` summarizes current area behavior and links to
  subcomponent specs; it does not duplicate every subcomponent detail.
- Subcomponent docs must link back to the parent area README and to the relevant
  `docs/platform/component-boundary.md` entry when read from
  this governance doc; inside area docs use the correct relative path.
- Cross-area contracts stay at the owning area or platform contract surface;
  subcomponent contract docs can own local obligations but must link to the
  cross-area owner.
- If a subcomponent changes parent/child component boundaries, update
  `docs/platform/component-boundary.md`.
```

## claim_021df8e923b522e5aa6215998df1569a

`docs/platform/governance.md#unheaded-block-43`
Unit SHA256: `dd5aff1f5dc2fe74b454024ee4255c92ba918457272d9d0be4ed6eccdeebc9f2`
Shown SHA256: `dd5aff1f5dc2fe74b454024ee4255c92ba918457272d9d0be4ed6eccdeebc9f2`

```text
Each document must have exactly one H1 heading, and that H1 is the document
title. All document sections start at H2. Do not use H1 for numbered sections,
subsections, banners, or visual grouping.
```

## claim_451f42c873ab0979ca4b8b0d0d8e387b

`docs/platform/governance.md#unheaded-block-44`
Unit SHA256: `06d281ea753e7ec1d95f50dae55193e34b538fe8195874b2d01798a080796781`
Shown SHA256: `06d281ea753e7ec1d95f50dae55193e34b538fe8195874b2d01798a080796781`

```text
Maintained canonical docs should use numbered section headings:
```

## claim_ef272e9ca7ccae45d543b0374f9a6228

`docs/platform/governance.md#unheaded-block-45`
Unit SHA256: `5c800aef28480e350bac45edcda063682bc286f36d3af6f3f9c8f4a50a3cbb1b`
Shown SHA256: `5c800aef28480e350bac45edcda063682bc286f36d3af6f3f9c8f4a50a3cbb1b`

````text
```txt
## 1. Current Summary
## 2. Scope
### 2.1. In Scope
### 2.2. Out Of Scope
```
````

## claim_16c62e2baad5715aaaf90a4ee70aabab

`docs/platform/governance.md#unheaded-block-46`
Unit SHA256: `0501041d62b847e86843fd774aa573fcacbb3bdb108cad89dc2bebe5c897af3b`
Shown SHA256: `0501041d62b847e86843fd774aa573fcacbb3bdb108cad89dc2bebe5c897af3b`

```text
Numbering makes sections easier to cite in reviews, discussions, decisions,
and migration notes. Keep numbers stable when possible; when a document is
heavily rewritten, clarity is more important than preserving old numbers.
```

## claim_616914821977564e3ab53ecd63668d69

`docs/platform/governance.md#unheaded-block-47`
Unit SHA256: `d314c5cf96c489c34e1fdf285fb549197884a92bdb4ba761d791d454a4a33b78`
Shown SHA256: `d314c5cf96c489c34e1fdf285fb549197884a92bdb4ba761d791d454a4a33b78`

```text
Discussion scratchpads should also use numbered headings once they stabilize,
but raw discussion logs may remain chronological and unnumbered.
```

## claim_1659bc1f21fd385894865693c35490da

`docs/platform/governance.md#unheaded-block-48`
Unit SHA256: `e000f2d1ab0d48fc71804707f7bb38c5efd27d6a1d4121659a4ce97c37ee34de`
Shown SHA256: `e000f2d1ab0d48fc71804707f7bb38c5efd27d6a1d4121659a4ce97c37ee34de`

```text
Use links to preserve the reading graph.
```

## claim_bb9f4e88698c2691d4eb9ea9baace6df

`docs/platform/governance.md#unheaded-block-49`
Unit SHA256: `4d943f7228ef56c8c8f3f8f81bdfabf3ad2b89b0157ca17824ea4079392b4bd2`
Shown SHA256: `4d943f7228ef56c8c8f3f8f81bdfabf3ad2b89b0157ca17824ea4079392b4bd2`

```text
- Area README links to spec, architecture, contracts, verification, active
  proposals/discussions, and related areas.
- Area README links to its subcomponent map and child component portals.
- Subcomponent README links to parent area README, parent spec, local spec,
  local contracts, local verification, and relevant boundary entries.
- Spec links to area README, owned/consumed contracts, architecture,
  verification, and relevant platform laws.
- Architecture links to affected specs, contracts, decisions, and proof.
- Contract links to owner, consumers, implementation/source when applicable,
  tests/proof, and compatibility notes.
- Decision links to affected docs, evidence, and supersession.
- Verification links to the claim it proves and any known limitations.
```

## claim_adca9a83a1e5b564d7e0be9155ba48bc

`docs/platform/governance.md#unheaded-block-50`
Unit SHA256: `32f8cf8cf39c3c15ad779f897968d2b2bee724206884508f9e0d5f6d9e8f302d`
Shown SHA256: `32f8cf8cf39c3c15ad779f897968d2b2bee724206884508f9e0d5f6d9e8f302d`

```text
Related-file rule:

- `Related:` in metadata is for quick scanning and machine-readable path hints.
- Renderable related-file links belong in the document body.
- Prefer relative markdown links so docs remain readable after checkout moves,
  rendered previews, and future path migrations.
- Use typed relationship labels such as `defines`, `constrains`,
  `evidenced by`, `supersedes`, `consumes`, or `source during migration`.
- If a related file is planned but not created yet, mark it explicitly as
  `planned` instead of leaving an unclickable or broken path.
```

## claim_2cacf92d42ea9cd8c0046f318de2dd18

`docs/platform/governance.md#unheaded-block-51`
Unit SHA256: `7d63e10ab7e1a99a6ff8a9670bf281b5cca0e3875d33ae93c2061088c086c6d8`
Shown SHA256: `7d63e10ab7e1a99a6ff8a9670bf281b5cca0e3875d33ae93c2061088c086c6d8`

```text
Component-boundary discipline:
```

## claim_8fe2212c58033f3f1fdf75450156c9ae

`docs/platform/governance.md#unheaded-block-52`
Unit SHA256: `12a9e47028aa5b4d5742097c4ea67e636a7f11966828f1ae240a25433d6246c2`
Shown SHA256: `12a9e47028aa5b4d5742097c4ea67e636a7f11966828f1ae240a25433d6246c2`

```text
- Any doc change that creates, removes, renames, splits, merges, or reassigns a
  component must check `docs/platform/component-boundary.md`.
- Any design change that moves ownership of a state write, runtime authority,
  decision, cross-area contract, or parent/child component relationship must
  update `docs/platform/component-boundary.md` or its current detailed source.
- If the component boundary does not change, record `No component-boundary
  change` in the implementation alignment table, verification note, discussion
  summary, or PR note.
- Area docs should link to the relevant component-boundary entry whenever the
  area owns or consumes a cross-area boundary.
```

## claim_13ca01dd43fa865c1e11bdb062a0fc95

`docs/platform/governance.md#unheaded-block-53`
Unit SHA256: `397d40f9f3b2096d39de73b6ccafc470be8a866293f57403071dac00df5b03b3`
Shown SHA256: `397d40f9f3b2096d39de73b6ccafc470be8a866293f57403071dac00df5b03b3`

```text
Prefer typed relationships where useful:
```

## claim_98a68f03fea389a1ae3ad3d58cfb26dd

`docs/platform/governance.md#unheaded-block-54`
Unit SHA256: `8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080`
Shown SHA256: `8763ac2ff0db101fb4b502912c8ba6e49e1974ec45d8595b72a4169f5b517080`

````text
```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```
````

## claim_c8f90f96e3d1aac13140102bb1dc6fa2

`docs/platform/governance.md#unheaded-block-55`
Unit SHA256: `d2c935327a9eb6d9befaf8551711ded970e9de085c6668d273e69e19d036ce71`
Shown SHA256: `d2c935327a9eb6d9befaf8551711ded970e9de085c6668d273e69e19d036ce71`

```text
fgOS uses a native documentation model.
```

## claim_e39f70e3c138402f9c6ff291d90f5130

`docs/platform/governance.md#unheaded-block-56`
Unit SHA256: `ea05a9a041f0f7df71bd69ab309d852e122647965ac27347164eb1ebe0578997`
Shown SHA256: `ea05a9a041f0f7df71bd69ab309d852e122647965ac27347164eb1ebe0578997`

```text
- Diataxis applies to `docs/user/**`.
- Google developer style influences clarity, directness, and scan-friendly
  writing.
- OKF-like ideas influence typed metadata, indexes, and git-readable knowledge.
```

## claim_bac716b34a510369526925137d913d22

`docs/platform/governance.md#unheaded-block-57`
Unit SHA256: `f5ff0c034503afcd758f0ece12a91bd5caac3a3da7402ce8639af5394bb7625f`
Shown SHA256: `f5ff0c034503afcd758f0ece12a91bd5caac3a3da7402ce8639af5394bb7625f`

```text
These influences do not replace fgOS authority and provenance rules.
```

## claim_f059a14a95c0a0e05173153d4d94297c

`docs/platform/governance.md#unheaded-block-58`
Unit SHA256: `426abc17fc8695a142ead7ec695212122655219c4a6f7a7566a729084eb08448`
Shown SHA256: `426abc17fc8695a142ead7ec695212122655219c4a6f7a7566a729084eb08448`

```text
Do not bulk-move old docs before classifying them by type, authority, lifecycle,
provenance, and claim ownership. Content may be transformed and reviewed one
area at a time, but the authorized migration program must declare whether
promotion is per-area or repository-wide; transformation order alone never
changes authority.
```

## claim_394ba795ecc7345a44cff852a787de0b

`docs/platform/governance.md#unheaded-block-59`
Unit SHA256: `fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3`
Shown SHA256: `fb5565f1a415763fd84e9474b968e9780d3cf1ede3d0bdc242c58b499f90bfc3`

```text
Until a newer program is explicitly accepted, each area portal's current-source
mapping controls, operationalized through [transitional-switchboard.md](../transitional-switchboard.md).
Authors during migration must follow [platform/migration-authoring-rules.md](migration-authoring-rules.md)
(one claim, one canonical owner, never dual-author prose, ratchet enforcement on legacy roots).
A target marked partial/candidate does not outrank that map, and readers must surface
conflicts rather than infer authority from path or date. Any redirect/stub must be
explicitly read-only and temporary. The proposed repository-wide normalization and
alias-based retirement model is documented in
`platform/proposals/documentation-system-unification.md` and is not active merely
because its plan exists.
```

## claim_c810411255d8383db9a186eb780c0b44

`docs/platform/governance.md#unheaded-block-60`
Unit SHA256: `0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b`
Shown SHA256: `0729946d01afffc2b5800527271a368947d3971968759a447bd51eec81f15f5b`

```text
| Relationship | File |
|---|---|
| documentation portal | [README.md](../README.md) |
| reader routing | [reading-map.md](../reading-map.md) |
| operative transitional switchboard | [transitional-switchboard.md](../transitional-switchboard.md) |
| migration authoring rules | [platform/migration-authoring-rules.md](migration-authoring-rules.md) |
| platform portal | [platform/README.md](README.md) |
| source design discussion | [architect/documentation-system-design.md](../architect/documentation-system-design.md) |
```

## claim_a654456b13b682631d00882c45a30f4a

`docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml#file-block`
Unit SHA256: `9f200578ea39b4b465fcdccdc76d842ab31ac85079bfba6eca90b97ff077c09f`
Shown SHA256: `445be31f29f8480854aa28c3c3661363e80c0d60aabc21efa6790e9c8ba287b1`

```text
openapi: 3.1.0
x-contract: "CTR010 · fgos-gateway.v1"
info:
  title: fgOS Gateway API
  version: 1.0.0
  description: |
    HTTP+JSON surface of the fgOS interface daemon (tsk-7l9, decision 0014
    "Kien truc giao tiep nguoi <-> fgOS", model 3: core-library + thin
    adapters). Written before the daemon is implemented, per this
    contract's own action: a stable spec for D9's future MCP search tool
    and any client (web dashboard, desktop) to build against, not
    reverse-engineered documentation of routes that already exist.

    Scope, locked by 0014:
      - The daemon is a CONSUMER of fgOS core, never a co-writer. Every
        write in this API is a thin wrapper over `spawn fgos <verb>`
        (CTR001/CTR002 one-door-write); every read is a wrapper over
        `fgos list` / `fgos rollup` / `fgos show` plus the `data_hash`
        cheap-poll field already on every envelope. This gateway invents
        no new write path into `.fgos/`.
      - The daemon becomes the one control-plane that can drive BOTH
        interactive session workflows (what herdr/TUI panes do today via
        `fgos session start/end`) and the headless runner
        (`fgos-runner --once`) — see `/v1/sessions` and `/v1/runner/tick`.
      - The attention/push channel (STR48, contract CTR008, status
        `idea`) is explicitly OUT of scope for v1 — 0014 point 6 keeps it
        a separate subsystem with its own delivery-semantics record.
        Clients poll `data_hash` on read endpoints until CTR008 lands.
      - Identity here is ATTRIBUTION, not authentication (same non-goal
        CTR001 already states for the CLI's own `writer` field): every
        route below other than `/contract` itself requires the shared
        per-machine bearer token (D4, `securitySchemes.bearerAuth`) — that
        token gates ACCESS to the gateway, not per-caller IDENTITY. Who a
        caller claims to be beyond holding that one shared token is STR38,
        explicitly out of scope of 0014 itself.

    Envelope reuse: every successful response body is the SAME `fgos.v1`
    envelope (CTR001) the CLI already emits on stdout — `{contract,
    generated_at, data_hash, data}` — carried unmodified inside the HTTP
    body. This mirrors the precedent `fgos-runner.mjs` already set
    (str46-io-contract D6): reuse CTR001's envelope as the version token
    across a new transport rather than minting a second, parallel one.
    HTTP status code + this envelope's `contract` field together answer
    "did the call succeed"; never branch on message text (docs/io-contract.md).

  contact:
    name: fgOS
    url: https://github.com
  x-decisions:
    - docs/decisions/0011-version-tuong-minh-cho-moi-contract.md
    - docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md
  x-specs:
    - docs/io-contract.md
    - docs/specs/work-state.md
    - docs/specs/runner.md

servers:
  - url: http://localhost:{port}/v1
    description: Local daemon (default deployment shape per 0014 point 3-4 — standalone adapter, not always-on by default)
    variables:
      port:
        default: "4170"

# tsk-4qf: every operation inherits this (D4's real, already-enforced
# require_token gate) unless it overrides with its own `security: []` --
# today only `/contract` does, since a client has to read the contract
# before it can know a token is even required.
security:
  - bearerAuth: []

tags:
  - name: work
    description: Work-item lifecycle (read + write), one-to-one with `fgos list/show/submit/move/ask/answer` etc.
  - name: frontier
    description: Read-only frontier/rollup/graph views used for dashboards.
  - name: orchestration
    description: The two process families the daemon controls per 0014 — interactive sessions and the headless runner.
  - name: meta
    description: Self-description of the gateway's own API surface — lets a client discover the contract instead of hand-tracking a separate doc.

paths:
  /contract:
    get:
      operationId: getContract
      tags: [meta]
      summary: The gateway's own OpenAPI spec, verbatim (this document)
      description: |
        Serves this exact spec file so an agent (or any other client) can
        read the full route/schema surface and self-implement a client
        against it, rather than needing this doc handed to it out of band.
        The one route NOT behind the auth gate below — a client has to be
        able to read the contract before it can know a token is even
        required (D4). Never wrapped in the `fgos.v1` envelope: this is the
        spec document itself, not a poll of fgOS state.
      security: []
      responses:
        '200':
          description: OK
          content:
            application/yaml:
              schema:
                type: string
                description: This same OpenAPI document, byte-for-byte.

  /work:
    get:
      operationId: listWork
      tags: [work]
      summary: List work items (wraps `fgos list`)
      description: |
        Read-only, no write side effect. Defaults to open-only (status not
        `done`/`wontfix`/`retrospective`/`cleanup`), same default as the
        CLI. Supports the CLI's own opaque-cursor pagination — pass
        neither `cursor` nor `limit` for the full set.
      parameters:
        - name: status
          in: query
          schema: { type: string }
          description: Filter by exact status value.
        - name: step
          in: query
          schema: { type: string }
        - name: all
          in: query
          schema: { type: boolean, default: false }
          description: Include done/wontfix/retrospective/cleanup items.
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              work:
                                type: object
                                additionalProperties: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

    post:
      operationId: submitWork
      tags: [work]
      summary: Intake free-text work (wraps `fgos submit`)
      description: |
        Derives title/tier/kind/risk and auto-classifies domain. This is
        the one gateway-side write that creates state that did not exist
        before — every other write endpoint below acts on an existing id.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text:
                  type: string
                  description: Untrusted free text (RUL45) — passed through as a single argv element, never spliced into a shell command.
      responses:
        '200':
          description: Created
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: showWork
      tags: [work]
      summary: Full detail of one item (wraps `fgos show`)
      description: The work record plus every log scoped to just this id (discovery/decisions/gates/outcome/friction/settlement/learning).
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      # tsk-4id: corrected from `WorkItem` -- this endpoint's
                      # own description already said "plus every log scoped
                      # to just this id", but the schema reference never
                      # matched it. Confirmed via a real `fgos show` run
                      # (docs/history/tsk-4id-task-detail-screen/RESEARCH.md):
                      # `data` is `{work, discovery, decisions, gates,
                      # outcome, friction, settlement, learning}`, never a
                      # bare `WorkItem`.
                      data: { $ref: '#/components/schemas/WorkDetail' }
        default:
          $ref: '#/components/responses/Error'
    patch:
      operationId: editWork
      tags: [work]
      summary: Partial update of an existing item's editable fields (wraps `fgos edit`)
      description: |
        PATCH, not PUT: only fields present in the body change (tsk-41h,
        D1 of docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md)
        -- this is `fgos edit`'s own partial-update semantics, never a
        full-resource replace. Every field is optional; the request body
        is `EditableWorkFields` (a strict subset of `WorkItem`'s own
        properties -- `id`/`status`/`domain` are never editable through
        this route). A field this route does not recognize is silently
        dropped, same as an unrecognized flag on the CLI's own `edit`
        command -- this route translates to `fgos edit`, it does not
        re-validate what the engine already validates (area spec R2).
        `fgos edit` itself refuses when no field actually changes; that
        refusal reaches the caller verbatim as the same `ErrorEnvelope`
        every other write route already uses, never swallowed or
        replaced with a client-side check.
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/EditableWorkFields' }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/docs:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: getWorkDocs
      tags: [work]
      summary: An item's docsRef narrative -- CONTEXT.md/plan.md raw content (tsk-4id)
      description: |
        The task-detail screen's own primary content source for "what the
        agent did" (D3 of docs/history/herdr-web-dashboard/CONTEXT.md:
        CONTEXT.md/plan.md is the human narrative, the primary account --
        `decisions[]` on `GET /work/{id}` is expandable detail only, never
        the default). Did not exist before this item: a browser client
        has no filesystem access, and no other route reads an arbitrary
        repo file. `docsRef` is canonicalized and checked to resolve
        inside `docs/history/` before any read -- a value that escapes it
        is refused (`category: validation`), never followed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          docsRef: { type: string, nullable: true }
                          contextMd: { type: string, nullable: true, description: "Raw CONTEXT.md content, or null if absent/unreadable." }
                          planMd: { type: string, nullable: true, description: "Raw plan.md content, or null if absent/unreadable." }
                          narrativeMissing:
                            type: boolean
                            description: "Present and true only when docsRef names a directory that does not exist on this machine (area spec Edge Cases: shown without its narrative, never a failure)."
        default:
          $ref: '#/components/responses/Error'

  /work/{id}/move:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: moveWork
      tags: [work]
      summary: Move a work item through the status FSM (wraps `fgos move`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [to]
              properties:
                to: { type: string, description: Target status. }
                expect: { type: string, description: Optional CAS guard — current status expected before the move. }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/ask:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: askWork
      tags: [work]
      summary: Park an item in awaiting-human with a question (wraps `fgos ask`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/answer:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: answerWork
      tags: [work]
      summary: Answer a parked question and resume the item (wraps `fgos answer`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text]
              properties:
                text: { type: string }
                approve: { type: boolean, description: "Explicit approval signal for consent gates. When true, forwards --approve to fgos answer." }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/take:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: takeWork
      tags: [work]
      summary: Claim an item through the pull door (wraps `fgos take`/`fgos pick`)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [human, session]
                  default: session
                  description: |
                    take --role's real, deliberately-scoped vocabulary
                    (bin/fgos.mjs's own S2-pull D1) — the pull door
                    excludes the runner role by design, not by omission.
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/return:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: returnWork
      tags: [work]
      summary: Complete a take — run verify, advance to awaiting-approval (wraps `fgos return`)
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/approve:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: approveWork
      tags: [work]
      summary: Merge an awaiting-approval item and move it to delivered (wraps `fgos approve`)
      description: "Carries `externalEffect: true` in the CLI's own verb registry (may open/merge a real PR) — same meaning here."
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /work/{id}/reject:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    post:
      operationId: rejectWork
      tags: [work]
      summary: Reject an awaiting-approval item back to todo (wraps `fgos reject`)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [reason]
              properties:
                reason: { type: string }
      responses:
        '200': { $ref: '#/components/responses/WorkOk' }
        default: { $ref: '#/components/responses/Error' }

  /ready:
    get:
      operationId: listReady
      tags: [frontier]
      summary: The frontier — items ready to be taken right now (wraps `fgos ready`)
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        allOf:
                          - $ref: '#/components/schemas/Page'
                          - type: object
                            properties:
                              items:
                                type: array
                                items: { $ref: '#/components/schemas/WorkItem' }
        default:
          $ref: '#/components/responses/Error'

  /rollup/{id}:
    parameters:
      - $ref: '#/components/parameters/WorkId'
    get:
      operationId: rollupWork
      tags: [frontier]
      summary: Progress rollup of one root/goalTier item's children (wraps `fgos rollup`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Rollup shape, opaque to this contract — see docs/specs/work-state.md. }
        default:
          $ref: '#/components/responses/Error'

  /graph:
    get:
      operationId: workGraph
      tags: [frontier]
      summary: Work-graph metrics — connected components, critical path (wraps `fgos graph`)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { type: object, description: Graph metrics shape, opaque to this contract. }
        default:
          $ref: '#/components/responses/Error'

  /state/digest:
    get:
      operationId: stateDigest
      tags: [frontier]
      summary: Cheap-poll digest — `data_hash` + `generated_at` only, no `data` body
      description: |
        The poll-driven half of 0014's "poll `fgos list`/`rollup` +
        `data_hash`" pattern: a client holds the last `data_hash` it saw
        and calls this endpoint on an interval; a changed hash is the
        only signal needed to decide whether to re-fetch a full read
        endpoint. This is a genuinely new route (no CLI verb returns only
        the digest today) — it exists so a client never has to pay the
        cost of a full `fgos list` just to learn nothing changed.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [contract, generated_at, data_hash]
                properties:
                  contract: { type: string, const: fgos.v1 }
                  generated_at: { type: string, format: date-time }
                  data_hash: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /sessions:
    post:
      operationId: startSession
      tags: [orchestration]
      summary: Open an interactive session worktree (wraps `fgos session start`)
      description: |
        Interactive-session half of 0014's orchestration scope — what a
        herdr/TUI pane does today by shelling out directly. A future
        web/desktop client drives the same lifecycle through this route
        instead of spawning its own git worktree.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                item: { type: string, description: Optional work item id to open the session against. }
      responses:
        '200':
          description: Session opened
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data: { $ref: '#/components/schemas/Session' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    delete:
      operationId: endSession
      tags: [orchestration]
      summary: Close an interactive session worktree (wraps `fgos session end`)
      parameters:
        - name: force
          in: query
          schema: { type: boolean, default: false }
      responses:
        '200':
          description: Session closed
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Envelope' }
        default:
          $ref: '#/components/responses/Error'

  /sessions/{sessionId}/slots:
    parameters:
      - name: sessionId
        in: path
        required: true
        schema: { type: string }
    get:
      operationId: sessionSlots
      tags: [orchestration]
      summary: Worker-slot occupancy for one session (wraps `fgos slots`, session-scoped)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          execution:
                            type: object
                            properties:
                              occupied: { type: integer }
                              items:
                                type: array
                                items:
                                  type: object
                                  properties:
                                    id: { type: string }
                                    sessionId: { type: string }
                                    claimRole: { type: string }
        default:
          $ref: '#/components/responses/Error'

  /runner/tick:
    post:
      operationId: runnerTick
      tags: [orchestration]
      summary: Drive one headless-runner cycle (wraps `fgos-runner --once`)
      description: |
        Headless half of 0014's orchestration scope: gather-back, find
        work, dispatch it through its full "One vong --once" lifecycle
        (docs/specs/runner.md), and return once that cycle's own outcome
        is settled. A `--watch`-equivalent continuous mode is deliberately
        NOT exposed here in v1 — a long-lived HTTP request modeling a
        long-lived poll loop is a scope decision for the daemon
        implementation item, not something this contract should force by
        assuming a streaming transport (SSE/WebSocket) that 0014 never
        locked.
      responses:
        '200':
          description: Cycle completed (including "nothing to do")
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/Envelope'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          dispatched: { type: array, items: { type: string }, description: Work item ids touched this cycle. }
        '429':
          description: Runner busy (mirrors CLI `EXIT_BUSY`, category `busy`).
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ErrorEnvelope' }
        default:
          $ref: '#/components/responses/Error'

components:
  securitySchemes:
    # tsk-4qf: matches require_token's own real enforcement (D4) -- one
    # shared token per machine, read from ~/.fgos/config.json's
    # gateway.token, checked as a plain Bearer header (not a per-user
    # credential; see this document's own top-level "Identity here is
    # ATTRIBUTION, not authentication" note).
    bearerAuth:
      type: http
      scheme: bearer
      description: |
        The one shared per-machine token (D4). Every route below this
        component list requires it except `/contract`, which overrides
        with its own `security: []`.
  parameters:
    WorkId:
      name: id
      in: path
      required: true
      schema: { type: string }
      description: Work item id.
    Cursor:
      name: cursor
      in: query
      schema: { type: string }
      description: Opaque cursor from a prior page's `nextCursor`. Never hand-constructed by a client.
    Limit:
      name: limit
      in: query
      schema: { type: integer, minimum: 1 }
  responses:
    WorkOk:
      description: OK
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/Envelope'
              - type: object
                properties:
                  data: { $ref: '#/components/schemas/WorkItem' }
    Error:
      description: |
        Any non-2xx. Never bodied by the plain `fgos.v1` envelope — branch
        on HTTP status + this body's `category`, never on `message` text
        (docs/io-contract.md: "Consumer re nhanh theo ma thoat pham tru,
        khong bao gio theo thong diep" — the same rule, ported to HTTP).
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorEnvelope' }

  schemas:
    Envelope:
      type: object
      required: [contract, generated_at, data_hash, data]
      properties:
        contract: { type: string, const: fgos.v1 }
        generated_at: { type: string, format: date-time }
        data_hash: { type: string }
        data: {}
      description: CTR001's envelope, reused verbatim as the HTTP body (see this contract's top-level description).

    Page:
      type: object
      properties:
        nextCursor:
          type: string
          nullable: true
          description: Opaque; null once the set is exhausted. Only present when `cursor`/`limit` was passed.

    WorkItem:
      type: object
      description: |
        Subset of the work-item shape stable enough to publish here; the
        authoritative shape is docs/specs/work-state.md (schema version
        carried in the event log per decision 0007, not duplicated here
        per 0011's own rule against re-deriving a schema this contract
        does not own).
      required: [id, title, kind, status]
      properties:
        id: { type: string }
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        status: { type: string }
        workflowStep: { type: string }
        tier: { type: string }
        risk: { type: string }
        domain: { type: string }
        parent: { type: string, nullable: true }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        verify: { type: string }
        docsRef: { type: string, nullable: true, description: "Path under docs/history/ -- content readable via GET /work/{id}/docs (tsk-4id)." }

    WorkDetail:
      type: object
      description: |
        `GET /work/{id}`'s real `data` shape (tsk-4id, corrected from a
        stale `WorkItem`-only reference -- this endpoint's own summary
        already said "plus every log scoped to just this id"). Every
        sub-shape below is `type: object` with `additionalProperties: true`
        rather than fully enumerated: these are the raw work-state logs
        (`docs/specs/work-state.md` is their authoritative shape per
        0011's own rule against re-deriving a schema this contract does
        not own), and the task-detail screen (tsk-4id) reads only a named
        few real keys from each (documented per-property below) rather
        than this contract asserting an exhaustive shape it would then
        have to keep in lockstep with every future log field.
      required: [work]
      properties:
        work: { $ref: '#/components/schemas/WorkItem' }
        discovery: { type: array, items: { type: object }, description: Verdict history for this item's discovery stage. }
        decisions:
          type: array
          description: The machine decision log -- NOT the primary "what the agent did" account (that is GET /work/{id}/docs's CONTEXT.md/plan.md); shown collapsed behind a disclosure, per its own count.
          items: { type: object }
        gates:
          type: object
          description: |
            Keyed by gate name (`contextApprove`/`planApprove`/
            `validateApprove`, each `{actor, at, verify}` when present)
            PLUS the ask/answer-parking fields on the SAME object:
            `ask` (string, most recent question), `askHistory` (string
            array, oldest-first, every question this item was ever
            parked with), `answer` (string, most recent answer),
            `statusAtAsk` (string, the status the item was in when most
            recently parked).
          additionalProperties: true
        outcome: { type: object }
        friction: { type: object }
        settlement:
          type: object
          description: |
            `count` (integer, the TRUE total) and `recent` (array, capped
            at 5 most-recent-first entries across every settlement kind --
            `SETTLEMENT_DISPLAY_CAP`. Each entry: `{kind, role, ts,
            detail, id}`; `kind: "answer"` entries are what pairs
            positionally with `gates.askHistory`, oldest-available-first
            after reversing `recent`'s own newest-first order). A round
            older than the 5-answer window has no entry here at all --
            this is a real, load-bearing cap, not a client-side choice.
          properties:
            count: { type: integer }
            recent: { type: array, items: { type: object } }
        learning: { type: object, nullable: true }

    EditableWorkFields:
      type: object
      description: |
        tsk-41h: `PATCH /work/{id}`'s request body -- every field
        `src/state/store.mjs`'s `EDITABLE_FIELDS` allows `fgos edit` to
        change (25 entries, read directly from that constant, never
        re-guessed). All optional; only fields present in the body are
        patched. `id`/`status`/`domain`/`workflowStep` are never editable through
        this route (`status` moves only through `/work/{id}/move`,
        `workflowStep`/`domain` only through the engine's own step
        transitions -- neither is in `EDITABLE_FIELDS`).
      properties:
        title: { type: string }
        description: { type: string }
        kind: { type: string }
        risk: { type: string }
        verify: { type: string }
        tier: { type: string }
        refs: { type: array, items: { type: string } }
        deps: { type: array, items: { type: string } }
        footprint: { type: array, items: { type: string } }
        acceptance:
          type: array
          description: Replaces the whole array (latest-wins), never a deep merge. Each clause is `{text, evidence}`.
          items: { type: object }
        priority: { type: integer }
        intent: { type: integer }
        docsRef: { type: string, description: "Non-empty path, or omit to leave unchanged. There is no clear-to-empty form on this route." }
        parent: { type: string, nullable: true, description: "Empty string clears (un-parents) the item." }
        urgent:
          type: string
          enum: [low, medium, high, critical]
          description: "Despite the name, a string enum (confirmed via a live `fgos edit --urgent` smoke test: the literal boolean `true` is rejected by the engine), not a boolean flag."
        impact: { type: number }
        effort: { type: number }
        action: { type: string, description: "Action directive prose." }
        mergeAfter: { type: array, items: { type: string } }
        supersededBy: { type: string, nullable: true, description: "Empty string clears." }
        duplicates: { type: array, items: { type: string } }
        domainFields:
          type: object
          description: Replaces the whole object (latest-wins) for the item's `domain`, never a deep merge of nested keys.
        goalTier: { type: string, description: "'mvp' or 'milestone'." }
        nextOperation: { type: string, nullable: true, description: "Next recommended stage operation or fix operation. Empty string or null clears." }
        secondaryOperation: { type: string, nullable: true, description: "Active secondary consult/review operation. Empty string or null clears." }

    Session:
      type: object
      required: [sessionId, worktree, branch]
      properties:
        sessionId: { type: string }
        worktree: { type: string }
        branch: { type: string }
        item: { type: string, nullable: true }

    ErrorEnvelope:
      type: object
      required: [category]
      properties:
        category:
          type: string
          description: |
            The one CLOSED taxonomy CTR001 already defines
            (src/state/store.mjs's EXIT_CODES + loop.mjs's EXIT_BUSY) —
            this gateway adds no categories of its own:
          enum:
            - precondition
            - conflict
            - validation
            - corrupt-log
            - lock-timeout
            - session-fail
            - merge-fail
            - busy
            - unexpected
        message:
          type: string
          description: Human-readable diagnostic. Never machine-branched on — `category` is the only field a client should switch on.
        exitCode:
          type: integer
          description: The underlying CLI exit code this category maps from, carried through for parity with docs/io-contract.md.
```

## claim_01049c8bbd9fe2a3c7faf6c45b809d92

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-2`
Unit SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`
Shown SHA256: `681998fc48ddf2b1a16693b13fde4ce04a93ce726baf676187bb398173d13df2`

```text
The official fgOS operator cockpit (STR40 / decision D d3dbe7f5 — its hard-law clause re-scoped 2026-09-06 by decision "RUL40 re-scope" (scope runner, supersedes d3dbe7f5; see docs/specs/runner.md RUL40) — which itself supersedes the
earlier tmux-based D ef6ed305). herdr arranges panes; every pane runs the
real fgOS CLI standalone — herdr is chrome, not a brain.
```

## claim_22c6190728000b8310fa1d760dd9c45e

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-3`
Unit SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`
Shown SHA256: `d9a42f9c58f800959f042152ba90bf1f2e195c69657e417b42bb2d898ba85b9f`

```text
- [herdr](https://herdr.dev) installed and on `PATH`.
- Running inside a herdr-managed pane: `test "${HERDR_ENV:-}" = 1`. See
  `upstreams/herdr/SKILL.md` for how herdr exposes this to every pane it
  manages.
```

## claim_87097f02b5b2b802a8f48d6f4f19975c

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-4`
Unit SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`
Shown SHA256: `39ab65fc3b43b4d0d896c06367658a6b4a69aa5def2ab3b4e5af507c86dc401d`

```text
From inside a herdr-managed pane, at the repo root:
```

## claim_c4b4df22fba31a76bbb6dc8958ca8178

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-5`
Unit SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`
Shown SHA256: `720a4ed3da3b0783cd767ef51cb08d571558c636621171f7067a32d7a6df2a83`

````text
```bash
bash scripts/herdr-cockpit.sh
```
````

## claim_b50972c7f03ddd2b22540cfedb175c8f

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-6`
Unit SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`
Shown SHA256: `2de21bfa3d698bce1908e962df4fb41e2208a9dacedb5bb4d01cc46da7d8bf49`

```text
This creates one new tab with 4 panes in your current workspace and prints
the attach command:
```

## claim_20274f45f105a4a7e29085d8001c5f92

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-7`
Unit SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`
Shown SHA256: `268389d63078c9f133aa5d6324c1e870294e3bca01a4c4cb94b1af8dd5179d31`

````text
```
herdr tab focus <tab_id>
```
````

## claim_499101c68dc93b56c31c1608841cc6da

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-8`
Unit SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`
Shown SHA256: `eb07b198b4c01cc50071d1edbd914f51f2304f73d0216560e0da2be1f60fd17f`

```text
1. **fgos-runner-loop** — `node bin/fgos-runner.mjs --once` in a poll-sleep
   shell loop (5s). No new runner flag: `--once` + `runner.lock` are already
   idempotent, so this is a plain wrapper, not new runner behavior.
2. **fgos-tail-log** — `tail -F .fgos/logs/*.log`, live per-item worker
   output as it's produced (STR39).
3. **human-door** — a plain interactive shell. This pane *is* where you type
   the next `fgos` verb (`submit`, `ask`/`answer`, `review`/`approve`/
   `reject`, `catchup`) — intentionally unscripted.
4. **fgos-dashboard** — polls `fgos list --json` every 5s, prints a compact
   status line (counts per status), and fires exactly one native
   `herdr notification show` the first time an item enters `awaiting-human`
   (never again while it stays in that status; fires again if it leaves and
   later re-enters).
```

## claim_bc763f01beb03078157e114cb80862c5

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-9`
Unit SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`
Shown SHA256: `df588dc685d48066e0e45d4d7fd6cb05715c66f7763f4be462364d416ffebed2`

```text
**herdr is used ONLY as chrome** — `pane split`/`pane run`/`pane read`/
`tab create`/`notification show`. This cockpit **never** calls
`herdr agent start` and **never** reads herdr's own `agent_status`
(idle/working/blocked/done) as a decision signal. Every real status signal
comes from the fgOS event log, via the fgOS CLI (`fgos list`/`rollup`/
`triage`) — one source of truth.
```

## claim_3da39eae33fe2f8cfb2003ad4cfd59ed

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-10`
Unit SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`
Shown SHA256: `252e9a74d8d47746c674fdd11cc3073b977cadc33abbf028d7128b55a1e29e86`

```text
This is not a style preference: herdr's own agent-detection layer caused a
measured production bug elsewhere ("idle killed an agent", observed in this
project's own dogfooding) precisely because it became a second, competing
source of truth about what was happening. If you're extending this cockpit,
do not reach for `herdr agent ...` commands or any `agent_status` field —
read fgOS's own CLI instead. See decision D d3dbe7f5 for the original reasoning; superseded 2026-09-06 by decision "RUL40 re-scope" (docs/specs/runner.md RUL40): herdr is still never the source of truth, but Dispatch may use herdr's agent API as transport and failure detector.
```

## claim_f373f7ded0f960b7fc7a0b25e4165c27

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-11`
Unit SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`
Shown SHA256: `aaca4fa176c972e45193fcaf5d099da837444d6dd5f57bdbedf5df42c6480d52`

```text
If a second operator attaches to the same herdr session, herdr's own
protocol negotiates ownership (`herdr terminal attach <id> --takeover`) —
this is existing herdr behavior, not something this feature builds. The
first attached client keeps write access unless a later client explicitly
takes over; anyone else can still read.
```

## claim_21e5294cf94df0ae27677707be977b72

`docs/platform/herdr-web-dashboard/operations/operator-runbook.md#unheaded-block-12`
Unit SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`
Shown SHA256: `fe7b96412a8bbe310e18527da7e60892ffa4f0cd47a9fdf14d4b520b4d6f96a2`

```text
This cockpit adds no new code on the merge/approve path. `approve` already
does not false-alarm when the runner merges in parallel — that guarantee was
fixed by STR35 (`fgos-multi-session-checkout`) and this cockpit only exposes it
through the dashboard pane, it does not re-implement it.
```

## claim_2c16dcf7e25396c56c18e719e440b68d

`docs/platform/platform-foundations.md#unheaded-block-2`
Unit SHA256: `5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da`
Shown SHA256: `5682857e36dbe2f2257da713fe265fe2386dfdfa21da814d538db5e7cdef15da`

```text
This is the target platform-docs anchor for fgOS foundations. The full legacy law text remains in `docs/platform-foundations.md` during migration.
```

## claim_ab7778cdce4955b28736467a541b04b6

`docs/platform/platform-foundations.md#unheaded-block-3`
Unit SHA256: `e167f297f95fde2d645fc8e9d211b27764b38e9f6ed5461bdbb8185cc3abfbae`
Shown SHA256: `e167f297f95fde2d645fc8e9d211b27764b38e9f6ed5461bdbb8185cc3abfbae`

```text
Use this document to know which laws exist, when they apply, and where to read the full wording.
```

## claim_2a6d0d0bf4e4ab6c47ee38c5e4dbc85f

`docs/platform/platform-foundations.md#unheaded-block-4`
Unit SHA256: `760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746`
Shown SHA256: `760ce813dee38275b7835a75dd4e115a731f5ce1e61749e6a13974f43f848746`

```text
Platform laws are durable constraints. Changing a law requires superseding its decision record; do not silently edit the old rationale away.
```

## claim_09f0919c5e299c8c230e0fee70c02c0f

`docs/platform/platform-foundations.md#unheaded-block-5`
Unit SHA256: `a0a0e5de1d354fb68d004fe2f754d907f01a2bf6eecaab15c3f42eafa65f5200`
Shown SHA256: `a0a0e5de1d354fb68d004fe2f754d907f01a2bf6eecaab15c3f42eafa65f5200`

```text
During migration:

- this file is the target reader entry;
- `docs/platform-foundations.md` remains the full source text;
- `docs/specs/platform-foundations.md` remains the generated/curated spec projection.
```

## claim_46c53960c0ca396b4728ba271a4486c5

`docs/platform/platform-foundations.md#unheaded-block-6`
Unit SHA256: `264fec538429723ca63f4d609493bde52c077526f20cc4ace32261c0d1ff7e96`
Shown SHA256: `264fec538429723ca63f4d609493bde52c077526f20cc4ace32261c0d1ff7e96`

```text
| Law | Summary | Full source |
| --- | --- | --- |
| L1 | Durable data declares whether it is log or state. | `docs/platform-foundations.md` |
| L2 | Memory has lower mechanical layers and higher learning layers. | `docs/platform-foundations.md` |
| L3 | JSONL/event changesets are truth; databases are rebuildable views unless a named threshold supersedes this. | `docs/platform-foundations.md` |
| L4 | Routing depends on the audience of each interface; there is no one global routing model. | `docs/platform-foundations.md` |
| L5 | Definition of done is the six-question stranger-agent test. | `docs/platform-foundations.md` |
| L6 | Platform maturity uses the F0-F5 ladder and needs real evidence. | `docs/platform-foundations.md` |
| L7 | Run complete, merge complete, and durable are different states. | `docs/platform-foundations.md` |
| L8 | Always-loaded doctrine follows placement, transport, and anchor-suite rules. | `docs/platform-foundations.md` |
| L9 | A single work item has separate run, merge, and durability completion levels. | `docs/platform-foundations.md` |
| RUL11 | Tùm lum is not “heavy”; when the system is messy, consolidate boundaries and contracts. | `docs/platform-foundations.md`, `docs/specs/platform-foundations.md` |
```

## claim_18bc93913b448431a0c855963911fe2b

`docs/platform/platform-foundations.md#unheaded-block-7`
Unit SHA256: `e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c`
Shown SHA256: `e0c8ac3c9a003bc9c5327c935fb9dce93fb8c05bc50c1a197d32333e8fba140c`

```text
Before accepting a platform design, check:
```

## claim_cdd858ddc77eff892c0d7595a2db233a

`docs/platform/platform-foundations.md#unheaded-block-8`
Unit SHA256: `bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a`
Shown SHA256: `bdb17898e7cf55880fca4f9b8f0768512d63cc439553812987b32a4ad461774a`

```text
| Question | Why |
| --- | --- |
| Is the artifact log or state? | Prevents ambiguous durability. |
| Which component owns the authority? | Prevents hidden ownership drift. |
| Which contract is touched? | Keeps boundaries explicit. |
| What proves done? | Keeps results reproducibly verifiable. |
| What learning remains? | Keeps the platform compounding. |
```

## claim_b646f1ec8d56851edc383bc50c70482d

`docs/platform/platform-foundations.md#unheaded-block-9`
Unit SHA256: `f52b702a1f9d964fd1326c1dcf5f3d0d7b64c19f47d04ee8912714f80819312c`
Shown SHA256: `f52b702a1f9d964fd1326c1dcf5f3d0d7b64c19f47d04ee8912714f80819312c`

```text
If a law-driven change affects component ownership or authority boundaries, also update `docs/platform/component-boundary.md` or record `No component-boundary change`.
```

## claim_e4f03a34cf0718c43c6faa9baac040ab

`docs/platform/platform-foundations.md#unheaded-block-10`
Unit SHA256: `b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc`
Shown SHA256: `b8dfcdaaf4850b881b6b58c8f5d30c3ad90b9bf8f0c40c73416cff26ef0102fc`

```text
| Need | Read |
| --- | --- |
| Full law text | `docs/platform-foundations.md` |
| Spec projection | `docs/specs/platform-foundations.md` |
| Platform vision | `vision.md` |
| Component map | `component-boundary.md` |
```

## claim_2d8114529b804f49494e6d42548e1372

`docs/platform/platform-foundations.md#unheaded-block-12`
Unit SHA256: `8fc59c5dbdac8ab4ef8e31cefed6cddbcce54e9c0f32a697f7101bed0056a06f`
Shown SHA256: `8fc59c5dbdac8ab4ef8e31cefed6cddbcce54e9c0f32a697f7101bed0056a06f`

```text
Tài liệu này khóa các **luật thiết kế** đứng trên mọi code của compound stack
(state/FSM → routing → compound-learning). Mỗi luật kèm: phát biểu, nguồn gốc
bằng chứng (cú pháp `nguồn:slug` tra trong `docs/distillery/sources/`), hệ quả
thực hành, và **ngưỡng xem lại** — luật không bất tử, nó bất tử *cho tới khi
ngưỡng có tên của nó bị chạm*. Quyết định gốc mang D-ID trong
`.bee/decisions.jsonl`; chất liệu đầy đủ:
`plans/reports/distill-consult-260713-2323-compound-learning-stack-report.md`
+ `docs/distillery/deep-dives/{state,compound-engineering,routing}.md`.
```

## claim_90502be35d74987ce7de238633cda0ef

`docs/platform/platform-foundations.md#unheaded-block-13`
Unit SHA256: `04083497fff112b9d6fae286b82e06f3d01cf5979ba1c91b431fd073be2bcea8`
Shown SHA256: `04083497fff112b9d6fae286b82e06f3d01cf5979ba1c91b431fd073be2bcea8`

```text
Trạng thái: **chốt 2026-07-13/14** (user). Thay đổi luật = supersede quyết định
D-ID tương ứng, không sửa tại chỗ.

---
```

## claim_9886156dd04c6bcee0f19974fddd6a3a

`docs/platform/platform-foundations.md#unheaded-block-14`
Unit SHA256: `168dd2e09c1b7d5d85e9ab1c366ad3e2765e68bf3d3991db2335d781272862d7`
Shown SHA256: `168dd2e09c1b7d5d85e9ab1c366ad3e2765e68bf3d3991db2335d781272862d7`

```text
**Luật.** Mọi mẩu dữ liệu bền của forgent phải được khai, ngay lúc thiết kế,
là một trong hai:
```

## claim_a22b4cba15a99efdae5e8c115e76c57f

`docs/platform/platform-foundations.md#unheaded-block-15`
Unit SHA256: `8964d263ae3ad29e88a1eccd4fb5df020d84e55f2474133eaae113e22f94d25f`
Shown SHA256: `8964d263ae3ad29e88a1eccd4fb5df020d84e55f2474133eaae113e22f94d25f`

```text
- **Log** — append-only, tổ chức theo *feature/phiên*, trả lời "làm sao tới
  đây"; không bao giờ overwrite. (vd: `plans/reports/`, decisions.jsonl,
  changeset)
- **State** — overwrite theo reality, tổ chức theo *area*, trả lời "đang ở
  đâu"; luôn phản ánh hiện tại. (vd: `docs/distillery/sources/*.md`, state.json)
```

## claim_77408c8149da0cc7de79e58824c2d154

`docs/platform/platform-foundations.md#unheaded-block-16`
Unit SHA256: `92472ade03b38c76133d902390be97f629d706f20831347a1435738d597a7afc`
Shown SHA256: `92472ade03b38c76133d902390be97f629d706f20831347a1435738d597a7afc`

```text
Một artifact không khai được nó thuộc vật lý nào là lỗi thiết kế, không phải
chi tiết để sau.
```

## claim_e07fbd7b9b435d12bfb6d5e68fc9b649

`docs/platform/platform-foundations.md#unheaded-block-17`
Unit SHA256: `f074d27202dea0e5b6fcd976c22ccfc3836b61a2aec5ba48ea55695d159f72ae`
Shown SHA256: `f074d27202dea0e5b6fcd976c22ccfc3836b61a2aec5ba48ea55695d159f72ae`

```text
**Nguồn.** `beegog:state-vs-log-two-physics` ("đa số hệ chỉ có log");
harness ngầm cùng mô hình (changesets=log, db=state). forgent đã theo pattern
này một cách ngầm (distillery=state, reports=log) — luật này chỉ phát biểu
thành văn. D-ID `ca7de3cf`.
```

## claim_62a6bc5eefe30daadb98416db9229e10

`docs/platform/platform-foundations.md#unheaded-block-18`
Unit SHA256: `f9ee0c36132cc8ca46dcc88c13ac91d4da3cc4a7613492309fe57d3335ff245b`
Shown SHA256: `f9ee0c36132cc8ca46dcc88c13ac91d4da3cc4a7613492309fe57d3335ff245b`

```text
**Hệ quả.** Review mọi thiết kế state layer bắt đầu bằng câu hỏi "log hay
state?"; file lai (vừa append vừa sửa) phải tách đôi.
```

## claim_e8e986adaf140b7fd937329ad345e301

`docs/platform/platform-foundations.md#unheaded-block-19`
Unit SHA256: `ac87664311c5b2d18345dc46aa1213825d954686d2e16ca42781d195f70b92d7`
Shown SHA256: `ac87664311c5b2d18345dc46aa1213825d954686d2e16ca42781d195f70b92d7`

```text
**Ngưỡng xem lại.** Không có — đây là luật phân loại, không phải trade-off.
```

## claim_3bb7883bcfb989462f916b4919cd27dc

`docs/platform/platform-foundations.md#unheaded-block-20`
Unit SHA256: `cb8e14aea4bf8d30ef595a63e5dea5469bfc546948453940d1a152392ec2c353`
Shown SHA256: `cb8e14aea4bf8d30ef595a63e5dea5469bfc546948453940d1a152392ec2c353`

```text
**Luật.** forgent dùng ĐỒNG THỜI hai mô hình memory, phân theo tầng:
```

## claim_c9f9ee3f5e41b6dceca39ee44394daae

`docs/platform/platform-foundations.md#unheaded-block-21`
Unit SHA256: `6b9221d7fa3cf226534e6f2d648074316f372917811e47a470f01867cb4cef01`
Shown SHA256: `6b9221d7fa3cf226534e6f2d648074316f372917811e47a470f01867cb4cef01`

```text
- **Lower layer** (cơ học, raw, chính xác: state/FSM, cells, cursor,
  changeset) → chỉ hai-physics của L1. Không TTL, không tự quên, không
  consolidation.
- **Higher layer** (process, framework, skill — nơi agent học pattern) →
  bốn memory-type (working / episodic / semantic / procedural) + consolidation
  loop + quên có trọng số bằng chứng.
```

## claim_9a04201f919239cf6ba8e8fd3d219259

`docs/platform/platform-foundations.md#unheaded-block-22`
Unit SHA256: `531971f08dd18f63b3add0bb38e9070c4b11d668584f3f7cfb6b08a427c1f675`
Shown SHA256: `531971f08dd18f63b3add0bb38e9070c4b11d668584f3f7cfb6b08a427c1f675`

```text
Hai mô hình không phủ định nhau; sai lầm cần tránh là dùng typed-memory cho
tầng máy (over-engineering) hoặc chỉ hai-physics cho tầng học (agent không
tích lũy được).
```

## claim_08a6a169e70c62648713b975faef7117

`docs/platform/platform-foundations.md#unheaded-block-23`
Unit SHA256: `6df091c96a3f7425cdf8c220b37c54e0f2bf0734c2e3729cafe6fa4f5adfc036`
Shown SHA256: `6df091c96a3f7425cdf8c220b37c54e0f2bf0734c2e3729cafe6fa4f5adfc036`

```text
**Nguồn.** Synthesis của user 2026-07-13 trên `beegog:state-vs-log-two-physics`
× `marketing-cockpit:four-memory-types` + `procedural-memory-reinforcement`;
tham khảo thêm `beads:remember-prime-memory-loop` (memory-là-node-đồ-thị) và
`beads:llm-tier-compaction` (quên = nén bằng LLM rẻ + giữ snapshot) khi dựng
higher layer. D-ID `ca7de3cf`.
```

## claim_33e809bd51195f16c660a44b6f0c8cd4

`docs/platform/platform-foundations.md#unheaded-block-24`
Unit SHA256: `30f7e9eeb5a17e2b4fe86fa1961296bb91abecfdda08a500133bc382b333c432`
Shown SHA256: `30f7e9eeb5a17e2b4fe86fa1961296bb91abecfdda08a500133bc382b333c432`

```text
**Hệ quả.** Port `typed-memory-consolidation` chỉ khi dựng higher layer
(sau Phase 1–2); retention math (TTL, ±confidence) tự hiệu chỉnh, không bê
nguyên số fgOS.
```

## claim_b4fdc298d175d3d7c4fb1799d04310ad

`docs/platform/platform-foundations.md#unheaded-block-25`
Unit SHA256: `690eb02856c7a16108cb6173bc5beaa6110ab30c1c4c5f439a66c1db93ae3ada`
Shown SHA256: `690eb02856c7a16108cb6173bc5beaa6110ab30c1c4c5f439a66c1db93ae3ada`

```text
**Ngưỡng xem lại.** Nếu higher layer không bao giờ thành hình (forgent dừng ở
harness/tooling), tầng 4-memtype tự rơi — không nợ gì.
```

## claim_7bf15cc26ce4cc328ce43a5075ff975d

`docs/platform/platform-foundations.md#unheaded-block-26`
Unit SHA256: `5839776da66814923a7967180bfeb790e725ea19d401943843658433eac1a4ae`
Shown SHA256: `5839776da66814923a7967180bfeb790e725ea19d401943843658433eac1a4ae`

```text
**Luật.** Bất kỳ database nào vào forgent đều phải thỏa:
```

## claim_b434d8d3c466f8696180eda86e6afeaa

`docs/platform/platform-foundations.md#unheaded-block-27`
Unit SHA256: `11462fd7cf03c90ed5a86a8a544c6ecc76a4bab660cd23c577e6a2637478686b`
Shown SHA256: `11462fd7cf03c90ed5a86a8a544c6ecc76a4bab660cd23c577e6a2637478686b`

```text
1. **Truth = changeset JSONL committed trong git** (semantic operations,
   full-record, append trong cùng transaction với mutation).
2. **DB là materialized view** — rebuild được từ zero bằng replay changeset.
3. **Graph store (nếu có) là view cấp 2** — dựng từ db hoặc từ changeset,
   không bao giờ được ghi ngược.
4. Mọi ghi đi qua MỘT cửa CLI (đơn writer hiện tại; xem L-CAS trong Phase 1).
```

## claim_9d81ef83787c33f63486cc51926057f3

`docs/platform/platform-foundations.md#unheaded-block-28`
Unit SHA256: `9c409ff547b04a39d2aa19b74b80df3071c086a6a669d9fcddb1dbb92d4d2baf`
Shown SHA256: `9c409ff547b04a39d2aa19b74b80df3071c086a6a669d9fcddb1dbb92d4d2baf`

```text
Nhờ luật này, chọn engine là quyết định *đảo-ngược-được*: SQLite hôm nay,
engine khác mai kia, chỉ cần replay.
```

## claim_4d647bf67144726add87ffd4276efdb8

`docs/platform/platform-foundations.md#unheaded-block-29`
Unit SHA256: `9c91e304dff732a99d5fa1141233041c634debc06bef4c2a3c77543c181aa9ba`
Shown SHA256: `9c91e304dff732a99d5fa1141233041c634debc06bef4c2a3c77543c181aa9ba`

```text
**Nguồn.** `repository-harness:changeset-event-sourcing` (đã dogfood, giải
"SQLite không diff được trong git"); `symphony:changeset-content-sha-immutability`
(content-addressed chống double-apply). Engine ưu tiên khi tới ngưỡng: SQLite
(recursive CTE đủ cho traversal vừa); graph engine chỉ khi traversal là nút
thắt đo được (LadybugDB là ứng viên sống duy nhất; CozoDB dormant từ 12/2023).
D-ID `ae461c8b`.
```

## claim_ed8f2802e73930946ab6213817c9ab7c

`docs/platform/platform-foundations.md#unheaded-block-30`
Unit SHA256: `90e37ae90166ffdff682883f8366a3fe36be59151d980be89b3a4a55414b257f`
Shown SHA256: `90e37ae90166ffdff682883f8366a3fe36be59151d980be89b3a4a55414b257f`

```text
**Ngưỡng xem lại (có tên, từ evidence beads 2026-07-14).**
`beads:dolt-as-versioned-truth`: beads đã RẼ KHỎI JSONL-truth sang
Dolt-as-truth khi **multi-agent write trở thành tải chính**. Luật L3 đứng vững
cho forgent vì hai tiền đề: (a) single-writer, (b) cần git-diffable. Khi tiền
đề (a) gãy — nhiều agent ghi đồng thời như tải chính — phải mở lại luật này
với beads làm case study, không vá tại chỗ.
```

## claim_2310e2f6a41f2f83b4e04a736998f56b

`docs/platform/platform-foundations.md#unheaded-block-31`
Unit SHA256: `fa0d18bd92ea2f88fec46020b02745a75a410b21eeb7dfcfb43f6851e89a3bea`
Shown SHA256: `fa0d18bd92ea2f88fec46020b02745a75a410b21eeb7dfcfb43f6851e89a3bea`

```text
**Luật.** Không có MỘT mô hình routing toàn cục. Mỗi interface chọn mô hình
theo audience của nó:
```

## claim_fe2f8d96ba146b1424832443ce839c2a

`docs/platform/platform-foundations.md#unheaded-block-32`
Unit SHA256: `a6165ca54f6e232f91f3f293552afbc9ba99359966f4ec8c76bbf2fe4566e3af`
Shown SHA256: `a6165ca54f6e232f91f3f293552afbc9ba99359966f4ec8c76bbf2fe4566e3af`

```text
- **Agent ↔ agent trong chain** (mặc định của forgent — multi-skill đã chốt):
  prose-handoff tường minh (câu handoff cuối skill, bảng entry-router) + hook
  nudge advisory. LLM đọc prose tốt hơn parse JSON.
- **Interface chạm consumer không-chắc-là-agent** (CLI, hook, CI, script
  ngoài): kỷ luật data — exit-code theo phạm trù ("branch on code, never on
  message"), decision-table tường minh cho mỗi state khả dĩ, mutation timeout
  = bất định → rediscover trước retry.
```

## claim_589216840c60938dc4b4fb4ef262338b

`docs/platform/platform-foundations.md#unheaded-block-33`
Unit SHA256: `a66a63381d36cbfd9f067080c0df139677a4c83ae2f7132eb47e6d54ff32f768`
Shown SHA256: `a66a63381d36cbfd9f067080c0df139677a4c83ae2f7132eb47e6d54ff32f768`

```text
**Nguồn.** Deep-dive `routing` (4 nguồn): `beegog:hive-first-skill-router` vs
`repository-harness:protocol-next-action-table`; symphony là consumer thực
chứng của trường phái data. Nguyên lý con đi kèm (5 nguồn hội tụ độc lập):
**"việc kế tiếp = truy vấn dẫn xuất từ state"**, không bao giờ là danh sách
tay (readyCells ↔ runnable ↔ board-precedence ↔ signal-consume ↔ bd ready).
D-ID `14ebeea9`.
```

## claim_05de943bcc9425a12b88bee9089cbf7a

`docs/platform/platform-foundations.md#unheaded-block-34`
Unit SHA256: `d345460f92c033e34453a60c7f6a6fa6083e75ab3aa24794279e280464ddcef5`
Shown SHA256: `d345460f92c033e34453a60c7f6a6fa6083e75ab3aa24794279e280464ddcef5`

```text
**Hệ quả.** Thiết kế mỗi interface mới bắt đầu bằng câu "ai đọc đầu ra này?";
reliability layer (anti-loop, recovery-matrix, circuit-breaker — theo
`marketing-cockpit:failure-recovery-matrix`) thuộc Phase 2.
```

## claim_3ec9a48e47f58094f1b3018ff2ece9c9

`docs/platform/platform-foundations.md#unheaded-block-35`
Unit SHA256: `2d3a3d99276a46e6495ac8b7b9f5700982cbfbdbfb607c0be05684c3195a81bc`
Shown SHA256: `2d3a3d99276a46e6495ac8b7b9f5700982cbfbdbfb607c0be05684c3195a81bc`

```text
**Ngưỡng xem lại.** Khi forgent lên multi-agent dispatch thật: bổ sung
intent-scoring (fgOS) — đã có candidate, không phải đổi luật.
```

## claim_4dbd1f509838bc7542b201e276c89a3f

`docs/platform/platform-foundations.md#unheaded-block-36`
Unit SHA256: `d4ce58bb34a24c4bae4a9705612947a20539df432b8f187a82966b1cbb730993`
Shown SHA256: `d4ce58bb34a24c4bae4a9705612947a20539df432b8f187a82966b1cbb730993`

```text
**Luật.** forgent "có harness" khi một agent lạ, không chat history, trả lời
được sáu câu:
```

## claim_70a2be27734980c37149cb742d8d6f48

`docs/platform/platform-foundations.md#unheaded-block-37`
Unit SHA256: `194feeb55a2c5852ab1a53afe8389d6eecac3acda61bec4b9a2416a86bd6d9ba`
Shown SHA256: `194feeb55a2c5852ab1a53afe8389d6eecac3acda61bec4b9a2416a86bd6d9ba`

```text
1. Đọc gì trước? 2. Việc này thuộc loại gì? 3. Nó chạm contract nào?
4. Rủi ro bao nhiêu? 5. Proof gì thì xong? 6. Bài học nào để lại?
```

## claim_ede971202a69e1b73542f13f4f6e7206

`docs/platform/platform-foundations.md#unheaded-block-38`
Unit SHA256: `9b1765b033e354a693b87d6bb03284de03e9eec965bb45aa145216bab1eadf76`
Shown SHA256: `9b1765b033e354a693b87d6bb03284de03e9eec965bb45aa145216bab1eadf76`

```text
Mọi phase của compound stack nghiệm thu bằng cách hỏi lại sáu câu này — không
phải bằng feature list.
```

## claim_854179d9ed4f8eb77453f41099f2a37d

`docs/platform/platform-foundations.md#unheaded-block-39`
Unit SHA256: `ac66a5e481b2ccaaae55707f3e75db9db7c9215d05e3c2c776f27b2cdc6722d4`
Shown SHA256: `ac66a5e481b2ccaaae55707f3e75db9db7c9215d05e3c2c776f27b2cdc6722d4`

```text
**Nguồn.** `repository-harness:repo-as-os-six-questions`. Câu 6 chính là
compound-learning — nó nằm trong definition of done, không phải tính năng
cộng thêm.
```

## claim_8e9ec3c7fbaf9beaac08d9c628c6cb27

`docs/platform/platform-foundations.md#unheaded-block-40`
Unit SHA256: `e5655fce38683ccafd23b27b30ba6b2b69da7f872b97e046bf8b20b55eff1f3a`
Shown SHA256: `e5655fce38683ccafd23b27b30ba6b2b69da7f872b97e046bf8b20b55eff1f3a`

```text
**Ngưỡng xem lại.** Không có — đây là acceptance test, chỉ có thể THÊM câu.
```

## claim_022891f48285926a8bac31bb8dced43e

`docs/platform/platform-foundations.md#unheaded-block-41`
Unit SHA256: `9fad9909fecad6671be0b443371b8004fc6fcebb41209c6e482ef7c253b24f4d`
Shown SHA256: `9fad9909fecad6671be0b443371b8004fc6fcebb41209c6e482ef7c253b24f4d`

```text
**Luật.** Tiến hóa của forgent đo bằng thang bậc kiểm chứng được, mỗi bậc có
tiêu chí + chỉ số, không phải cảm giác:
```

## claim_b923422602d24ac0824b5eadd590fb55

`docs/platform/platform-foundations.md#unheaded-block-42`
Unit SHA256: `3581ac1cda8e573a14ba60b273068d1328935dc6d3ef0bb76e5c0dc738e469c4`
Shown SHA256: `3581ac1cda8e573a14ba60b273068d1328935dc6d3ef0bb76e5c0dc738e469c4`

```text
| Bậc | Tên | Tiêu chí kiểm chứng |
|---|---|---|
| F0 | Bare | Repo + docs, chưa có luật thành văn |
| F1 | Lawful | Tài liệu này tồn tại; mọi artifact khai log/state (L1); 6 câu trả lời được BẰNG TAY |
| F2 | Stateful | State layer Phase 1 chạy: FSM + precondition + CAS + decisions event-sourced; 6 câu trả lời từ state, không từ trí nhớ |
| F3 | Routed | Routing Phase 2: next-work derived, chain handoff, recovery-matrix; agent lạ tự tìm việc kế tiếp |
| F4 | Compounding | Vòng predicted→actual chạy; capture 2 kênh; entropy-trend + seal-digest; câu 6 tự động |
| F5 | Self-improving | Học từ chính vận hành (higher-layer memory, evolving loop human-gated); cải tiến có outcome đo được |
```

## claim_86e1c120b2fe19fe06d5877580281a34

`docs/platform/platform-foundations.md#unheaded-block-43`
Unit SHA256: `c108c572f3b1aa29e759e131e839893ba4e3325008a2cf90af928e4998dbafa0`
Shown SHA256: `c108c572f3b1aa29e759e131e839893ba4e3325008a2cf90af928e4998dbafa0`

```text
Mỗi bậc chỉ được tuyên bố khi có bằng chứng chạy thật (benchmark/check output),
theo `repository-harness:maturity-ladder-h0-h5` — "không tự phán".
```

## claim_4863f7a047be57aa4f11d2ef6cd3b87d

`docs/platform/platform-foundations.md#unheaded-block-44`
Unit SHA256: `fc29fd5404577c0b040a7e8b7f9e384b1d9f2d945b433af61b23f811e0e41b31`
Shown SHA256: `fc29fd5404577c0b040a7e8b7f9e384b1d9f2d945b433af61b23f811e0e41b31`

```text
**Claimed.** F4 — 2026-07-16, trên bằng chứng benchmark ngoài thật (real
`fgos`/`fgos-runner` binaries, bản sao pristine, không fixture): vòng
predicted→actual đủ 2 nửa; capture 2 kênh (settlement role-attributed
runner/human, friction 5-layer); entropy-trend + seal-digest qua hai lần
`check`; câu-6 tự động lúc đóng. Chi tiết + toàn bộ output dán nguyên văn:
`docs/history/phase-3-compound-learning/reports/f4-benchmark.md` (round 2,
6/6 delta PASS).
```

## claim_48bac5800a98915c0be75b6a9c310644

`docs/platform/platform-foundations.md#unheaded-block-45`
Unit SHA256: `c795a7db139ae8c49aef2c6759d7cac69ed6c21812481c25a1d8e5c02135f665`
Shown SHA256: `c795a7db139ae8c49aef2c6759d7cac69ed6c21812481c25a1d8e5c02135f665`

```text
**Ngưỡng xem lại.** Nội dung từng bậc tinh chỉnh được khi vào phase tương ứng;
cấu trúc thang giữ nguyên.
```

## claim_1736410bfa4887b90392f152ffc03678

`docs/platform/platform-foundations.md#unheaded-block-46`
Unit SHA256: `28907df5eed46756c20083b73c8e9394162079d58dd8bf47abbd107e7ea45e0b`
Shown SHA256: `28907df5eed46756c20083b73c8e9394162079d58dd8bf47abbd107e7ea45e0b`

```text
**Luật.** "Chạy xong ≠ đã merge ≠ đã bền." Mọi artifact khai mức bền tường minh:
```

## claim_6992c949b0d3611533d1871844b99653

`docs/platform/platform-foundations.md#unheaded-block-47`
Unit SHA256: `59ad8d3e401e36258a8527c29f47108347fe8192b254faa08ab12c8fc960f212`
Shown SHA256: `59ad8d3e401e36258a8527c29f47108347fe8192b254faa08ab12c8fc960f212`

```text
| Mức | Nghĩa | Ví dụ forgent |
|---|---|---|
| D1 branch/PR | đề xuất, chờ duyệt | nhánh feature |
| D2 commit-retain | truth vĩnh viễn trong git | changeset, decisions, distillery, doc này |
| D3 local-compactable | bằng chứng phiên, nén được | plans/reports cũ, run artifacts |
| D4 local-rebuildable | dựng lại được từ D2 | db-view tương lai, cache |
| D5 local-only | máy này thôi | .bee/state.json, HANDOFF |
```

## claim_142316b7c81a1c548e47fa1955b7220e

`docs/platform/platform-foundations.md#unheaded-block-48`
Unit SHA256: `314a236e6c4731b0624a98aed7b5cee3d2f7393560bd111a1bea083018816ef4`
Shown SHA256: `314a236e6c4731b0624a98aed7b5cee3d2f7393560bd111a1bea083018816ef4`

```text
**Nguồn.** `symphony:run-artifact-durability-split` (5 mức, sinh từ ràng buộc
consumer thật); mở rộng của L1.
```

## claim_72cd711387f34f1d27ec007ff83a18a5

`docs/platform/platform-foundations.md#unheaded-block-49`
Unit SHA256: `bc7fee3b89305482daa8230b3e622e12b757ace44e6a8dee938d8d1bcc1a8fce`
Shown SHA256: `bc7fee3b89305482daa8230b3e622e12b757ace44e6a8dee938d8d1bcc1a8fce`

```text
**Ngưỡng xem lại.** Khi forgent có fleet-run/branch-PR flow thật, mức D1/D3
cần quy tắc retention cụ thể — bổ sung, không đổi thang.
```

## claim_f3e9488bf50aec2cfd5a31fd4f81db96

`docs/platform/platform-foundations.md#unheaded-block-50`
Unit SHA256: `ea781530a988c571f40a7ce2d00aa12dbb4f57799295621db43d88632f408d11`
Shown SHA256: `ea781530a988c571f40a7ce2d00aa12dbb4f57799295621db43d88632f408d11`

```text
**Luật.** Tầng "doctrine" của forgent (CLAUDE.md/AGENTS.md — nạp mọi turn)
tuân ba quy tắc:
```

## claim_6e7dec7a07e6a6b61df167a7515ae3e1

`docs/platform/platform-foundations.md#unheaded-block-51`
Unit SHA256: `54f8314c197673de54a0ca1fd5f0d223fa3cc77f99da6927b7e688f2f038abc2`
Shown SHA256: `54f8314c197673de54a0ca1fd5f0d223fa3cc77f99da6927b7e688f2f038abc2`

```text
1. **Placement test một câu:** "rule này có cần hold khi không workflow nào
   đang chạy không?" — yes → standing sheet; no → reference nạp theo nhu cầu.
   Rule đặt sai nhà "behaves exactly like no rule at all".
2. **Transport rides with the order:** lệnh trên standing sheet phải mang kèm
   mức tối thiểu để tuân thủ ngay lần đầu (không được để "cách làm" nằm ở
   reference chỉ nạp khi invoke).
3. **Anchor-suite:** mỗi doctrine rule có cụm từ đặc trưng được check tự động
   assert theo tên — doctrine không được rỗng dần trong im lặng.
```

## claim_7e290076691c2708d9f30721bedd095c

`docs/platform/platform-foundations.md#unheaded-block-52`
Unit SHA256: `7e3bd2974780c7384b0902da7e62f60eb6eeb6bf2d0ca27868de9bd263779a94`
Shown SHA256: `7e3bd2974780c7384b0902da7e62f60eb6eeb6bf2d0ca27868de9bd263779a94`

```text
**Nguồn.** `beegog:doctrine-layer-always-loaded` (@af4840c — hai bài học
failure-driven từ lỗi thật); họ hàng: `marketing-cockpit:projection-governance-coverage`
(phân hạng enforce-ability của convention).
```

## claim_9c786f2d49ab8a8d29e6ed8fb38c2c80

`docs/platform/platform-foundations.md#unheaded-block-53`
Unit SHA256: `9cc767290d41105b348e3d3823ed6905197a2843a5dee60c551bcf04cfeb7b60`
Shown SHA256: `9cc767290d41105b348e3d3823ed6905197a2843a5dee60c551bcf04cfeb7b60`

```text
**Hệ quả.** Khi forgent viết AGENTS/CLAUDE của chính nó (F2+), mọi rule đi qua
placement test; check của forgent (distill check hoặc kế nhiệm) nhận thêm
anchor assertions.
```

## claim_f9bf0680f24a99c95368c78eb67859e8

`docs/platform/platform-foundations.md#unheaded-block-54`
Unit SHA256: `781d9813175b99ce5352929e313c42be637e23162fc9f4af8c83a45963decba2`
Shown SHA256: `781d9813175b99ce5352929e313c42be637e23162fc9f4af8c83a45963decba2`

```text
**Ngưỡng xem lại.** Không có — failure-driven, hai lần trả giá ở upstream rồi.
```

## claim_c8e69408f7b662e15c88d460c4d46071

`docs/platform/platform-foundations.md#unheaded-block-55`
Unit SHA256: `b026a410818016db4d0a1dcbe070f3ee609a6d7d1ecf88db636781321abcc803`
Shown SHA256: `b026a410818016db4d0a1dcbe070f3ee609a6d7d1ecf88db636781321abcc803`

```text
**Luật.** Một work-item đi qua BA mức hoàn tất KHÁC NHAU; consumer không được gộp:
```

## claim_10eab7900ae2000c96542548c6e9fe30

`docs/platform/platform-foundations.md#unheaded-block-56`
Unit SHA256: `ffef49a44040bab676b2f35e492f2998bdcc37353bc515f1cb7bfe4cf00d15be`
Shown SHA256: `ffef49a44040bab676b2f35e492f2998bdcc37353bc515f1cb7bfe4cf00d15be`

```text
| Mức | Trạng thái item | Ai tuyên | Nghĩa |
|---|---|---|---|
| run-complete | `proposed` | runner (D3, verify tự chạy lại) | worker chạy xong + verify xanh TRÊN NHÁNH — "đã làm" nhưng CHƯA vào main |
| merge-complete | `done` | cổng duyệt/merge (CTR005) | đã duyệt + nhập vào cây chính — "đã nhận" |
| durable | `done` + đã đẩy | github-adapter (STR28) | đã đẩy lên remote, sống ngoài máy này — "đã bền" |
```

## claim_4dfdcbe4f050f89c183c25ee569fb272

`docs/platform/platform-foundations.md#unheaded-block-57`
Unit SHA256: `6939ee9ec648dfc4a6ced3e213bcbe3b1113cec87bf2dab98574392993b82344`
Shown SHA256: `6939ee9ec648dfc4a6ced3e213bcbe3b1113cec87bf2dab98574392993b82344`

```text
**Phân biệt với L7 (bắt buộc — hai trục khác nhau).** L7 đo độ bền LƯU TRỮ của một
*artifact* (nó SỐNG ở đâu: D1 nhánh … D5 local-only). L9 đo TRẠNG THÁI hoàn tất
của một *việc* (nó ĐÃ ĐI tới đâu trong vòng đời). Một item `proposed` là
run-complete ở L9 trong khi artifact nhánh của nó là L7-D1 — cùng một sự việc,
hai câu hỏi khác nhau. Header của L7 mượn cụm "chạy xong ≠ đã merge ≠ đã bền" để
nói tinh thần; L9 là chỗ ba mức đó thành khái niệm có tên cho vòng đời việc.
```

## claim_1eca3c23667c4c71fca407d7037ff6f3

`docs/platform/platform-foundations.md#unheaded-block-58`
Unit SHA256: `4ea8c14d897681838896be70cf1e1752b0c32977fef46f6625862e5867759884`
Shown SHA256: `4ea8c14d897681838896be70cf1e1752b0c32977fef46f6625862e5867759884`

```text
**Nguồn.** Sống ngầm trong STR17 (PR lifecycle) và STR28 (github-adapter); trực tiếp
liên quan hai nửa của `fgos check` (predicted/actual outcome) và cổng merge CTR005.
D-ID sẽ gán khi một slice đầu tiên cần trích L9 làm ràng buộc thiết kế.
```

## claim_a05d1c99405810169abcfc984b9a9976

`docs/platform/platform-foundations.md#unheaded-block-59`
Unit SHA256: `2635805de8dc44a68fcc10042a636b1d3eea57b35a04e033f4a6d8cbf71dff13`
Shown SHA256: `2635805de8dc44a68fcc10042a636b1d3eea57b35a04e033f4a6d8cbf71dff13`

```text
**Hệ quả.** Đọc `proposed` là "xong" là lỗi phân tầng — mới run-complete. Một yêu
cầu "ship/release" đòi merge-complete tối thiểu; "bền/đã lưu ngoài" đòi durable.
`approve --github` không tự dọn nhánh remote (github-adapter S3) chính là ranh
giới merge-complete vs durable chưa khép kín — biết-nhưng-chưa-sửa, không nhầm là
đã bền.
```

## claim_6a60debaabc6d57b370f9d3c40bbdc5b

`docs/platform/platform-foundations.md#unheaded-block-60`
Unit SHA256: `2687947208cf7c2aca86618bbbf86b46103d0eb1b25457ad007c73dad85f7fef`
Shown SHA256: `2687947208cf7c2aca86618bbbf86b46103d0eb1b25457ad007c73dad85f7fef`

```text
**Ngưỡng xem lại.** Khi có fleet-run / remote-push flow thật, mỗi mức cần quy tắc
retention/đối-chiếu riêng — bổ sung, không đổi ba mức.
```

## claim_3d26ba6d9206c53588e996591aa96d56

`docs/platform/platform-foundations.md#unheaded-block-61`
Unit SHA256: `c6cbbafb3359e8cedccd4445b7752500266268d284506b3b6ea2addc5c934aa3`
Shown SHA256: `c6cbbafb3359e8cedccd4445b7752500266268d284506b3b6ea2addc5c934aa3`

```text
**Luật.** Một hành vi ghi/đọc mới LUÔN mở rộng cửa hiện có, KHÔNG BAO GIỜ mở một
đường song song bên cạnh nó:
```

## claim_7b3861f877b3e9ab3293e7f740e8256b

`docs/platform/platform-foundations.md#unheaded-block-62`
Unit SHA256: `2359f2c0b35193876c094051a0110eacf387819fa76027a6b6b345384fb2d16e`
Shown SHA256: `2359f2c0b35193876c094051a0110eacf387819fa76027a6b6b345384fb2d16e`

```text
- Trạng thái mới → thêm nhánh transition qua CÙNG `moveWork` (một cửa ghi), không
  một hàm ghi riêng.
- Field mới → cưỡi CÙNG event, sống qua CÙNG fold (spread `work.add`), không một
  event-type/log riêng.
- Read mới → qua facade store hiện có, không import thẳng một tầng Domain vào
  Entry.
```

## claim_e41ff26ee782ddffab5418c7e0ba8264

`docs/platform/platform-foundations.md#unheaded-block-63`
Unit SHA256: `0efc4e024672c39cc76a909ac1ee27f6c17c0d09540b7a1fc13ec0ddca65ef3b`
Shown SHA256: `0efc4e024672c39cc76a909ac1ee27f6c17c0d09540b7a1fc13ec0ddca65ef3b`

```text
**Nguồn / bằng chứng (đã DONE, không phải mục tiêu).** `awaiting-human` là một
`moveWork` wrapper (`store.mjs` `putInAwaiting`/`answerAwaiting`), không phải write
path thứ hai. work-graph-intelligence (STR43 + S7–S9) chạm mọi metric/advisory qua
facade store (`readyWork`/`graphMetrics`/`graphWhatIf`/`staleDoingAdvisory`/
`footprintConflicts`), và thêm field (`discoveredFrom`, `footprint`) cưỡi cùng
`work.add` spread — không cửa mới nào. Đây là doctrine đứng SAU L3 rule 4 (mọi ghi
qua MỘT cửa) và contract CTR002 (single-write-door).
```

## claim_6d303b1e5f23110b89167cd53da412bd

`docs/platform/platform-foundations.md#unheaded-block-64`
Unit SHA256: `1cc2518bff1d0743f58c76739fb0df05f0f6a9aef55ef94d7c8b4d1d38276435`
Shown SHA256: `1cc2518bff1d0743f58c76739fb0df05f0f6a9aef55ef94d7c8b4d1d38276435`

```text
**Hệ quả.** "Cửa có lỗ hổng vẫn là luật không có lỗ hổng" — đắp một đường cạnh cửa
làm MỌI bảo đảm của cửa (CAS, cycle-check phi-chu-trình, envelope CTR001, serialize
write-queue) mất hiệu lực TRONG IM LẶNG, vì đường mới không đi qua chúng. Review/
test bắt "một write path THỨ HAI" hay "Entry import thẳng Domain" là red flag ngang
với bỏ CAS.
```

## claim_ffc2a45993434a9ee0d268fe61f2e364

`docs/platform/platform-foundations.md#unheaded-block-65`
Unit SHA256: `e11dee98df58f0fd18b2ad85bed581d1ee8733b5a61eb57e5f15b77dfc4ff41f`
Shown SHA256: `e11dee98df58f0fd18b2ad85bed581d1ee8733b5a61eb57e5f15b77dfc4ff41f`

```text
**Ngưỡng xem lại.** Khi multi-writer thật (gãy tiền đề single-writer của L3): cửa
có thể tiến hóa thành lease/daemon, nhưng bất biến "MỘT cửa, mở rộng qua nó" giữ
nguyên — chính là điều L3 ngưỡng-xem-lại đã hẹn.

---
```

## claim_8f99bbdd03f6a996a38ff66e948b4c0d

`docs/platform/platform-foundations.md#unheaded-block-66`
Unit SHA256: `275b2faa9870643199ae75c7d893f177befae3b6c147c24a3752a06ac5788f4f`
Shown SHA256: `275b2faa9870643199ae75c7d893f177befae3b6c147c24a3752a06ac5788f4f`

```text
Phase 1 (state/FSM: JSON zero-dep + transition-API-có-precondition +
single-door + CAS) → Phase 2 (routing: derived next-work + chain handoff +
recovery) → Phase 3 (compound: predicted→actual, capture 2 kênh,
entropy-trend, evolving human-gated). Chi tiết + candidate map: consult report
đã dẫn ở đầu. Ba candidate F1 của distill (`porting-outcome-lifecycle`,
`distillery-entropy-trend`, `seal-digest-zero-effort`) chạy song song được —
distill là phòng thí nghiệm compound đầu tiên.
```

## claim_bfcdf45c17e89867cdb4446149fd795b

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-2`
Unit SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`
Shown SHA256: `509c09f8d9c5d789b48446cbc179231de7fa268133ade3900676a574f08732b9`

```text
Contract chuyển việc **agent ↔ agent trong chain** cho vòng lặp runner (Phase
2, epic E3). Theo luật routing-theo-audience (`docs/platform-foundations.md`
L4, D-ID `14ebeea9`): agent↔agent trong chain dùng **prose-handoff tường
minh**, không JSON contract — LLM đọc prose tốt hơn parse JSON. Tài liệu này
là bản chốt bằng văn xuôi của contract đó cho runner cụ thể; không phải code
runtime mới (chỉ prose + bảng).
```

## claim_9367df2fda6ccfd64b492221b3ccb2ce

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-3`
Unit SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`
Shown SHA256: `8b5e7c62b0389dfd419b8d3e3e2c0e14badeaeb32f1af3abaa200bfc5019b1a4`

```text
Mỗi lần dispatch, runner dựng prompt cho worker từ đúng bốn phần cố định
(nguồn: `src/runner/dispatch.mjs`'s `buildPrompt`, per D3) — thứ tự và tiêu
đề là contract, test đã pin sự hiện diện của cả bốn:
```

## claim_d19685eef13fb0f7793fbd168603a7cb

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-4`
Unit SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`
Shown SHA256: `3bad6f8df905ee9bbfa79324205fbc11cd21b56a1c356970c1edffc66da6e9e9`

```text
1. **Goal** — tiêu đề + kind của work item, lấy nguyên từ item, không diễn
   giải thêm.
2. **Worktree boundary** — worker chạy trên một worktree/nhánh cô lập riêng
   cho đúng item này (per D4); ở lại trong checkout đó, không chạm working
   tree chính, nhánh khác, hay worktree khác.
3. **Expected proof** — câu lệnh `verify` của chính item, nói rõ: runner tự
   chạy lại câu lệnh này sau khi worker xong (goal-check, per D3) — báo cáo
   của worker không bao giờ được tin một mình.
4. **Constraints** — cấm gọi `fgos` hoặc ghi `.fgos/` trực tiếp (runner là
   người ghi duy nhất trong vòng dispatch, per D3); commit trên nhánh của
   mình và báo cáo; không merge/push/tự duyệt việc của mình.
```

## claim_14b98e16e698b83d2fd20b0c6c3c0c0e

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-5`
Unit SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`
Shown SHA256: `c2073ac3afb840a1f4cb863f52b45bf5cd07e78d59648c98514d7ce35f0d3851`

```text
Route theo audience (L4): skill/agent forgent tương lai muốn tham gia chain
runner đọc bảng này để biết vào từ đâu — không có một điểm vào toàn cục.
```

## claim_2864848618f8c97ee8feee1223a3fe69

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-6`
Unit SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`
Shown SHA256: `55329ade338d4cc7a7821d3882f0a03a86507a60c965554267a1c548a7fa5aa6`

```text
| Vai trò tương lai | Đọc gì trước | Vào ở đâu | Không được làm |
|---|---|---|---|
| Skill khởi tạo backlog (đề xuất work item mới) | `docs/specs/work-state.md` (schema work) | `fgos add` — CLI, một cửa ghi | Không tự ghi `.fgos/events.jsonl` |
| Skill giám sát vòng runner (dashboard/report) | `fgos list` / `fgos ready` (đọc, không ghi, per request-class D1) | Đọc `state.json` hoặc gọi `ready` | Không suy luận frontier bằng danh sách tay — luôn derive (RUL5 (platform-foundations)) |
| Skill duyệt đề xuất (review `proposed` → `done`) | Nhánh `fgw/<id>` + báo cáo worker | `fgos move <id> --to done --expect proposed` | Không tự động merge khi review chưa chạy (per D4 — người/vòng review quyết) |
| Worker kế tiếp trong chain con (agent nối tiếp) | Chính work item đã dispatch (title/kind/refs/verify) | Nhận đúng bốn phần prompt ở trên, không phần nào khác | Không tự gọi `fgos`; không giả định trạng thái ngoài những gì prompt nói |
| Executor mới (đổi agent CLI, ví dụ `codex exec`) | `.fgos/config.json`'s `runner` section — `executor.command`/`args`, template `{prompt}`/`{model}` | Sửa config, không sửa `dispatch.mjs` | Không nối chuỗi prompt vào một lệnh shell (luôn argv, `shell: false`) |
```

## claim_b097cfe02712fd82b1723c1182939f50

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-7`
Unit SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`
Shown SHA256: `3e9d4aa6375656eb6da53d2a48f93c789d3f65e2ba76b742fe84a39aff8dde6d`

```text
Mọi bước trong chain (runner → worker → review) khép lại bằng đúng một câu,
không paraphrase:
```

## claim_5217639e14288f74c6007f12a095928b

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-8`
Unit SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`
Shown SHA256: `fda20ea3a88124927805fa832f84a08e91ca15e620654154c14427693839ec3b`

```text
> "Việc `<id>` đã đề xuất trên nhánh `<fgw/id>` với goal-check tự chạy —
> chưa phải xong; cần duyệt/merge (per D4) mới thành `done`."
```

## claim_13a4216f8c74525fcad2a0712a4e22ff

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-9`
Unit SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`
Shown SHA256: `b3cb0726462123aa6e4ef13561a6ad5ec6a0cf099f8d3cfd13007eb2a886a508`

```text
Khi từ chối (`proposed → todo`), câu tương ứng:
```

## claim_7f557c80e647be8772086b6df12369c2

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-10`
Unit SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`
Shown SHA256: `d40d1f008afc0371c6d83fe1704cd8d0e2f73f6c960d5f961abe8fac6aa1192f`

```text
> "Việc `<id>` bị từ chối, lý do `<reason>`; quay lại `todo`, sẽ vào lại
> frontier trừ khi chạm anti-loop max-visits."
```

## claim_5a85eef20e5da9f327a2330ac46b4015

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-11`
Unit SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`
Shown SHA256: `4be0ec5bb2c597e320711f0bc22ad295d520b86c3fea127231150e767f8903cb`

```text
Bất biến môi trường: mỗi agent khởi đầu tại project-root CỦA NÓ (git-root của cwd nó đứng); worker không bao giờ thấy harness phát triển của xưởng — cách ly vị trí đến từ worktree-trong-tmp, đo định kỳ bằng canary item (worker tự khai môi trường, verify assert). Diễn tập/canary không bao giờ ghi vào nhật ký sự kiện thật.
```

## claim_15ea8720bb2e7e74fc0b6184a5dcf8dd

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-12`
Unit SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`
Shown SHA256: `ef3f75a61f26da65653effa99f98b85a4a62e97464397094f73bd956124d892c`

```text
Ba bất biến, tách bạch rõ để không ai đọc nhầm đây là sandbox:
```

## claim_6eeffde2515915efa565732c72bad473

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-13`
Unit SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`
Shown SHA256: `219e04ff1e7f76c513c2326948e78ac7da7e7393b66fac04d3df089886479771`

```text
- **Containment bằng chỉ dẫn + nhánh vứt-được, KHÔNG PHẢI sandbox.** Worker
  chạy full quyền của user hiện tại (per `worktree.mjs`'s "SAME-USER TRUST
  INVARIANT"); cô lập ở đây nghĩa là "nhánh/worktree riêng, sai thì vứt" (D4),
  không phải giới hạn hệ điều hành nào. Không tin containment này chặn được
  một worker cố ý phá hoại.
- **Work item phải do chính user tạo.** `dispatch.mjs`'s "TRUST INVARIANT":
  `verify` chạy như một shell command thật (goal-check, D3) — một item nạp từ
  nguồn không được rà soát là một injection vector trước khi tới dispatch.
  Không bao giờ nối một intake path bên ngoài/không tin cậy vào `work` mà
  thiếu một cửa review ở giữa.
- **`.fgos/config.json`'s `runner` section là
  config THỰC THI ĐƯỢC, không phải dữ liệu thụ động.** Ai sửa được file này
  quyết định runner spawn tiến trình gì, với argument gì (per
  `dispatch.mjs`'s "TRUSTED-CONFIG NOTE"). File này committed (D2 — bền
  vĩnh viễn, review được như code) nhưng mang đúng mức tin cậy của code: chỉ
  áp dụng từ một checkout đã tin cậy sẵn.
- **Context ref tới kết quả vai/bước trước là đường dẫn tuyệt đối dưới
  `.fgos/assignments/` của main checkout.** Worker chỉ đọc, không ghi; runner
  kiểm sha256 lúc settle trước khi trao. Không mở rộng quyền đọc: worker vốn
  đọc được (`--ro-bind / /`, `hostRead: allow`). Câu trả lời của owner ở cổng
  người của một Workflow run cũng đi đường này (`gate-answer:` → file dưới
  `.fgos/workflow-runs/<id>/gate-answers/`): là input của owner, không phải
  output của agent khác, và brief nói rõ như vậy. Với `anonymizeInputs` các
  report được chép sang `<unitDir>/inputs/seat-*.md` để brief không lộ ai nói;
  đó chỉ là ẩn danh theo thứ được trao, không phải ranh giới đọc.
  Hợp đồng cấm worker *ghi* `.fgos`; Unit `blind: true` còn cấm nó *đọc* run state của
  peer (`.fgos/assignments`, `.fgos/workflow-runs`, `.fgos/dispatch-runs`, socket herdr,
  home và tiến trình của dispatch khác): vai blind chỉ đọc thư mục của chính nó (kết quả vai/bước trước tới nó dưới dạng bản chép nguyên byte
  trong `inputs/` của thư mục đó) và bị từ chối chạy nếu không thực thi được (`docs/specs/confinement-authority.md` §9.2).
```

## claim_27aff750d0ba834c746a5841770667cb

`docs/platform/runner/contracts/routing-handoff.md#unheaded-block-14`
Unit SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`
Shown SHA256: `7aca3755b9d4f4f1826236f51b161291ff58d7dca9d6e1dc2bf1f26a10bcc792`

```text
`src/runner/dispatch.mjs` (prompt + trust invariant) · `src/runner/worktree.mjs`
(same-user trust invariant) · `docs/platform-foundations.md` L4 (`14ebeea9`)
· `docs/specs/runner.md` (ADR-0005 Runner & cô lập worker, D3/D4).
```

## claim_c8feb2e73a6808945b3e28ecf6291b66

`docs/platform/vision.md#unheaded-block-2`
Unit SHA256: `333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836`
Shown SHA256: `333a4b2486599a56bd1b8f8c779963155d9616ed20374dc34e5f14fac1b61836`

```text
fgOS exists to make agent applications and business-base workflows faster, safer, more reusable, and less dependent on a human sitting in the loop.
```

## claim_f653c9c029036673c35aeb5ff8ed2ae9

`docs/platform/vision.md#unheaded-block-3`
Unit SHA256: `37d3dc5d4da6e21ac01d35aa2db581d5f3a7d58449c1f8a26e2d7fba753aec31`
Shown SHA256: `37d3dc5d4da6e21ac01d35aa2db581d5f3a7d58449c1f8a26e2d7fba753aec31`

```text
This document is the whole-platform north star. Area visions, such as `docs/platform/packaging-distribution/vision.md`, should align with it.
```

## claim_b6af228ec920c86ed2ca297d1fcd99dc

`docs/platform/vision.md#unheaded-block-4`
Unit SHA256: `fcc7271ad97b4e8c16e9069eb29c9b20da361343bde1d1532d28c9a95dc0d0fa`
Shown SHA256: `fcc7271ad97b4e8c16e9069eb29c9b20da361343bde1d1532d28c9a95dc0d0fa`

```text
The companion [intent-preservation-ledger.md](intent-preservation-ledger.md)
tracks parts of this direction that are only partially implemented or
deliberately deferred. A simplified implementation slice does not shrink this
vision unless an explicit decision says so.
```

## claim_744dfc7dabdb1afc35f335a71c4dfbcc

`docs/platform/vision.md#unheaded-block-5`
Unit SHA256: `57a466fc5e6510e5f79d43250a9365a26d5a6eb239cf50d7ae8f039c58479f6b`
Shown SHA256: `57a466fc5e6510e5f79d43250a9365a26d5a6eb239cf50d7ae8f039c58479f6b`

```text
fgOS exists to:

- develop other projects;
- run business-base workflows;
- provide reusable platform infrastructure for agent applications.
```

## claim_3762f9bdc9ec0ade5909594d5df7bdfb

`docs/platform/vision.md#unheaded-block-6`
Unit SHA256: `d4f74d1a2ba7f80df408ede64e8421ed0a84414c0c5ba2ebc9d9925d992f2b9a`
Shown SHA256: `d4f74d1a2ba7f80df408ede64e8421ed0a84414c0c5ba2ebc9d9925d992f2b9a`

```text
fgOS does not exist primarily to develop itself. Dogfooding inside this repo is necessary, but it is not the mission.
```

## claim_494d8e8822be204801bf5ff8eb769ae4

`docs/platform/vision.md#unheaded-block-7`
Unit SHA256: `cdba578e364cab804a6697f995d211ff840052b1290102be0ffeadd35a5427d7`
Shown SHA256: `cdba578e364cab804a6697f995d211ff840052b1290102be0ffeadd35a5427d7`

```text
When trade-offs collide, use this order:
```

## claim_14ea9b6dc062608fa5b63ed0631b96be

`docs/platform/vision.md#unheaded-block-8`
Unit SHA256: `3053f892e107efcb15cf5c0f575f74d7eb1abd5c99a147b68d5b31bc04931a82`
Shown SHA256: `3053f892e107efcb15cf5c0f575f74d7eb1abd5c99a147b68d5b31bc04931a82`

```text
1. Ship faster for projects using fgOS.
2. Release humans from waiting, babysitting, and repetitive coordination.
3. Produce reproducibly verifiable results with evidence-linked documentation.
4. Polish after the definition of done is satisfied.
```

## claim_0ea347963e49153158871a3235afc483

`docs/platform/vision.md#unheaded-block-9`
Unit SHA256: `f052f5c431c476ae9020646a613ddd9161c9e97274d52468cbce69b3e4cdbd38`
Shown SHA256: `f052f5c431c476ae9020646a613ddd9161c9e97274d52468cbce69b3e4cdbd38`

```text
Lower priorities do not override higher priorities.
```

## claim_d46e6059744853141c52690dd123172e

`docs/platform/vision.md#unheaded-block-10`
Unit SHA256: `7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2`
Shown SHA256: `7187b249eb9b0eafb62fbaddb443c1f1b0a2fd491722aaaaf2c907101fc4e3b2`

```text
The platform direction is:
```

## claim_97612b7e12b29ed8b81108acdf8a9285

`docs/platform/vision.md#unheaded-block-11`
Unit SHA256: `78570f317b86844d5b6bce311cbe8446773d9690ba0d7b83c43e865375aba46b`
Shown SHA256: `78570f317b86844d5b6bce311cbe8446773d9690ba0d7b83c43e865375aba46b`

````text
```txt
human intent
  -> durable work/state
  -> domain-aware shaping and planning
  -> governed agent execution
  -> verifiable result
  -> retained learning
```
````

## claim_dcde5099b1a9c73ca23fdd0a3c3184f7

`docs/platform/vision.md#unheaded-block-12`
Unit SHA256: `f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1`
Shown SHA256: `f72e0eacbeac76734c5e4959a52864c3e57ce8a82cc1b473003815e5d53ad7b1`

```text
Humans should stay present for judgment, review, and direction. They should not need to manually preserve every useful design point or monitor every execution step.
```

## claim_e61a4b569537191f080ca673d3dead6c

`docs/platform/vision.md#unheaded-block-13`
Unit SHA256: `dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea`
Shown SHA256: `dbad144992f606d174d337ca04afe24ff5e6d69f2fff57aa4d8d7b028692e6ea`

```text
- Keep boundaries clear: component ownership, contract authority, and state writes must be explicit.
- Keep docs useful to humans: reading paths, implementation status, proof, and related links are part of system quality.
- Prefer extensible registries and contracts over hidden one-off behavior.
- Treat generated docs as projections, not new authority.
- Keep work restartable by a stranger agent with no chat history.
```

## claim_908f25861679e06c2aab8286758c076c

`docs/platform/vision.md#unheaded-block-14`
Unit SHA256: `47e992413c7b6cbe3b8e2c54b93e7924dc9bb7edd12d047d87c2c368079b4718`
Shown SHA256: `47e992413c7b6cbe3b8e2c54b93e7924dc9bb7edd12d047d87c2c368079b4718`

```text
| Need | Read |
| --- | --- |
| Preserved platform intent | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| Platform laws | [platform-foundations.md](platform-foundations.md) |
| Whole-system architecture | [architecture-map.md](architecture-map.md) |
| Component authority map | [component-boundary.md](component-boundary.md) |
| Documentation governance | [../doc-governance.md](../doc-governance.md) |
| Legacy full law source | [../platform-foundations.md](../platform-foundations.md) |
```

## claim_4017b67624bf5928f85776079b09a225

`docs/platform/vision.md#unheaded-block-16`
Unit SHA256: `39a2d681b9faf6d2009912b9d422923de31d8bf62cb70a934d043c8f203bc92b`
Shown SHA256: `39a2d681b9faf6d2009912b9d422923de31d8bf62cb70a934d043c8f203bc92b`

```text
**Trạng thái:** TẦM NHÌN / ĐỊNH HƯỚNG — chưa khoá thành luật (platform-foundations) hay spec;
còn câu hỏi mở. **Ngày:** 2026-07-15. Nguồn: định hướng của chủ sản phẩm.
```

## claim_bb977e0482954d2fc918057e0c3db86e

`docs/platform/vision.md#unheaded-block-17`
Unit SHA256: `e02516ed37296056336868cb69cf96afa00d7fe1aab05bbc83d6060e55175f6c`
Shown SHA256: `e02516ed37296056336868cb69cf96afa00d7fe1aab05bbc83d6060e55175f6c`

```text
Tài liệu này ghi lại chu trình sống của một work-item để không mất, và làm khung cho các PBI
kế tiếp. Nó chưa phải hợp đồng thi hành — mọi bước chưa dựng đều là backlog.
```

## claim_a1cb6abd9bd3095c9441de30200e0a91

`docs/platform/vision.md#unheaded-block-18`
Unit SHA256: `823a41ccd6698d68c84831bad5b682ada83bd6d205016021212b9ca6e75ef2e4`
Shown SHA256: `823a41ccd6698d68c84831bad5b682ada83bd6d205016021212b9ca6e75ef2e4`

```text
fgOS **không phải** "runner headless không người". Nó là **pipeline bán-tự-động
(mixed-autonomy)**: tự động là mặc định, người xen vào ở những **cổng (gate) có điều kiện**, và
mức độ người-tham-gia **thay đổi theo giai đoạn** của work-item — không cố định.
```

## claim_e1c8f583246e09f75adc9d2ad8bc0a6d

`docs/platform/vision.md#unheaded-block-19`
Unit SHA256: `0df1c3469f13d847fbc27694e65d4ba521c2a3ed160a24b0028539e2a1f582bb`
Shown SHA256: `0df1c3469f13d847fbc27694e65d4ba521c2a3ed160a24b0028539e2a1f582bb`

```text
Khác biệt cốt tử với bee: **bee chặn phiên chat ở mỗi gate**; fgOS biến gate thành **checkpoint
bất đồng bộ** mà hệ *đậu lại (park) và chờ người quay lại* — tuỳ chế độ intake. Người không phải
lúc nào cũng ngồi đợi.
```

## claim_e5b774d18711483291e0971bbd82c610

`docs/platform/vision.md#unheaded-block-20`
Unit SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`
Shown SHA256: `8ccb6ca76a1fef51686027603807b932c04e6bfc63521b9b503afbb28a7899d2`

```text
Mọi loại công việc chia sẻ MỘT chu trình xương sống; mỗi domain (coding, marketing, HR,
finance…) **kế thừa base và thêm stage riêng**:
```

## claim_daacabed1ae2085ba8489ba27365c4ad

`docs/platform/vision.md#unheaded-block-21`
Unit SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`
Shown SHA256: `148b3d406039a3547d25ff35cff9f22cbcdfffddf9204df0bbead2f63259249e`

```text
1. **Init / Intake** — tiếp nhận vấn đề vào hệ thống.
2. **Làm rõ (Clarify)** — phân loại, khám phá ngữ cảnh, và (nếu cần) exploring cùng người.
3. **Chia việc (Divide)** — làm giàu ngữ cảnh + planning thành các item nhỏ độc lập, dependency
   rõ, đẩy vào queue.
4. **Thực thi (Execute)** — runner tự làm từng item; tạo PR; người review; hệ tự merge.
5. **Compound-learning** — học từ chính vận hành.
```

## claim_a02d016af305db13788a0cdee561015d

`docs/platform/vision.md#unheaded-block-22`
Unit SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`
Shown SHA256: `b8070b2c948fabc9f8a58187e74452dc6fa7671582674606523540397f93ce63`

```text
Domain **coding** thêm: context-discovery, PR lifecycle. Marketing/HR/finance sẽ thêm stage của
họ trên cùng base này. **Một base — nhiều domain-extension.**
```

## claim_f920db2957d54b1c26c573d98c0368a9

`docs/platform/vision.md#unheaded-block-23`
Unit SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`
Shown SHA256: `4b0f3ddb074b9b7c03a796c4b351ad7b7f826403bba10abc7e0fecbe3ecee7f5`

```text
- **(a) Submit rồi rời đi (un-attended):** người nộp vấn đề rồi bỏ đi. Hệ ghi nhận + tự phân
  loại; các bước sau **đậu lại ở cổng-người khi cần và chờ người quay lại** (bất đồng bộ), không
  chặn một phiên sống.
- **(b) Submit và xử lý ngay (collaborate-now):** người nộp và muốn làm cùng; hệ tiếp tục
  tương tác để triển khai các bước, dừng ở cổng-người theo thời gian thực.
```

## claim_77e62eb0fd3eaffce6440d694c3fbf63

`docs/platform/vision.md#unheaded-block-24`
Unit SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`
Shown SHA256: `e4b5970e98f2d83a3e9f4cb7496bd0f878cde92a34fb45c51f6253454b3757ea`

```text
1. Người đưa vấn đề vào (**intake**) — 2 chế độ (a)/(b).
2. Hệ **ghi nhận một work-item** và phân loại như thường.
3. Runner sơ khởi chạy **phân loại + context-discovery** (bước khởi đầu).
4. Task đơn giản, thuần, không phức tạp → mark **`ready`**; một runner khác pick để xử lý.
5. Task **chưa rõ + phức tạp**, cần định hướng cùng người → chuyển trạng thái **`need-exploring`**.
6. Kích hoạt bước **exploring** (giống bee).
7. Chốt xong → hệ tự **làm giàu context + planning** thành **n item nhỏ độc lập**, dependency rõ,
   chia nhỏ và đẩy vào **queue**. *(Câu hỏi mở: bước này chạy runner không-người-đợi, hay cần
   người ngồi đợi — xem §7.)*
8. Hệ tự **giải quyết các item** bằng runner.
9. **Tạo PR**.
10. **Người review PR** (cổng-người).
11. Hệ **tự merge PR**.
```

## claim_9078e52079c32668f9741a928e0dbdec

`docs/platform/vision.md#unheaded-block-25`
Unit SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`
Shown SHA256: `0d786b5dc117745c1dcaa3c0936a20e33dac711ecd205f3950975e47fef31b12`

```text
| Giai đoạn | Người tham gia? |
|---|---|
| 1 Intake / submit | **NGƯỜI** khởi tạo (2 chế độ) |
| 2 Ghi nhận + phân loại | Tự động |
| 3 Phân loại + context-discovery | Tự động (runner sơ khởi) |
| 4 Simple → `ready` → pick | Tự động |
| 5 Unclear → `need-exploring` | Tự động chuyển trạng thái |
| 6 Exploring | **NGƯỜI** (hoặc hoãn tới khi người quay lại nếu chế độ (a)) |
| 7 Enrich + planning → queue | Tự động — *có thể* cần **NGƯỜI** (câu hỏi mở) |
| 8 Execute item nhỏ | Tự động (runner) |
| 9 Tạo PR | Tự động |
| 10 Review PR | **NGƯỜI** (cổng) |
| 11 Merge PR | Tự động |
```

## claim_f260f60c3c5e6be76875ab529ed79fcf

`docs/platform/vision.md#unheaded-block-26`
Unit SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`
Shown SHA256: `672345732b93d34f1504aea4a190f39fff21621357529e7178b85a0650ba7459`

```text
- **Phase 1 (state-layer)** + **Phase 2 (routing/runner)** = nền của stage **Thực thi**
  (work-state FSM, frontier, runner loop, recovery matrix).
- **Phase 3 (compound-learning)** = stage **Compound-learning**.
- **Chưa có (là backlog):** Intake (1-2), context-discovery + `need-exploring` + exploring
  trong-sản-phẩm (3,5,6), auto planning→queue (7), PR lifecycle (9-11), và mô hình
  base-workflow / domain-extension.
```

## claim_f444024692d303b0c44c63a75add5854

`docs/platform/vision.md#unheaded-block-27`
Unit SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`
Shown SHA256: `f570e39ac9c0dcc0a393e34d33121a6c2c235c756b1af526037111496d773709`

```text
1. **Bước 7 (planning) có cần người đợi không?** Một mặt exploring nên giải quyết hết khúc mắc;
   mặt khác chính lúc planning mới lộ khúc mắc → có thể cần một cổng-người ở đây. Chưa ngã ngũ.
2. **Workspace thực thi (bước 8-9):** mỗi item nhỏ một git worktree riêng, hay nhiều item chung
   một worktree?
3. **Độ hạt PR (bước 9):** mỗi item nhỏ một PR, hay gom mọi item nhỏ của một
   human-submitted-item thành một PR?
```

## claim_eadf04a694e0bd2ae9423119916381ca

`docs/platform/vision.md#unheaded-block-28`
Unit SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`
Shown SHA256: `c1183579f67e4b81a05a89a2c2f0c501291f4b02fe6e6d07acfcd1904a7beabf`

```text
Chu trình này giải toả điểm mờ của slice 2: **capture bám vào các chuyển-trạng-thái của FSM
lifecycle, không phải "lượt chat"** — đúng thứ Phase 1/2 đã dựng.
```

## claim_fed0e496180b55e06ae9f25e9b5c0741

`docs/platform/vision.md#unheaded-block-29`
Unit SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`
Shown SHA256: `05b9c508d627aca1823c679270b8167e40d2d05ed69900620c8596f48d9dea60`

```text
- **Settlement (kênh 1)** = ghi tại các transition **ngã-ngũ**: quyết định lock ở exploring (6),
  PR duyệt (10), và các auto-transition. **Actor thay đổi theo stage** (người ở cổng, runner ở
  bước tự động). Dạng đầy đủ **chờ các stage này được dựng**; hiện chỉ có transition của
  work-state FSM (todo/doing/proposed/blocked/done).
- **Friction (kênh 2)** = ghi tại transition **thất bại** của bất kỳ bước tự động nào (execute,
  discovery…), runner **tự quy tội**. **Làm được ngay** — nhánh fail đã tồn tại (park/halt).
```

## claim_c711587bc72d3f08a41dd9c12e96225d

`docs/platform/vision.md#unheaded-block-30`
Unit SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`
Shown SHA256: `bbb754f410d5c011ee0b8641a6f792a607d8234ac8fe3a5beb96486fa0d5c4ad`

```text
→ Củng cố hướng: slice 2 làm **friction trước** (độc lập, cần thật, không phụ thuộc stage chưa
dựng); settlement dạng đầy đủ theo sau khi các stage lifecycle (exploring/PR) được dựng.
```

## claim_0e63fab01f4b08d4713d57dfee60f724

`docs/platform/work-state/architecture/implementation-pointers.md#unheaded-block-2`
Unit SHA256: `4e5185bf76d81997933e0c97655c3504c9913d23cecdf0f5ac282aa5f5c701c0`
Shown SHA256: `4e5185bf76d81997933e0c97655c3504c9913d23cecdf0f5ac282aa5f5c701c0`

```text
This document lists which implementation module owns which responsibility of the work state area.
```

## claim_bd07a20734ca19b6b9c6197be7061505

`docs/platform/work-state/architecture/implementation-pointers.md#unheaded-block-3`
Unit SHA256: `7542cfb4d64398d37bafa7ce4cb4bc918bd7243c7cc8e2a4a82794055785b0c3`
Shown SHA256: `7542cfb4d64398d37bafa7ce4cb4bc918bd7243c7cc8e2a4a82794055785b0c3`

```text
- `bin/fgos.mjs` — CLI một cửa, bảng EXIT_CODES, resolve `.fgos/` từ cwd; verb `rollup <id>` (STR24) — đọc thuần qua `listWork`, không cửa ghi mới: not-found báo `validation` cùng khuôn `review`/`approve`; đếm con TRỰC TIẾP qua `Object.values(view.work).filter(w => w.parent === id)` (KHÔNG đệ quy đa tầng như `frontier.mjs`'s `hasOpenDescendant` — job khác nhau, gate frontier vs báo tiến độ, và phán chia-việc hiện chỉ sinh một tầng con); verb `triage` (STR21) — đọc thuần qua `listWork` + `rankImpact` (`src/state/impact.mjs`), formatter riêng `formatTriage` (không tái dùng `formatCandidateList`/`formatRollup` — hình dạng dòng khác)
- `src/state/impact.mjs` — backlog-triage impact ranking (STR21): thuần (`rankImpact(view)`), không fs/Date.now/mutation, cùng kỷ luật với `src/evolve/candidates.mjs`. `blocks` của một item = số item KHÁC chưa `done` đang liệt kê id đó trong `deps`; item `done` không được xếp hạng và không được đếm ở phía đếm; sắp xếp `blocks` giảm dần rồi id tăng dần (tie-break). Đây là proxy tác động dẫn xuất từ `deps` sẵn có — KHÔNG phải trường `priority`/`impact` mới trên schema work.mjs (đó là phạm vi STR7/STR8, còn `awaiting-approval`). Manifest layer: domain.
- `src/state/store.mjs` — chủ ghi duy nhất (append event → update view); facade lỗi: EXIT_CODES + categoryOf + re-export 4 error class; STATUSES sống ở work.mjs (fsm re-export); `addWork`/`editWork`/`moveWork`/`moveStage` mỗi cửa bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStage`) trong một phiên giữ `.fgos/events.lock` (qua `withEventsLock`/`appendEventLocked` của `events.mjs`) — hai verb tương tác song song trên CÙNG id không còn cùng qua tiền-kiểm cũ rồi cùng ghi hai sự kiện mâu thuẫn (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw); `refreshView` vẫn chạy sau khi khóa nhả, không đổi; `addOutcome` — cửa ghi outcome (mẫu `addDecision`), gọi trực tiếp từ runner (không qua verb CLI); `addFriction` — cửa ghi friction (mẫu giống `addOutcome`), cũng gọi trực tiếp từ runner; `moveWork` chuyển tiếp `ask`/`answer` cho `transitionWork`, GẮN `role` vào payload SAU khi transition thuần trả về (không truyền vào transitionWork — payload bị rebuild sẽ nuốt mất), và khi `to==='done'` compose bài học câu-6 (`composeLearning`, thuần, try/catch best-effort) từ view TRƯỚC transition + settlement đóng sắp sinh, gắn additive vào CÙNG event `work.move`; `putInAwaiting`/`answerAwaiting` — hai verb mỏng đưa-vào-chờ / trả-lời (append event chuyển-trạng-thái mang câu hỏi/câu trả lời rồi refresh view); `moveStage` — cửa ghi đổi-stage (mẫu `moveWork`, một tầng phía trên), chuyển tiếp `transitionStage`, cùng cách gắn `role` post-transition; `addDiscovery` — cửa ghi bản ghi discovery (mẫu `addFriction`); `moveWork` nhận thêm một tham số cộng-thêm tùy chọn `headAtTake` (gắn post-transition, cùng cách gắn `role` — không đưa vào `transitionWork`), để cửa pull `take` cõng HEAD của host repo lên sự kiện claim; mọi lời gọi khác (runner, `add`/`move`/`ask`/`answer`) không bao giờ truyền tham số này nên nó luôn `undefined`, no-op, tương thích ngược tuyệt đối; cùng khuôn, `moveWork` nhận thêm `headAtReturn` (per pr-lifecycle / 1359ab5e) — CHỈ cửa pull `return` truyền, gắn post-transition trên cạnh `doing→awaiting-approval`; cùng khuôn thêm lần nữa, `moveWork` nhận `branchHeadAtTake`/`branchHeadAtReturn` (per human-rounds / 5a6900b2) — CHỈ cửa pull `take`/`return` nguồn-nhánh truyền, gắn post-transition trên đúng cạnh `blocked→doing`/`doing→awaiting-approval` tương ứng; đây là fix write-side allowlist mà bee-validating gắn cờ CRITICAL trước khi cell dựng thật — thiếu nó, hai field mới bị `moveWork` âm thầm nuốt mất trước khi sự kiện tới `appendEvent`; `EDITABLE_FIELDS` (dòng ~185) nay có thêm `'acceptance'` (per str73-done-flip-cos-check cell 1); `moveWork` nay có HAI khối gác riêng, cả hai chạy trước `appendEventLocked`: khối `if (to === 'delivered')` đọc `work.acceptance` và ném `StoreError('precondition', ...)` nếu một clause có `text` mà thiếu `evidence` (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) — gác ở cửa `delivered`, không phải `done`; cửa duyệt gọi lại chính phép kiểm này như một bước tiền-kiểm trước merge), và khối `if (to === 'done')` soạn bản ghi học câu-6 (RUL21 (câu-6 tự động — bài học lúc đóng)). Khối gác compound-learn cũ ở cửa `done` đã gỡ cùng stage đó — điều nó cưỡng chế nay do hình dạng tuần tự của chuỗi đuôi đảm bảo (RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi))
- `src/state/work.mjs` — `validateWork`'s khối kiểm hình dạng `acceptance` (mirror khối `footprint`/`docsRef`): khi có mặt, đòi `Array.isArray`, mỗi phần tử là object thuần với `text` chuỗi không rỗng và `evidence` vắng/`null`/chuỗi không rỗng — sai hình dạng ném `WorkValidationError` nêu đích danh phần tử lỗi (Data Dictionary #24, str73-done-flip-cos-check cell 1)
- `src/cli/command-registry.mjs` — verb `add`/`submit`/`edit` mỗi verb có thêm property `acceptance` (type string, mô tả JSON-encoded array) trong `parameters.properties`; `bin/fgos.mjs` có thêm helper `parseAcceptanceFlag(value, message)` (JSON.parse bọc try/catch, ném lỗi `validation` khi parse hỏng) xâu qua `case 'add'`/`case 'submit'`/`case 'edit'` (str73-done-flip-cos-check cell 1)
- `src/state/events.mjs` — append/read JSONL `.fgos/events.jsonl` (seq + ts ISO, path tường minh), phát hiện corrupt tail; `appendEvent` bọc chuỗi đọc-seq/tính/append trong một `.fgos/events.lock` liên-tiến-trình (khóa dẫn xuất từ `path.dirname(logPath)` nên một log-dir khác — vd `porting-store.mjs` — tự có khóa riêng), chính sách CHẶN-có-timeout mirror `acquireSessionsLock` (một thể hiện thứ ba độc lập, KHÔNG import từ `loop.mjs`/`session.mjs`, giữ module zero-dep), timeout/retry cỡ đường-nóng (2s/10ms — không sao chép mù mốc 10s cỡ vòng-đời-phiên của `acquireSessionsLock`), giải phóng trong `finally` mọi lối ra, hết giờ → `EventLogError('lock-timeout')` (phạm trù MỚI); `repairTruncatedLastLine` CỐ Ý không lấy khóa này (xem yêu cầu KHÔNG-tiến-trình-song-song ở entry point `repair`); xuất thêm `withEventsLock(logPath, fn)` (giữ khóa qua `fn`, để một caller có tiền-kiểm riêng — vd `store.mjs` — bọc TRỌN chuỗi đọc-kiểm-ghi thành một phiên giữ khóa) và `appendEventLocked` (lõi đọc-seq/tính/append KHÔNG tự khóa, dùng khi khóa đã đang giữ; `appendEvent` công khai nay chỉ là `withEventsLock` bọc quanh lõi này, hành vi công khai không đổi cho mọi caller cũ) — per store-atomic-rmw; RUL10 (tiền đề có ngưỡng)
- `src/state/fsm.mjs` — bảng TRANSITIONS + precondition + CAS, thuần (chiều `status`, KHÔNG BAO GIỜ do domain chi phối); nay mang cả chuỗi đuôi `delivered → retrospective → cleanup → done` cộng cạnh rẽ `cleanup → blocked`; cạnh `todo/doing→awaiting-human` bắt buộc `ask`, cạnh `awaiting-human→todo` bắt buộc `answer` (cùng cơ chế `reason`-trên-`awaiting-approval→todo`), giá trị trim vào `payload.ask`/`payload.answer`; cạnh `awaiting-approval→blocked` (per pr-lifecycle / 1359ab5e) bắt buộc `reason`, cùng cơ chế enforce với `awaiting-approval→todo`; cạnh `blocked→awaiting-approval` (per fan-out-parallel / 2e92b7a5) KHÔNG bắt buộc `reason` — mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, không phải khuôn bắt-buộc-lý-do
- `src/state/step-fsm.mjs` — quyết định chuyển bước (precondition + CAS), thuần, mẫu hệt `fsm.mjs` một tầng phía trên; cạnh hợp lệ là `transitions` của Workflow của domain (`domains/<d>/workflows/*.yaml`), file này không giữ bảng riêng; trả sự kiện `work.step`
- `src/state/work.mjs` — schema + validate (ID_PATTERN kebab-case); STATUSES gồm cả `awaiting-human` lẫn chuỗi đuôi `delivered`/`retrospective`/`cleanup`; bộ stage hợp lệ nay tra theo domain của item chứ không còn là một hằng phẳng, field `stage` optional (đọc lazy `?? 'executing'` khi vắng mặt, không có trong DEFAULTS); field `parent` optional (lineage, validate string non-self-referencing, không đòi tồn tại — additive, không có trong DEFAULTS); field `domain` optional (đọc lazy `?? 'coding'` khi vắng mặt, không có trong DEFAULTS, cùng khuôn `stage`); `validateWork`'s enum-check cho `stage` tra sổ đăng ký `workflow-stage-graphs.mjs` theo domain của item (thay hằng `STAGES` phẳng cũ) — hành vi domain `coding` không đổi một byte
- `src/state/domain-registry.mjs` — sổ đăng ký domain (kernel layer): phần vòng đời Work của domain (`registry.yaml`: statusLabels, parkReason, classification, roleGraph…) + tra Workflow của domain (`resolveWorkflow`) và các hàm đọc bước (`domainSteps`, `stepForPhase`, `discoverableSteps`, `effectiveStep`, `skillForStep`, `operationsForStep`, `isLegalStepMove`); định nghĩa Workflow (`src/workflow/definition.mjs`, `src/workflow/steps.mjs`) cũng ở kernel layer. Không còn đồ thị stage nào ở đây — bước/chuyển bước/skill/operation là DỮ LIỆU của Workflow
- `src/state/replay.mjs` — fold events → view, thuần; case `work.outcome` gộp theo id vào `view.outcomes` (key lazy, cộng thêm không đè); case `work.friction` APPEND theo id vào `view.frictions` (key lazy, mảng — mỗi record một lần xảy ra, không gộp/không đè); case `work.move` mang `ask`/`answer` gộp theo id vào `view.gates` (key lazy có bảo vệ, cộng thêm không đè); case `work.move` mang `answer` hoặc `to==='done'` (VÀ sự kiện mang phiên bản schema — bảo vệ nhật ký di sản thật) APPEND một bản ghi settlement theo id vào `view.settlements` (key lazy, mảng, kind answer/close); case `work.move` với `to==='done'` mang thêm `learning` APPEND theo id vào `view.learnings` (key lazy, mảng); case `work.add` fold thêm `item.parent` khi payload mang (additive, key lazy); case `work.stage` set `item.stage` (và `item.verify` khi payload mang verify — một sự kiện làm cả hai) và, khi RỜI stage đầu chuỗi (guard theo cạnh ĐI, `from === 'discovery'`, không theo đích cụ thể — để retarget đích không làm câm settlement) VÀ bản ghi `work.discovery` gần nhất của item không mang `clear: false` (RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict)), APPEND một bản ghi settlement kind clarify-pass vào `view.settlements` (tên kind là nhãn di sản đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict)); case `work.discovery` APPEND theo id vào `view.discovery` (key lazy, mảng, cùng khuôn `view.frictions`); case `work.move` đích `doing` fold thêm `role` payload thành `item.claimRole` và `headAtTake` payload thành `item.headAtTake` khi sự kiện mang chúng (additive, lazy — đây là cách `return`/gặt-lại của runner phân biệt claim của cửa pull với claim của runner, xem "Cửa pull giao–nhận việc" trên và spec Runner), cộng thêm `branchHeadAtTake` payload thành `item.branchHeadAtTake` trên CÙNG cạnh khi sự kiện mang nó (nguồn-nhánh, RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)); case `work.move` đích `awaiting-approval` fold thêm `branchHeadAtReturn` payload thành `item.branchHeadAtReturn` khi sự kiện mang nó (mirror `headAtReturn` ở trên nhưng field riêng, không bao giờ cùng mặt trên một item, RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)); case `work.move` mang `reason` (bất kỳ đích nào, không chỉ `awaiting-approval→todo`/`awaiting-approval→blocked`) fold thành `item.reason` — GHI ĐÈ mỗi lần (latest-wins, khác khuôn cộng-thêm-không-đè của outcome/friction/settlement/discovery ở trên, per worker-execution STR33 / 396d9d9e, xem RUL32 (reason mới nhất fold lên item, latest-wins) và spec Runner RUL23 (hợp đồng con — verify thật, không placeholder))
- `src/state/dep-graph.mjs` — dò chu trình đồ thị cạnh-định-kiểu (per work-graph-intelligence S1 + S2a): thuần (không fs/mutation, chỉ import `WorkValidationError` từ `work.mjs` — Domain→Kernel, không import `store.mjs`). **S1 (deps-only):** `findDepCycle(workMap)` → đường chu trình hoặc `null` (DFS + recursion-stack), `assertNoCycle(candidate, workMap)` throw `WorkValidationError` single-arg (message "would close a dependency cycle") khi khép vòng `deps`. **S2a (đồ thị hợp nhất):** `buildUnifiedEdges`/`findUnifiedCycle`/`assertNoUnifiedCycle` chiếu `deps`→cạnh `blocks` và `parent`→cạnh `parent-child` (hướng cha→con) rồi dò chu trình trên tập cạnh chặn hợp nhất; thông điệp lỗi phân biệt "would close a graph cycle" cho chu trình có `parent`, giữ "dependency cycle" cho chu trình `deps` thuần. Gọi tại cả hai site cửa ghi `store.mjs` NGAY SAU `validateWork`, THEO THỨ TỰ: `assertNoCycle` (deps-only, giữ thông điệp S1) rồi `assertNoUnifiedCycle` (phủ toàn đồ thị) trong cả `addWork` và `editWork`. Manifest layer: domain (governance tag). Chu trình `deps` nhiều-nút chỉ phát sinh qua `editWork`; chu trình `parent-child`/trộn phát sinh qua `addWork` (id `parent` không kiểm tồn tại → cha tiến; chu trình khép khi cạnh còn lại được ghi) hoặc `editWork` `deps`
- `src/state/frontier.mjs` — bộ lọc `status === 'todo'` (đã loại `awaiting-human`) VÀ item đang ở stage cuối (bước Thực-thi) theo sổ đăng ký `workflow-stage-graphs.mjs` của domain item đó (thay so-sánh phẳng `stage ?? 'executing' === 'executing'` cũ — domain `coding` vẫn resolve đúng `executing`, hành vi không đổi một byte) VÀ, dẫn xuất thuần từ `parent` (đệ quy qua chuỗi hậu duệ, KHÔNG đụng `deps`), loại một gốc khi bất kỳ hậu duệ nào của nó chưa `done` khỏi ready set
- `src/intake/discovery.mjs` — Use-case của hai stage đầu chuỗi. Phán-quan lồng bên trong (một tiến trình con gọi model) ĐÃ RÚT: `resolveDiscovery` nay ĐÒI một verdict do người gọi truyền vào; chỉ còn hai lối thay thế là tín hiệu tin-cậy `readLockedContext` (artifact quyết định đã commit dưới `docsRef`) và một no-op an toàn cho lượt quét cơ học của runner. Hàm chung DUY NHẤT cho cả verb `discover` và vòng tự hành: đọc item, ghi bản ghi discovery LUÔN, rồi `moveStage` (`clear` → **`planning`** kèm verify thật; `unclear` → **`exploring`**) hoặc `putInAwaiting` (cần người, kèm câu hỏi). Đích của cạnh tra qua `stageForStep(domain, 'Divide')` chứ không hard-code, nên một domain đặt tên stage khác vẫn đi đúng
- `src/intake/plan.mjs` — Use-case tầng sau discovery (đổi tên từ `decompose.mjs` cùng lượt đổi tên stage). Cùng khuôn: phán-quan lồng bên trong đã rút, `resolvePlan` đòi verdict của người gọi. Hàm chung cho cả verb `plan` và vòng tự hành: đọc item, rồi một trong bốn nhánh — pass-through (`moveStage` `planning→executing`, giữ verify cũ), chia (ghi n con qua `addWork` — `parent`/`deps`/verify thật từng con, id con sinh vị trí `<id-gốc>-<n>` không qua `generateId` per id-systems-audit.md #1 — rồi `moveStage` gốc; re-entrancy: view đã có con mang `parent` trỏ về gốc thì không sinh thêm, chỉ hoàn tất chuyển stage gốc), cần-người (`putInAwaiting` mang đề xuất chia làm câu hỏi, gate risk `heavy` đọc từ `item.risk`), hoặc không hợp lệ (không ghi gì, item ở nguyên cho lượt sau). Khi item tới `executing`, hàm này còn NHẢ claim của item về `todo` — phiên cầm việc thi công phải claim lại qua cửa pull. Xuất `readLockedContext`, dùng lại bởi `discovery.mjs` làm tín hiệu tin-cậy
- `bin/fgos.mjs` — verb `check`: đọc `listWork(dir).outcomes`, in predicted-vs-actual; cộng thêm mục friction (đọc `view.frictions`, đếm theo lớp + cap 5 record gần nhất), mục settlement (đọc `view.settlements`, đếm theo kind+role + cap 5), mục học (đọc `view.learnings`, cap 5), và nhắc item trạng thái cuối thiếu outcome — tất cả read-only, không sự kiện mới; tín hiệu entropy-trend + seal-digest trên cùng `check` — xem spec Runner; verb `ask`/`answer` gọi `putInAwaiting`/`answerAwaiting`; `list` mang `view.gates` (câu hỏi hiện ra không cần formatter mới) và trường `parent` khi item mang (đã đi qua `listWork`'s full-object dump, không cần formatter mới); verb `submit` — gọi `classify.mjs` (deriveTitle/classify/generateId) + `envelope.mjs` (wrapEnvelope) rồi `addWork` sẵn có, KHÔNG cửa ghi mới, gắn stage đầu chuỗi của domain (`discovery` với `coding`); verb `discover` — chỉ phục vụ `discovery`/`exploring`, gọi `resolveDiscovery` với `role:'session'`; verb `plan` — verb RIÊNG cho `planning` (và bí danh `decompose`), gọi `resolvePlan`; verb `retrospective` — quét cơ học mọi item `delivered` sang `retrospective`; verb `cleanup <id>` — harness đóng chặng cuối, kiểm TTL + merge-còn-giải-được rồi `cleanup→done`, không đạt thì `cleanup→blocked`; verb `take` — cầm đầu frontier (`readyWork`) hoặc một `--id` cùng tập, CAS `todo→doing` qua `moveWork` mang `role`+`headAtTake` (`currentHead` của host repo), ghi outcome dự đoán qua `addOutcome`; item `blocked` mang nhánh `fgw/<id>` sống (`branchExists`, `worktree.mjs`) rẽ nhánh RIÊNG trước nhánh main-based: CAS `blocked→doing` qua `moveWork` mang `branchHeadAtTake` (`git rev-parse` trên chính nhánh, không phải host repo) thay vì `headAtTake`; verb `return` — kiểm `item.branchHeadAtTake` TRƯỚC mọi guard main-based (nguồn-nhánh không mang `headAtTake` nên kiểm main trước sẽ từ chối oan) — nếu có: đo số commit mới trên nhánh qua `commitsSince`, verify chạy qua `runGoalCheck` trong một worktree tạm DETACHED tại SHA nhánh (`git worktree add --detach`, dọn bằng `git worktree remove --force` trong `finally`, best-effort) — không đụng working tree host repo; xanh + có commit mới → `moveWork` `doing→awaiting-approval` mang `branchHeadAtReturn` (KHÔNG BAO GIỜ `headAtReturn`); không đủ điều kiện → từ chối rõ lý do hoặc `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addFriction`. Đường main-based cũ (không `branchHeadAtTake`) không đổi: TỰ CHẠY `verify` của item qua `runGoalCheck` (`src/runner/goal-check.mjs`, module dùng chung với runner — xem spec Runner) sau khi tự kiểm `isWorkingTreeClean`/`commitsSince` so `headAtTake`; xanh → `moveWork` `doing→awaiting-approval` mang thêm `headAtReturn` (`currentHead`, per pr-lifecycle) + `addOutcome` thực tế; đỏ → `moveWork` `doing→blocked` (`reason:'verify-fail'`) + `addOutcome` thực tế + `addFriction` lớp `verification`; verb `review`/`approve`/`reject` — cổng duyệt PR nội bộ, bề mặt CLI của một cửa duyệt cho mọi đề xuất `awaiting-approval`; cơ chế merge/verify đầy đủ sống ở `src/runner/merge.mjs` (xem spec Runner "Cổng duyệt PR nội bộ" cho hợp đồng đầy đủ)
- `src/runner/loop.mjs` — `runOnce`: NGAY SAU startupReap, TRƯỚC vòng dispatch executing: (1) quét mọi item đang ở stage soi-rõ của domain nó và `status==='todo'`, gọi `resolveDiscovery` — lưới đỡ RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode); (2) NGAY SAU đó, đọc lại view TƯƠI rồi quét mọi item ở stage lập-kế-hoạch và `status==='todo'`, gọi `resolvePlan` — cùng lưới đỡ, cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời stage đầu; không đọc `item.mode` ở cả hai sweep; mọi `moveWork` runner tự ghi (claim/propose/park) gọi kèm `role:'runner'`; cả hai sweep chạy với `role:'runner'` và, vì không mang verdict nào, degrade an toàn về không-làm-gì thay vì đoán bừa
- `src/intake/classify.mjs` — thuần, không import store.mjs: `deriveTitle` (cắt câu/dòng đầu hoặc N ký tự), `classify` (bảng từ khóa → tier/kind/risk, mặc định standard/task khi không khớp), `generateId` (tiền tố cố định `tsk-` + hậu tố hash base36 adaptive 3-8 ký tự, thử lại khi trùng — không còn chứa slug title, per id-systems-audit.md #1, work-id-tsk-hash)
- `src/state/envelope.mjs` — thuần: `wrapEnvelope(data)` → `{contract:'fgos.v1', generated_at, data_hash (sha256 hex của data), data}`
- `src/install/coexist.mjs` — detection marker harness khác (read-only) + ghi manifest `.fgos/coexistence.json` (v1); gọi từ verb `init` trong `bin/fgos.mjs`
- `test/install/coexist.test.mjs`, `test/e2e/coexistence-canary.test.mjs` — unit + canary e2e (guard bee thật qua stdin event, footprint snapshot-diff, nhường-nhịn init)
- `docs/coexistence.md` — doctrine đầy đủ record ADR0009 (lãnh địa, một-nhạc-trưởng-mỗi-phiên, nhường-nhịn, manifest schema, Known Gaps)
- `.fgos/events.jsonl` (committed, truth) · `.fgos/state.json` (gitignored, view)
- Test: `npm test` (`node --test 'test/**/*.test.mjs'`); e2e tại `test/e2e/rebuild-determinism.test.mjs` + `test/e2e/runner-loop.test.mjs` — bao gồm các kịch bản của hai stage đầu chuỗi, các kịch bản của stage lập-kế-hoạch (pass-through, chia-con-chặn-frontier, cần-người), VÀ 1 kịch bản S2-pull (submit → pass-through 2 stage → `take` người → một `fgos-runner --once` song song không giẫm claim người → người `return` xanh → `awaiting-approval`) chạy qua binary thật; round-trip cổng chờ-người tại `test/state/awaiting.test.mjs` + e2e CLI tại `test/cli/fgos.test.mjs`; unit tại `test/intake/{classify,discovery,plan}.test.mjs` + `test/state/{envelope,stage,store,frontier,work,replay}.test.mjs`; entropy-trend tại `test/report/entropy.test.mjs`. LƯU Ý phạm vi: suite KHÔNG đọc chính tài liệu này — không có test nào quét nội dung `docs/specs/*.md`, nên `npm test` xanh KHÔNG phải bằng chứng spec còn đúng với code. Bộ dò trích-dẫn-quyết-định-đã-lỗi-thời (`scripts/check-decision-citation-drift.mjs`) có quét `docs/specs/`, nhưng là script chạy tay, chỉ phát hiện, KHÔNG nối vào `npm test` (per `docs/specs/decision-citation-drift.md`)
```

## claim_57e8eb7978357a8ab6cd53959e421972

`docs/platform/work-state/architecture/implementation-pointers.md#unheaded-block-4`
Unit SHA256: `08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627`
Shown SHA256: `08e9731304f9e54ce01edb082f23b13ff6802af280ca8aeb62ff1d2e1a7a0627`

```text
- [Work state area portal](../README.md)
- [Work state spec](../spec.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
```

## claim_a8061021fa3f44ed2cc2411143b1f2b5

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-2`
Unit SHA256: `fb2a927391a144152bec76f586c13c1fcba302d284ddf5c00776250504d1fbd1`
Shown SHA256: `fb2a927391a144152bec76f586c13c1fcba302d284ddf5c00776250504d1fbd1`

```text
Hợp đồng giao tiếp VÀO/RA hạng nhất cho bề mặt CLI của fgOS (`bin/fgos.mjs`)
và bề mặt stdout của vòng tự hành (`bin/fgos-runner.mjs`), theo record
`0014` (`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md`) (kiến trúc cửa, đã
khoá) và [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract) (mọi
contract mang version tường minh `<name>/v<N>`). Tài liệu này là bản chốt
bằng văn xuôi hợp nhất những gì `str46-io-contract` đã dựng qua ba lát —
không phải code runtime mới, không lặp lại chi tiết cài đặt đã có trong
`docs/specs/work-state.md`/`docs/specs/runner.md`.
```

## claim_9f760019ecad768520db5b1a03ad27df

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-3`
Unit SHA256: `accb25b08ef0d839f5a86e898250752fc12d3dac678c12fb5776e0743e68001c`
Shown SHA256: `accb25b08ef0d839f5a86e898250752fc12d3dac678c12fb5776e0743e68001c`

```text
**Mục tiêu:** một transport MỚI (terminal, pane, chat, web, thứ chưa nghĩ
ra) cắm vào chỉ bằng cách dịch transport→verb (chiều vào) và đọc envelope/sổ
verb (chiều ra) — không mở đường ghi riêng, không phải đoán hình dạng output
bằng cách đọc mã.
```

## claim_0f808f60d9575ceba2a845b1ab7b5fe4

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-4`
Unit SHA256: `4d3e5ba86bd907aba25dfcc099af5e2891236ac44ec6aac4eb3e2fc2bd2a5c83`
Shown SHA256: `4d3e5ba86bd907aba25dfcc099af5e2891236ac44ec6aac4eb3e2fc2bd2a5c83`

```text
Mọi thao tác ghi đi qua đúng **một cửa**: gọi verb của `bin/fgos.mjs`
(CTR001/CTR002). Không có đường ghi thứ hai vào `.fgos/`.
```

## claim_ace2fa9328a00ebb92660ea20472cea9

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-5`
Unit SHA256: `7921981cad27a6f1ab7b07c1a0594ac78eb752b9c94840b960a8dd8aeefc621b`
Shown SHA256: `7921981cad27a6f1ab7b07c1a0594ac78eb752b9c94840b960a8dd8aeefc621b`

```text
Mỗi sự kiện ghi qua ba cửa ghi chính (`work.move`, `work.edit`, `work.step`)
mang thêm một trường **writer** — object lồng đúng hai trường con, `id` và
`source`. Đây là một khái niệm MỚI, tách bạch có chủ ý khỏi `role`
(Data Dictionary #14, xem "Bản ghi settlement" trên): `role` trả lời "người
gọi thuộc LOẠI nào" (`human`/`runner`/`session`/`system`), còn `writer`
trả lời "người gọi là CÁ THỂ nào" — phân biệt được hai phiên agent cùng chạy
song song, cùng mang `role: session` nhưng là hai tiến trình khác nhau
(per str46-io-contract). The gates[id] projection derived from `work.move` events carries CTR004/v1 version token through the `SCHEMA_VERSION` field of the source event, per str46-io-contract.
```

## claim_a72b0ec99ac38d180c344c40ef752f45

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-6`
Unit SHA256: `4c38a75e22d4372a55c06012cac31ed30fba52e7eeeced0af78c932e5ab49e1b`
Shown SHA256: `4c38a75e22d4372a55c06012cac31ed30fba52e7eeeced0af78c932e5ab49e1b`

```text
`writer.id` là chuỗi hoặc số định danh tiến trình ghi. `writer.source` nói
độ tin của giá trị đó — KHÔNG phải một trường độc lập, mà đi kèm bắt buộc với
`id`:
```

## claim_60b0f8761ceab4332c7b9909b7f1b4fb

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-7`
Unit SHA256: `eed0b8520401ce77b1b75379282e339007dd17d09e38cccd31ba0efad4e0a4dd`
Shown SHA256: `eed0b8520401ce77b1b75379282e339007dd17d09e38cccd31ba0efad4e0a4dd`

```text
Mỗi lần ghi mang thêm một trường danh tính người/tiến-trình gọi, `writer`:
```

## claim_c4a5741db6a633490e9d919b131aff64

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-8`
Unit SHA256: `bd8b780f96dd2ecc5b5f628c94f6b5b30a5a09eb139ef809d5b9334cd25d5992`
Shown SHA256: `bd8b780f96dd2ecc5b5f628c94f6b5b30a5a09eb139ef809d5b9334cd25d5992`

```text
**Đây là quy thuộc, không phải xác thực** (D1): CLI local không xác thực
được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, không mua
về an ninh. Do đó **caller chưa xác danh KHÔNG bị chặn** gọi verb ghi — D9
chọn ghi-không-chặn để không gãy luồng người gõ tay/CI đang chạy; chặn thật
thuộc tầng phân quyền (STR38) và cửa mạng của daemon tương lai (STR48), cả
hai nằm NGOÀI hợp đồng này.
```

## claim_0c7b739eb250c0c4d29e8ddcbdd4e20b

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-9`
Unit SHA256: `b3d95b30cc6cd2a1b0bb6bd8bec47976bedba54191c94aeec67ff6441ebdefb6`
Shown SHA256: `b3d95b30cc6cd2a1b0bb6bd8bec47976bedba54191c94aeec67ff6441ebdefb6`

```text
| source | Ý nghĩa | Độ tin |
|---|---|---|
| `registry` | `id` khớp một phiên đang sống trong sổ đăng ký phiên của fgOS (`.fgos/sessions.json`) | Cao nhất — do chính fgOS cấp và xác nhận |
| `env` | `id` lấy từ biến môi trường phiên agent (`FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`), nhưng KHÔNG khớp phiên nào đang sống trong sổ đăng ký | Trung bình — ai cũng tự set được biến môi trường |
| `pid` | Không có biến môi trường phiên nào hợp lệ; suy đoán tốt-nhất từ pid một tổ tiên tiến trình gần (terminal tay gõ) | Thấp — best-effort, có thể trùng giữa hai pane cùng shell |
| `unresolved` | KHÔNG một nguồn nào xác nhận được; `id` vẫn là pid của chính tiến trình ghi (KHÔNG BAO GIỜ rỗng/vắng mặt) — `unresolved` là một NHÃN XUẤT XỨ, không phải danh tính vắng mặt (per str46-io-contract) | Không xác định |
```

## claim_21d32d019d7a6656f2595c5b4d600929

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-10`
Unit SHA256: `fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9`
Shown SHA256: `fa53d50b84fef3025e7b4e5e8e810a83f885e4aab37a760652c1bcb9e676a5a9`

```text
- `writer.id` — cá thể nào đang gọi (phân biệt hai phiên agent chạy song
  song), luôn có mặt.
- `writer.source` — độ tin của `id` đó, một trong bốn giá trị theo thứ tự ưu
  tiên: `registry` (đối chiếu được với `.fgos/sessions.json`, tin nhất) ·
  `env` (biến môi trường, ai cũng set được) · `pid` (dò ngược tiến trình cha,
  best-effort) · `unresolved` (không nguồn nào xác nhận được — `id` vẫn là
  pid của chính tiến trình gọi, KHÔNG rỗng, KHÔNG vắng khoá; chỉ nhãn
  `source` nói giá trị chưa kiểm chứng được).
```

## claim_0ebd8232403c07858822aec5fb1e6105

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-11`
Unit SHA256: `882fdc920bae5cb93953dd540d22527c18f91455de1d3de225d2ab0a51734fb7`
Shown SHA256: `882fdc920bae5cb93953dd540d22527c18f91455de1d3de225d2ab0a51734fb7`

```text
**Registry chỉ ĐỐI CHIẾU, không bao giờ tự cấp danh tính** (per str46-io-contract): giá trị `id` lấy từ biến môi trường luôn giữ nguyên bất
kể sổ đăng ký có khớp hay không — sổ đăng ký chỉ nâng độ tin (`source`) khi
khớp, không bao giờ đổi hay tạo ra `id`. Một dòng sổ đăng ký KHÔNG BAO GIỜ
khớp theo thư mục làm việc hay theo pid của chính dòng đó — chỉ khớp đúng
`id` với `sessionId` của dòng — vì khớp theo thư mục sẽ gộp hai phiên khác
nhau trong cùng một worktree thành một danh tính, phá đúng mục đích khoá
hoạt động cây chính (xem spec Runner "Khoá hoạt động cây chính").
```

## claim_d1f944f3b044f929bdeec1acd605c384

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-12`
Unit SHA256: `2d77bba4c7bc7482c07dae5e2af85f29439884bb5f1e2f55533c2bef5aa56b63`
Shown SHA256: `2d77bba4c7bc7482c07dae5e2af85f29439884bb5f1e2f55533c2bef5aa56b63`

```text
Một giá trị `id` sai định dạng (ký tự lạ, quá dài) bị LOẠI ở tầng phân giải
và rơi xuống nguồn kế tiếp — KHÔNG BAO GIỜ ném lỗi, KHÔNG BAO GIỜ chặn verb
(per str46-io-contract); không có validator nào đứng trên đường ghi
`writer`. `writer` fold lên item KHÔNG ĐIỀU KIỆN, GHI ĐÈ mỗi lần (latest-wins)
— khác khuôn "cộng thêm không đè" của outcome/friction/settlement, vì đây là
danh tính của LẦN GHI GẦN NHẤT, không phải một chuỗi lịch sử cần giữ mọi lần.
Item chưa từng qua tính năng này không mang `writer` — vắng mặt hoàn toàn,
tương thích ngược (RUL11 (tiến hóa schema)). Cơ chế phân giải đầy đủ (thứ tự nguồn, khoá hoạt động cây chính dùng cùng danh tính này): spec Runner RUL49 (compound-learning đổi trục: từ stage sang status retrospective).
```

## claim_3f95f64ae75e9eafac8e5b93d5cb5c63

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-13`
Unit SHA256: `25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770`
Shown SHA256: `25e4a007d2fc9a153cb3273376471f15e4bfca5c257f0c8bf06d1dd6af198770`

```text
Song song với `writer` (cá thể), mỗi cạnh chuyển trạng thái còn mang `role`
— **loại** caller: `human` · `runner` · `session` · `system` (giá trị thứ
tư, gán tự động cho cạnh park nội bộ do máy sinh ra như hệ quả một verb,
không do ai quyết định). `role` và `writer` tách bạch: một cái nói "ai gây
ra", một cái nói "loại gì gây ra".
```

## claim_29f04ce21d77ad5dbcf3d89f27b126c4

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-14`
Unit SHA256: `8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4`
Shown SHA256: `8b3e099723160029770c62469f14db6ce2e484a6f7b4a1354cb4bf34288af9d4`

```text
**Mọi verb** đều in kết quả thành công bọc trong một phong bì chuẩn duy nhất
thay vì in thẳng dữ liệu hay câu chữ cho người. Phong bì có bốn trường:
`contract` (tên+phiên bản chuẩn phong bì), `generated_at` (thời điểm in),
`data_hash` (dấu vân tay của dữ liệu — bên đọc biết dữ liệu đổi chưa mà không
cần so từng trường), và `data` (dữ liệu thật của verb đó). Dữ liệu trong `data`
là **có cấu trúc** (các trường tên rõ nghĩa), không phải câu xác nhận cho người:
verb đọc (`list`/`ready`/`check`/…) trả thẳng đối tượng kết quả; verb ghi trả
đúng những trường nó vừa đổi (ví dụ chuyển trạng thái trả `{id, from, to, seq}`)
— nhờ vậy một surface bất kỳ đọc kết quả bằng MỘT bộ đọc chung, không phải dò
regex trên chữ. Phong bì được đóng tại **một cửa in duy nhất**, nên không verb
nào lọt lưới và không có hai cách in khác nhau.
```

## claim_2c7ba7c08b540f1565c4fac86e0f88d5

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-15`
Unit SHA256: `6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa`
Shown SHA256: `6dcf0faa76d27fed777c0586dad2b3b78200213c58d5606ad5e901e81e13e6fa`

```text
Mọi verb thành công (ở CẢ HAI binary — `fgos.mjs` và, từ lát 2,
`fgos-runner.mjs`'s dòng kết-cục cuối) in một phong bì chuẩn `fgos.v1` ra
`stdout`:
```

## claim_e00f77334f67689a366e215274459542

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-16`
Unit SHA256: `18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2`
Shown SHA256: `18c5d821a55d3517cf3efe368fb1d34e13730b3bc1d70ff376d72b147621bdd2`

````text
```
{ contract: 'fgos.v1', generated_at, data_hash, data }
```
````

## claim_14c1c8c75ed4222f4e3280ca09da7ef6

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-17`
Unit SHA256: `84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71`
Shown SHA256: `84367855d92bb2e3914cb9bc385c2dce9b5625c8acaf9e577c9c791e40d07e71`

```text
`data` có cấu trúc (trường tên rõ nghĩa), không phải câu xác nhận cho
người — verb đọc trả thẳng đối tượng kết quả, verb ghi trả đúng những
trường vừa đổi. Đường lỗi KHÔNG bọc phong bì: chẩn đoán đi `stderr`, thành/
bại phân biệt bằng **exit code**, không bao giờ bằng nội dung chuỗi.
```

## claim_2beadda8db30fa95fa29063bae954245

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-18`
Unit SHA256: `5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4`
Shown SHA256: `5d70ebc5bbf14b4604424fe9dc4e05c75110a85c0c24b6b1cb6e7a998bfaddc4`

```text
**Đường lỗi không bọc phong bì.** Chỉ đường thành công in phong bì ra `stdout`;
khi verb ném lỗi, chẩn đoán đi ra `stderr` kèm mã thoát theo bảng phân loại lỗi
(stdout=dữ liệu, stderr=chẩn đoán) — bên gọi phân biệt thành/bại bằng mã thoát,
không phải bằng việc dò nội dung phong bì.
```

## claim_2ae9347f090d39a2ba3c84ec18caf370

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-19`
Unit SHA256: `75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b`
Shown SHA256: `75bf5b6af00287e081d243556f44f8e1c495da7238737ccd1b15d2a8191f196b`

```text
**Vòng tự hành (`fgos-runner`) cũng dùng CÙNG phong bì này cho kết cục cuối của
mỗi lượt/chu kỳ** (per str46-io-contract) — in liền một dòng thay vì nhiều
dòng như trên, vì một tiến trình `--watch` phát nhiều phong bì nối tiếp theo
thời gian; chi tiết đầy đủ + các luồng output khác nằm ngoài phong bì: xem spec
Runner RUL61 (writer — danh tính người ghi, tách bạch khỏi vai, không bao giờ chặn verb).
```

## claim_cb49dfeab435a5cb463f8f232996c451

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-20`
Unit SHA256: `6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca`
Shown SHA256: `6a5b9a01b04279716a3d504e251d1de122ff1652714708512706640ec9edd4ca`

```text
**`fgos.mjs` in đúng một dòng phong bì mỗi lời gọi** (một-shot, nên in
nhiều dòng cho dễ đọc). **`fgos-runner` in MỘT phong bì mỗi lượt `--once`
hoặc mỗi chu kỳ `--watch`, liền một dòng** — vì `--watch` phát nhiều phong
bì nối tiếp theo thời gian, mỗi cái phải trọn trong đúng một dòng để bên
đọc tách được cái này với cái kia; con trỏ (dưới) áp dụng cùng lý do.
```

## claim_9d526eee666500cba4e0f288787c7020

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-21`
Unit SHA256: `bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056`
Shown SHA256: `bdeca0144b587f826ce46ea61d3be2e882ad021614d1e5f7c14cf2982573f056`

```text
**Nhận diện một phong bì thật:** parse một dòng stdout ra JSON rồi kiểm
`contract === 'fgos.v1'` — KHÔNG BAO GIỜ bằng heuristic văn bản (vd "dòng
bắt đầu bằng `{`"), vì luồng progress-trace của `fgos-runner` (xem "Ngoại
lệ có lý do" dưới) có thể tự chứa output của trợ lý bắt đầu bằng `{`.
```

## claim_cc410a6df58d2ce6c7f88d6b11085c6b

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-22`
Unit SHA256: `3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127`
Shown SHA256: `3727b3fa0ee79f8b0b38d0e9fc868e336e85f10e12f7dbd47a34d140f3681127`

```text
`src/state/store.mjs`'s `EXIT_CODES` (2 precondition [bao gồm not-found / run-not-found / missing-run] · 3 conflict ·
4 validation · 5 corrupt-log · 7 lock-timeout · 8 session-fail ·
9 merge-fail) cộng `src/runner/loop.mjs`'s `EXIT_BUSY` (6, riêng của
runner) là bảng DUY NHẤT. 0 = ok, 1 = bất ngờ (mọi thứ chưa phân loại).
Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp.
```

## claim_3eda80201a85fe5bdf13782a93cc6331

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-23`
Unit SHA256: `cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8`
Shown SHA256: `cb6381a3b69f2fdd99ff81b06cafbce1f45add19c7076005c59ad0e093d49be8`

```text
Năm luồng KHÔNG bọc phong bì, mỗi luồng mang một lý do riêng — dùng chung
đúng một chữ, "ngoại lệ có lý do", không gọi tuỳ hứng theo từng chỗ:
```

## claim_4217ac86de0ba075ca046202b2ce4284

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-24`
Unit SHA256: `4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a`
Shown SHA256: `4a338e4d813b275ce1c923da4f814881eaab30a4bdca231382fd7df5c5fe9b4a`

```text
1. **Sổ verb máy-đọc** (`--help`/`--help --json`, kể cả `<verb> --help`) —
   siêu dữ liệu về CLI, không phải payload của một verb.
2. **`setup`/`doctor --pretty`** — lối thoát hiển-thị-cho-người tường minh
   qua cờ `--pretty`, không phải payload mặc định.
3. **Log worker** (`.fgos/logs/<id>.log`) — text trần CỐ Ý, để `tail -f`
   thấy được ngay; bọc phong bì sẽ phá đúng công dụng đó.
4. **Luồng progress-trace của `fgos-runner`** (gặt-lại, nhận việc, phán
   làm-rõ/chia-việc, đuôi kết quả proof, thử lại, dừng — cộng dòng lifecycle
   "watch mode stopped" khi nhận tín hiệu dừng) — in console y nguyên như
   trước, một tính năng KHÁC (đã khoá) với hợp đồng này, không đụng.
5. **Cửa hook thực thi agent** (`fgos hook <dispatch-decide|decision-question>`) —
   bypass phong bì CLI và kiểm tra store admission để giữ nguyên vẹn luồng `stdin`,
   `stdout`, `stderr` và exit code `0`/`2` cho các công cụ như Claude Code và Codex,
   hoặc xuất JSON stdout trực tiếp cho AGY. Bọc phong bì sẽ phá vỡ giao thức chặn công cụ của agent host.
```

## claim_9053f1edd1765577dd1bef202eff3d98

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-25`
Unit SHA256: `549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe`
Shown SHA256: `549dded9fe85b1cfd57f1ec7079141e4feb9e6468a31e93485ab91a2305e79fe`

```text
**Khối `fgos-discovered`** (worker phát cho runner nêu việc mới phát hiện)
NẰM NGOÀI hợp đồng này — nó là giao thức worker→runner của CTR003, không
phải cửa ra tới người.
```

## claim_f9941e7fa0598cabe4dbc218c76c14be

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-26`
Unit SHA256: `2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9`
Shown SHA256: `2140755c1b59f62f147ba030e77aa0c28f631f3c4e23fb1618ba7ab6eaaa70f9`

```text
**Phân trang cho verb trả tập lớn (per str46-io-contract, được tsk-483 mở lại — xem `docs/history/tsk-483-list-side-log-pagination-
scoping/CONTEXT.md`).** Sổ verb khai thêm cờ `paginated` (đúng/sai) cho
MỌI verb — chỉ bốn verb mang `paginated: true`: `ready`, `triage`,
`evolve` (lượt liệt-kê không cờ của nó), và khoá `work` của `list`. Bốn
verb này nhận thêm hai tham số tuỳ chọn `--cursor`/`--limit`: không
truyền cờ nào → kết quả y hệt hôm nay (mảng/map đầy đủ, không đổi hình
dạng) — NGOẠI LỆ DUY NHẤT: `list --all --json` không kèm `--cursor`/
`--limit` giữ nguyên hình dạng thô này VĨNH VIỄN, vì `packages/herdr-fgos-common/rust/src/
fgos.rs` (crate Rust ngoài repo Node này) đọc đúng lời gọi đó làm hợp
đồng công khai. Mọi tổ hợp KHÁC của `list` (mặc định trần không cờ nào,
`--id`, hoặc bất kỳ tổ hợp nào có `--cursor`/`--limit` — kể cả kèm
`--all`) đều thu hẹp `decisions`/`discovery`/`gates`/`settlements`/
`outcomes`/`frictions`/`learnings`/`decisionsById` xuống đúng tập id đang
thật sự được trả trong `work` — `tools` (khoá theo TÊN công cụ, không
theo id việc) không bao giờ bị đụng tới. Với ba verb còn lại (`ready`/
`triage`/`evolve`), truyền một trong hai `--cursor`/`--limit` → kết quả
đổi hình dạng thành `{items, nextCursor}`. Con trỏ (`cursor`) là **đục
hoàn toàn** —
người gọi chỉ nhận lại nguyên văn từ `nextCursor` của lượt trước rồi truyền
tiếp, không bao giờ tự phân tích hay tự chế. `nextCursor` là `null` khi đã
tới cuối tập. Một con trỏ trỏ tới một mục đã rời tập (vd việc đã `done` từ
lượt trước) là lỗi phạm trù `validation` — thông điệp lỗi tự nêu cách sửa
(bắt đầu lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang
(`paginated: false`, lý do ghi ngay trong mô tả verb) — mỗi dòng của nó là
một cặp `(a,b)`, không có khoá riêng cho một dòng để làm mốc con trỏ.
```

## claim_e7ef34e35d4eed7fe2ce3988ff7839e0

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-27`
Unit SHA256: `c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4`
Shown SHA256: `c34e8e9c9dbf41ceba76b86cd175dcb894ce3eb3de6e988c2bd68a77ece385e4`

```text
Bốn verb trả tập có thể lớn tuỳ dữ liệu mang phân trang tuỳ chọn:
`ready` · `triage` · `evolve` (lượt liệt-kê không cờ) · `list`'s khoá
`work`. Không truyền `--cursor`/`--limit` → kết quả đầy đủ, y hệt không có
tính năng này. Truyền một trong hai → kết quả đổi hình dạng thành
`{items, nextCursor}`. Con trỏ là một chuỗi đục hoàn toàn — sinh bởi máy
chủ, người gọi chỉ trả lại nguyên văn, không bao giờ tự phân tích hay tự
chế. `nextCursor` là `null` khi đã tới cuối tập. Một con trỏ trỏ tới mục đã
rời tập là lỗi phạm trù `validation`, thông điệp tự nêu cách sửa (bắt đầu
lại không kèm `--cursor`). `conflicts` CỐ Ý không phân trang — mỗi dòng của
nó là một cặp `(a,b)`, không có khoá riêng cho một dòng.
```

## claim_2b9b0c26c915c8b9945004689300d073

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-28`
Unit SHA256: `b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce`
Shown SHA256: `b82a558166f118f339210d9a475214042a603bd09f64a3a2a8795d96fbdf57ce`

```text
Sổ verb tự khai verb nào phân trang qua trường `paginated` (đúng/sai, mặt
trên MỌI verb).
```

## claim_0bf4d10d1c0f4cda16abe6091d639b64

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-29`
Unit SHA256: `a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04`
Shown SHA256: `a2e6a5ffa58ec1f13d1321cf4b14d70b2a261fba6ce0f15c0bda50975cf8de04`

```text
CLI công bố **toàn bộ mặt verb** dưới dạng một sổ máy-đọc: gọi trợ giúp ở dạng
máy-đọc trả `{schema_version, commands: […]}` (`schema_version` hiện hành
`'2.0'`, per str46-io-contract — tăng từ `'1.0'` vì một trường bị xoá,
xem ngay dưới), mỗi mục mô tả một verb — `name`, cách gọi, mô tả một dòng,
lược đồ tham số (cờ/positional), ví dụ, và ô `deprecated`. Sổ này để một
listener/giao diện **sinh** khung lệnh và khung form từ manifest thay vì
hard-code từng verb. Bản thân sổ verb là **siêu dữ liệu về CLI**, KHÔNG bọc
trong phong bì `data` (nó mô tả CLI, không phải kết quả một verb). Dạng trợ
giúp thường (không máy-đọc) in cùng thông tin ở dạng chữ cho người đọc. Với
một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của
`submit`, đọc từ đối số đầu, không bao giờ qua một cờ `--text`), sổ verb
đánh dấu riêng tham số đó là positional; dạng trợ giúp chữ cho người đọc in
dòng "positional: `<tên>`" cho tham số này, KHÔNG BAO GIỜ in nhầm thành
"required: `--<tên>`" như một cờ thật — một tham số vừa nhận positional vừa
nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt (per str77-79-doc-gap-fixes / ea8b9a8d — RUL54 (sổ verb máy-đọc không in nhầm tham số positional thành cờ bắt buộc)).
```

## claim_bc055098a9e2bedf2ed30ab0dfcacf79

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-30`
Unit SHA256: `83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca`
Shown SHA256: `83773dda67db8d5f71205bb8c7106186023672125b08cbe4f33b09b0578163ca`

```text
`fgos --help --json` trả `{schema_version, commands: […]}` — CLI công bố
toàn bộ mặt verb để một listener/giao diện **sinh** khung lệnh từ manifest
thay vì hard-code từng verb. `schema_version` hiện `'2.0'` (tăng từ `'1.0'`
vì trường `access` bị xoá). Mỗi mục verb mang:
```

## claim_f87ba30b5de56939a7fa614030efce48

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-31`
Unit SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`
Shown SHA256: `0b3d8cfa5bd06f2dc735968a1297d8567d8f78a6257cf8aed0b0611067e870a2`

```text
**Hai trục thay cho `access` (per str46-io-contract).** Cờ `access`
đơn (`read` hay `mutation`) từng gộp hai câu hỏi khác nhau vào một giá trị —
lộ rõ khi `review` khai `mutation` chỉ vì chế độ `--github` của nó tạo một
PR thật, dù bản thân `review` (không `--github`) không hề đổi trạng thái
fgOS. Sổ verb nay tách thành **hai trường độc lập**: `touchesState`
(verb có bao giờ ghi trạng thái fgOS hay không) và `externalEffect` (verb
có bao giờ gọi một dịch vụ ngoài fgOS hay không — danh sách hiện hành mang `externalEffect: true` lấy từ manifest `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật tính là effect ngoài `.fgos/`);
`review` mang `touchesState: false` vì nó không bao giờ ghi trạng thái, kể
cả qua `--github`). Cả hai cờ vẫn thuần **khai báo** — chưa nối vào điều
phối hay xác danh; cổng "ai được nói verb nào" vẫn là việc riêng sau này
(backlog STR38).
```

## claim_0abb403f0f4bb4bb6b916849e4895d65

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-32`
Unit SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`
Shown SHA256: `e1577e3b51decf45fde9d2754d740429b7714340ec90baf7e5e4156b316e33d1`

```text
- `name`, cách gọi, mô tả một dòng, lược đồ tham số, ví dụ, `deprecated`
  (null hoặc chuỗi hướng dẫn deprecation; CLI renderer cũng chấp nhận metadata
  cấu trúc để không rò `undefined`/`[object Object]` nếu schema tương lai mở rộng).
- **`touchesState`** (verb có bao giờ ghi trạng thái fgOS) và
  **`externalEffect`** (verb có bao giờ gọi dịch vụ ngoài fgOS) — hai trục
  độc lập thay cho `access` cũ (từng gộp hai câu hỏi vào một giá trị,
  sai cho `review`: nó khai `mutation` chỉ vì `--github` tạo PR thật, dù
  bản thân `review` không hề ghi trạng thái). Danh sách hiện hành mang `externalEffect: true` lấy từ manifest
  `COMMAND_REGISTRY` qua `fgos --help --json`: 15 verb, không có
  `coordination` (ví dụ `review`, `approve`, `run` — dispatch executor thật
  tính là effect ngoài `.fgos/`).
- `paginated` (xem trên) và `multiValueFormat` (dưới) khi áp dụng.
```

## claim_764256647fca6cf7257ca0b2c0e8e477

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-33`
Unit SHA256: `78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293`
Shown SHA256: `78393c0183b6bda3ff166520f4601ab2793cbdf85e2669949001a73b9102f293`

```text
Cả hai trục `touchesState`/`externalEffect` vẫn thuần **khai báo** — chưa
nối vào điều phối hay xác danh; cổng "ai được nói verb nào" thuộc STR38.
```

## claim_55aab2ee6b56137762f5c87ea550daad

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-34`
Unit SHA256: `3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62`
Shown SHA256: `3964ac136b9bb85d72cec95fd1ff5748fd87fbbf1b1487c1cfbef35a34b20d62`

```text
**Quy ước cờ nhiều-giá-trị (per str46-io-contract).** Sổ verb khai thêm
trường `multiValueFormat` (`'csv'` hay `'json-array'`) trên đúng những tham
số nào mang nhiều giá trị — trước đây khác biệt này chỉ nằm trong văn xuôi
mô tả, không đọc được bằng máy. `deps`, `refs`, `footprint`, `targets` mang
`multiValueFormat: 'csv'` (phân tách bằng dấu phẩy). `acceptance` mang
`multiValueFormat: 'json-array'` (chuỗi JSON-hoá, CỐ Ý không phẩy vì văn
bản một clause có thể tự chứa dấu phẩy). Tham số không mang nhiều giá trị
không có trường này.
```

## claim_587d1adddb37253c6b6780b9a00c6b59

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-35`
Unit SHA256: `a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5`
Shown SHA256: `a8eaefe3669a194a9fa84ca8fa92d4d58a5f7c8405e4d7c970fac1ce183148a5`

```text
Tham số nào mang nhiều giá trị khai `multiValueFormat`: `'csv'` (phân tách
dấu phẩy — `deps`/`refs`/`footprint`/`targets`) hay `'json-array'` (chuỗi
JSON-hoá — `acceptance`, CỐ Ý không phẩy vì văn bản một clause có thể tự
chứa dấu phẩy). Trước STR46, khác biệt này chỉ nằm trong văn xuôi mô tả;
nay đọc được bằng máy.
```

## claim_5bcbc702fe7871f4aa75438608e11ed5

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-36`
Unit SHA256: `49da8c71336ea054dce887759a9eea0ef5f841792858d401b66341c4d0d8734d`
Shown SHA256: `49da8c71336ea054dce887759a9eea0ef5f841792858d401b66341c4d0d8734d`

```text
Gọi `--help` (không kèm `--json`) SAU tên một verb cụ thể (vd `fgos submit
--help`) in đúng mục trợ giúp của RIÊNG verb đó (cách gọi, mô tả, tham số,
ví dụ) — không phải toàn bộ sổ verb. Áp dụng ĐỒNG NHẤT cho mọi verb, kể cả
`init`.
```

## claim_4b57ee512cc014fc094a3dad6f72d5c7

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-37`
Unit SHA256: `a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798`
Shown SHA256: `a1c9e2ebc2ba7e6a03ed7483b533c63fac017dc0a1f4bb9c9eb0c8f772851798`

```text
- **Runs when:** người/agent gọi `fgos <verb> --help` cho bất kỳ verb nào
  trong sổ verb.
- **Blocked when:** không có điều kiện chặn — mọi verb đều có mục trợ giúp
  riêng.
- **What changes:** không gì — đây là thao tác chỉ-đọc, không ghi sự kiện,
  không đổi bản chiếu, không có tác dụng phụ nào (kể cả với `init` — gọi `fgos
  init --help` KHÔNG chạy `init` thật, không tạo `.fgos/`).
- **Side effects:** không có, cho MỌI verb kể cả những verb thường có tác
  dụng phụ khi gọi thật (vd `init`).
- **Afterwards:** người gọi thấy đúng mục trợ giúp của verb đã nêu tên, thoát
  mã 0 — không bao giờ thoát ở phạm trù lỗi (mã 4) vì thiếu tham số bắt buộc,
  dù tham số đó có mặt hay không (per str77-79-doc-gap-fixes / ea8b9a8d — RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ)).
```

## claim_4a9967445e7d9d61d02d659b48733620

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-38`
Unit SHA256: `a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532`
Shown SHA256: `a378c81f6a84c5e3ed9b38917f7136c55dcc4af85295bcf105fa9ac9d6792532`

```text
Theo [0011](../decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract): mỗi
contract mang version tường minh trong định danh của chính nó.
```

## claim_1c1d4afc14a1cc1bc4b982bf69387d55

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-39`
Unit SHA256: `c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3`
Shown SHA256: `c9d3ad96d4b03b02fbcf8e5bd0261ab7c77109320f204a18b9a43eef0f4f1fd3`

```text
| Bề mặt | Token | Hiện thân |
|---|---|---|
| Phong bì CLI (CTR001) | `fgos.v1` | field `contract` trên mọi phong bì, cả hai binary |
| Stdout của `fgos-runner` (CTR003, riêng phần bề mặt ra) | dùng lại `fgos.v1` | KHÔNG đúc token CTR003 riêng — bề mặt này tái dùng đúng cơ chế `fgos.v1` của CTR001 |
| Sổ verb (manifest) | `2.0` | field `schema_version` trong `{schema_version, commands[]}` |
| Sự kiện (event log) | `3` | field `v` trên mỗi event, `SCHEMA_VERSION` (`work.mjs`) |
| `gates[id]` (ask/answer, CTR004) | `CTR004/v1` | hiện thân qua `SCHEMA_VERSION` của sự kiện `work.move` nó fold ra — KHÔNG một field version riêng (thêm field thứ hai cho cùng dữ liệu phá DRY) |
```

## claim_1f6dd7f2cb7aa5e61eb8b9232513b51c

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-40`
Unit SHA256: `03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb`
Shown SHA256: `03c9a0137385cea34764f24cc92708d2c2c2c6a722f1e24345441232595f92cb`

```text
CTR006 (routing-handoff) nằm NGOÀI: nó là spec đầy đủ nhưng chưa có code,
dán version lên thứ chưa chạy là đóng dấu cho giả định.
```

## claim_82d56ca63fdae091877a9bbb5c3c6c8c

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-41`
Unit SHA256: `36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d`
Shown SHA256: `36d44c8bdf5ad1f062c83e623e68e7d429939c8bc1bc44c0b5bf36aba736078d`

```text
STR46 hợp nhất chiều vào/ra hôm nay đang có, KHÔNG mở rộng nó thành chủ
động (push). Ba việc sau đã locked ngoài biên khi mở exploring, mỗi việc có
nhà riêng:
```

## claim_00752b4b2a11e39acaef4a6bdb9f6aaf

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-42`
Unit SHA256: `fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea`
Shown SHA256: `fa405ec4333b43518de9831ea52cd47228294303f0b3374b8d4a981a669414ea`

```text
- **Chiều-ra khởi-xướng ("cần bạn")** — một kênh attention/push có
  delivery-semantics riêng (at-least-once, dedup, routing, ack,
  escalation) — thuộc STR48, sống ở consumer/daemon, KHÔNG phải core fgOS.
- **Increment terminal/pane + chat item-scoped** — thuộc STR83/STR38.
- **Tầng phân quyền** ("ai được gọi verb nào", caller chưa xác danh có bị
  chặn hay không) — thuộc STR38.
```

## claim_60d9cc75aabe29c3ddb361d489849aec

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-43`
Unit SHA256: `30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7`
Shown SHA256: `30a3d1465b852976e30a3aad9f6729d1f40caacbc299c7fb07e87ff06d42cff7`

```text
Đây là lý do CoS gốc của STR46 (bản khai lúc mở backlog) bị thu hẹp có chủ
ý: chỉ vế "có một spec hợp đồng in/out tự-mô-tả" là việc của STR46; hai vế
còn lại (chiều-ra khởi-xướng, increment terminal/pane) thuộc PBI khác.
```

## claim_4625ce7449b0442caddda4d3d41ac84d

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-44`
Unit SHA256: `fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75`
Shown SHA256: `fd7e473ad76cf591e6a132079c9b744fc4a8cfa5672127e446ae7c4f6f323e75`

```text
Cũng nằm ngoài: daemon (chưa xây), tách core verb-logic thành lib độc lập
CLI (prerequisite của kiến trúc daemon tương lai, refactor thuần không đổi
hành vi), và khối `fgos-discovered` (giao thức worker→runner, không phải
cửa ra tới người).
```

## claim_d36f51d7eb1767c7a204cd7d8f3b18c0

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-45`
Unit SHA256: `7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf`
Shown SHA256: `7fddf59545c800c11029e0609a32bd908db3409f458829aaf1afecc47bd7f4cf`

```text
`docs/decisions/0014-kien-truc-giao-tiep-nguoi-fgos.md` (kiến trúc cửa) ·
`docs/decisions/0011-version-tuong-minh-cho-moi-contract.md` (version) ·
`docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người
ghi (chi tiết trường/hành vi) · `docs/specs/runner.md` RUL61 (envelope
stdout runner) · `docs/architecture-map.md` CTR001/CTR003/CTR004 (sổ đăng
ký contract) · `docs/history/str46-io-contract/` (CONTEXT.md 37 quyết định
khoá, plan.md bốn lát).
```

## claim_c9081814b1f39c068fb76e62b7726390

`docs/platform/work-state/contracts/cli-io-contract.md#unheaded-block-46`
Unit SHA256: `6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0`
Shown SHA256: `6238a5e1752c22a8bb4a2801757a1e891ae0902e8cec197d7a44d5f7f9eb8ea0`

```text
- [Work State portal](../README.md)
- [Work State spec](../spec.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
- [Legacy source: docs/io-contract.md](../../../io-contract.md)
```

## claim_82019a8cdd168110228688d02b5d072b

`docs/platform/work-state/spec.md#unheaded-block-2`
Unit SHA256: `d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117`
Shown SHA256: `d9f06bbaa0ffe5ab3f54dd8fba4e9514ed4e126572c8a570dea57f366837d117`

```text
Bộ nhớ công việc tự quản của forgent: nơi duy nhất ghi nhận "đang có việc gì, việc nào ở trạng thái nào, quyết định nào đã chốt". Người dùng: người vận hành repo và agent làm việc trong repo — cả hai thao tác qua đúng một cửa lệnh `fgos`. Sự thật nằm ở **nhật ký sự kiện** append-only được commit; **bản chiếu trạng thái** hiện hành chỉ là dẫn xuất, xóa đi dựng lại được nguyên vẹn.
```

## claim_eb0bf7783bb1b1027c012f050c782203

`docs/platform/work-state/spec.md#unheaded-block-3`
Unit SHA256: `c8fc6e5bf49179cb6f37f3247ad25c3217a40bd23b96748f5fdf6893dff5581e`
Shown SHA256: `c8fc6e5bf49179cb6f37f3247ad25c3217a40bd23b96748f5fdf6893dff5581e`

```text
- `fgos init` → khởi tạo kho work-state rỗng tại thư mục làm việc hiện hành (nhật ký rỗng + bản chiếu rỗng); đồng thời quét READ-ONLY project tìm marker của harness agent khác đã có mặt (thư mục dấu ấn như `.bee/`, `.claude/`, `.codex/`, `.cursor/`, và khối managed trong `AGENTS.md` khi file đó tồn tại — `init` không bao giờ tạo/sửa `AGENTS.md`), ghi kết quả phát hiện ra output + vào manifest `.fgos/coexistence.json`; lỗi phát hiện không bao giờ chặn `init` (fail-safe), re-init lặp lại ghi manifest nhất quán (idempotent) — doctrine đầy đủ: `docs/coexistence.md`
- `fgos submit "<mô tả tự do>" [--async|--unattended] [--deps <id1,id2,...>]` → **cửa vào công khai duy nhất** cho việc mới: khai một work item từ một câu mô tả văn xuôi duy nhất — id, title, kind, risk, tier đều TỰ SUY (không cần người submit tự đặt); toàn văn mô tả gốc được giữ nguyên trên trường `description` (Data Dictionary #17, per discovery-context STR30) — nguồn ngữ cảnh đầy đủ cho context-discovery đọc lại sau, không bị cắt gọn như `title`; `verify` nhận placeholder cố định chờ bổ sung sau; `--deps` (tùy chọn, mirror hệt `add`'s `deps` sẵn có) ghi trực tiếp danh sách id phụ thuộc, đi qua ĐÚNG cửa ghi/kiểm chu trình mà mọi verb khác dùng — vắng cờ này thì `deps` rỗng, byte-identical hành vi trước đây (per str83-fgos-slash-commands / 757e5dd7); kết quả in ra bọc trong một phong bì máy-đọc chuẩn (xem "Phong bì output" dưới)
- `fgos move` → chuyển trạng thái một item, kèm `--expect` (kỳ vọng, chống ghi đè mù); cạnh từ-chối-đề-xuất bắt buộc `--reason`
- `fgos decision --text "..."` → ghi một quyết định vào nhật ký
- `fgos ask <id> --text "..."` → đưa một item vào chờ người (`awaiting-human`), kèm **câu hỏi** người phải quyết; item rời tập việc-sẵn-sàng cho tới khi được trả lời; nếu item có `parent`, `ask` còn chụp thêm một ảnh `{id, title, status}` của gốc lúc này làm mốc so sánh sau (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm))
- `fgos answer <id> --text "..."` → **trả lời** câu hỏi của một item đang chờ; ghi câu trả lời vào nhật ký rồi đưa item rời `awaiting-human` về `todo`, thành việc actionable trở lại
- `fgos list` → đọc danh sách item từ bản chiếu hiện hành; item đang `awaiting-human` hiện kèm câu hỏi của nó (không cần lệnh đọc riêng); item `awaiting-human` có `parent` còn kèm thêm `awaitingContext` — gốc hiện tại để neo ngữ cảnh, cộng phần đổi-từ-lúc-hỏi nếu có (per str61-chat-context-continuity — xem RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)), khóa này vắng mặt hoàn toàn khi không có item nào thuộc diện đó
- `fgos ready` → đọc frontier: mọi item `todo` có toàn bộ deps đã ngã-ngũ, đang ở stage `executing`, VÀ không còn hậu duệ nào (qua `parent`) dang dở, thứ tự đúng thứ tự khai — thao tác ĐỌC thuần; item `awaiting-human`, còn ở stage `discovery`/`exploring`/`planning`, hoặc còn con dang dở KHÔNG BAO GIỜ xuất hiện trong tập này. "Ngã-ngũ" ở đây tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy — nghĩa là code đã vào cây chính là đủ mở dep, không phải chờ hết cả phần đuôi tổng-hợp/thu-hồi (xem RUL12 (frontier dẫn xuất))
- `fgos discover <id> [--verdict clear|unclear]` → chạy context-discovery cho một item đang ở stage `discovery` hoặc `exploring`, mang theo verdict của chính người gọi — đọc gì trước "Giai đoạn Soi-rõ (stage discovery) và Đào-sâu (stage exploring)" dưới; item ở stage lập-kế-hoạch dùng `plan`, không dùng verb này
- `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]` → chạy phán chia-việc cho một item đang ở stage `planning` (hoặc bí danh di sản `decompose`) — verb RIÊNG, tách bạch khỏi `discover`, xem "Giai đoạn Lập-kế-hoạch" dưới
- `fgos rebuild` → dựng lại bản chiếu từ zero bằng cách phát lại toàn bộ nhật ký
- `fgos repair` → sửa CHỈ MỘT hình dạng hỏng hẹp của nhật ký sự kiện: dòng cuối bị cắt cụt (crash giữa lúc append). Trước khi cắt, sao lưu nguyên trạng nhật ký hỏng ra file backup có dấu thời gian; sau khi cắt, tự đọc lại kiểm chứng nhật ký sạch trước khi báo thành công. Hỏng hình dạng khác (giữa file, nhiều dòng hỏng, hoặc nhật ký vốn đã sạch) đều bị từ chối rõ lý do, KHÔNG đụng file — cửa fail-closed cho `corrupt-log` (mã thoát 5) không bị nới, chỉ có đúng một khe hẹp này được vá tay bởi người vận hành. **Yêu cầu KHÔNG-tiến-trình-song-song (per fgos-multi-session-checkout Epic 3):** `repair` là ghi-đè-cả-file (`writeFileSync` sau khi sao lưu) và CỐ Ý không lấy `.fgos/events.lock` của `appendEvent` — nó phải chỉ chạy khi KHÔNG có tiến trình fgos nào đang sống, vì một `appendEvent` chen vào giữa lúc đọc và lúc ghi-đè của repair sẽ bị âm thầm nuốt mất (drop). Đây là thao tác hiếm, người vận hành chủ động gọi, không nằm trên đường append thường; bảo vệ repair khỏi ca đó là ngoài phạm vi, chỉ ghi nhận yêu cầu chứ không cưỡng chế
- `fgos metrics outcomes [id]` → đọc bản chiếu, in cặp dự đoán/thực tế (outcome) đã gộp cho một item, hoặc cho mọi item đang có dữ liệu nếu không truyền id — thao tác ĐỌC thuần
- `fgos rollup <id>` → đọc bản chiếu, in một item gốc (title/status) kèm đếm con theo status (`k/n done`) và liệt kê từng con trực tiếp (qua `parent`, dựng từ STR16 decompose) cùng status của nó; item không con in `0/0 done` + ghi rõ "không có con"; id không tồn tại báo lỗi `validation` — thao tác ĐỌC thuần, không sự kiện mới
- `fgos triage` → đọc bản chiếu, xếp hạng mọi item CHƯA `done` theo số item khác (cũng chưa `done`) đang phụ thuộc vào nó qua đồ thị hợp nhất `deps` + `parent` (`blocks`; một parent được tính cả từ con còn mở, không chỉ `deps`), giảm dần rồi id tăng dần (tie-break); mỗi dòng còn kèm `blockedBy` — chiều ngược lại, danh sách id mà CHÍNH dòng này còn đang chờ (unmet `deps`, cộng con còn mở nếu dòng là parent); backlog-triage impact ranking (STR21), tách bạch khỏi phân loại rủi ro/lane lúc intake (STR14 `classify.mjs`) — thao tác ĐỌC thuần, không sự kiện mới
- `fgos take [--id <id>] [--role human|session]` → **cửa pull giao–nhận việc** (bên ngoài vòng runner): một tác nhân ngoài (người mặc định, hoặc một phiên đang sống) cầm đúng một item từ ĐÚNG tập frontier runner dispatch-được — xem "Cửa pull giao–nhận việc" dưới
- `fgos return <id> [--timeout <ms>]` → trả kết quả cho một item đã `take` — verb tự đo tiến độ thật (tree sạch + HEAD tiến + verify thật), KHÔNG tin lời người gọi — xem "Cửa pull giao–nhận việc" dưới
- `fgos pick [id]` → **cửa pull giao–nhận việc CỘNG dựng workspace**, một lệnh kết hợp `take` + tạo/tái dùng worktree cho item claim được: không truyền `id` thì cầm đầu frontier (giống `take`), truyền `id` thì cầm đúng item đó (kể cả đường tái claim `blocked→doing` mang nhánh sống, giống `take`) — role LUÔN `session`, không có cờ `--role` (khác `take`); sau khi claim thành công, dựng (hoặc tái dùng) một worktree + nhánh `fgw/<id>` qua CHÍNH `createWorktree` mà vòng tự hành dùng (xem spec Runner Data Dictionary #2) — xem "Cầm việc + dựng workspace (pick)" dưới
- `fgos retrospective` → quét cơ học MỌI item đang `delivered` và chuyển từng cái sang `retrospective` — không nhận id, không phán xét, chạy lại nhiều lần vẫn ra cùng kết quả; đây là cửa vào của chặng tổng hợp sau-thi-công
- `fgos compound <id>` → GẮN NHÃN tài liệu lên bản ghi capture của một item đang ở status `retrospective` — item ở status khác bị từ chối rõ lý do, không sự kiện nào ghi thêm. Verb này KHÔNG còn chuyển stage: stage `compound-learn` mà nó từng mở lối vào đã rút, nên nó chỉ ghi outcome. Cờ tùy chọn `--doc-type <quadrant>` ghi nhãn Diataxis, cờ tùy chọn `--doc-path <path>` ghi con trỏ nguồn↔tài liệu (linkage) lên cùng outcome — xem RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)/RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)
- `fgos cleanup <id>` → đóng chặng cuối: đòi item đang ở status `cleanup`, chạy phép kiểm thu-hồi (TTL toàn cục đã trôi qua, và merge của item vẫn còn giải được) rồi mới cho `cleanup → done`; không đạt thì item rẽ `cleanup → blocked` nêu rõ lý do. Là harness thuần — KHÔNG skill nào nạp cho chặng này
- `fgos docs-index` → sinh chỉ mục đọc-theo-tag máy-đọc-được của tài liệu người-dùng-cuối (manifest `docs/enduser-docs-index.json`) — verb ĐỌC-THUẦN (quyền `read`): không ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào; enumerate các quadrant Diataxis trên đĩa và truy ngược mỗi tài liệu về capture đã sinh nó — chi tiết hành vi + hình dạng manifest ở area `enduser-docs-index` (per bước-3 compound-learn-enduser-docs)
- `fgos review <id>` / `fgos approve <id> [--timeout <ms>]` / `fgos reject <id> --reason "..."` → cổng duyệt PR nội bộ, MỘT cổng cho mọi đề xuất `awaiting-approval` bất kể nguồn (runner hay pull-door) — bề mặt CLI này sống ở đây (cửa lệnh `fgos` một cửa), nhưng cơ chế merge/verify đầy đủ được đặc tả ở spec Runner "Cổng duyệt PR nội bộ"
- Bản ghi dự đoán/thực tế (outcome) không có verb ghi riêng qua cửa lệnh: nó được ghi từ bên trong vòng tự hành (xem spec Runner) — nửa dự đoán lúc nhận việc, nửa thực tế lúc việc tới trạng thái cuối (thành công lẫn thất bại); cửa pull `take`/`return` ghi hai nửa này trực tiếp, cùng khuôn
```

## claim_7ff59f56db041b4462793a3040f3e64c

`docs/platform/work-state/spec.md#unheaded-block-4`
Unit SHA256: `1cedade3c4b6ebc117d2a584b597abfb21cfc375afe5d9fc82814ff074eaed37`
Shown SHA256: `1cedade3c4b6ebc117d2a584b597abfb21cfc375afe5d9fc82814ff074eaed37`

```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | id | Định danh bền của work item, dạng kebab-case chữ thường, mở đầu bằng chữ cái; không trùng. KHÔNG mang nội dung title (title lưu ở field riêng #2) — item gốc sinh tiền tố cố định `tsk-` + hậu tố ngắn chống trùng; item con (sinh qua chia-việc) mang id `<id-của-gốc>-<n>` (n = thứ tự trong lứa con, đệ quy nếu con lại bị chia tiếp) | ví dụ `tsk-e5i0f2` (gốc), `tsk-e5i0f2-1` (con thứ 1) | yes | — |
| 2 | title | Tên việc người đọc hiểu; nhận mọi ký tự unicode | free text | yes | — |
| 3 | kind | Loại việc (trả lời "việc này thuộc loại gì" — câu 2 của sáu câu) | free text | yes | — |
| 4 | status | Trạng thái vòng đời; schema từ chối giá trị ngoài **mười** trạng thái này (phạm trù `validation`) kể cả qua tầng thư viện. Chuỗi chính chạy `todo → doing → awaiting-approval → delivered → retrospective → cleanup → done`, cộng ba nhánh rẽ `blocked`/`awaiting-human`/`wontfix`. Bốn chặng ĐUÔI (`delivered`/`retrospective`/`cleanup`/`done`) là chuỗi dùng chung mọi domain đi y hệt nhau, không domain nào được đặt nhãn lại. **Phân biệt durable status vs effective status:** Trạng thái bền (**durable status**) là view gộp từ nhật ký sự kiện `work.move`. Trạng thái hiệu lực (**effective status**) là trạng thái bền được phủ bởi bản ghi runtime claim đang hoạt động (`.fgos/runtime/claims/<id>.json`), theo công thức `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); `doing` đóng vai trò trạng thái hiệu lực khi claim đang hoạt động, và vẫn giữ giá trị FSM hợp lệ cho dữ liệu di sản hoặc đường phục hồi fallback | `todo` — chưa bắt đầu · `doing` — đang làm · `blocked` — kẹt vì lỗi/runner-park, hai chiều với todo/doing; nhận thêm một cạnh vào từ `awaiting-approval` (per pr-lifecycle / 1359ab5e) khi cổng duyệt gãy — merge conflict hoặc verify đỏ sau merge — mang `reason` bắt buộc, cùng khuôn enforce với `awaiting-approval→todo`; xem spec Runner "Cổng duyệt PR nội bộ"; và một cạnh RA thẳng tới `awaiting-approval` (per fan-out-parallel) khi một lần đồng bộ-lại (catch-up) sạch — cạnh này KHÔNG mang `reason` (mirror khuôn cơ học của `blocked→todo`/`blocked→doing`, khác khuôn bắt-buộc-lý-do của `awaiting-approval→todo`/`awaiting-approval→blocked`) và KHÔNG BAO GIỜ đi qua `doing`; xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)" · `awaiting-human` — đậu chờ người quyết, mang một câu hỏi; runner/frontier KHÔNG BAO GIỜ pick; rời khi người trả lời (một lối vào từ `todo` hoặc `doing`, một lối ra về `todo`); đậu vô thời hạn, không timeout · `awaiting-approval` — goal-check đạt, đề xuất nằm trên nhánh chờ duyệt · `delivered` — code ĐÃ được nhận vào cây chính; đây chính là nghĩa hẹp mà `done` từng mang không chính thức cho phép kiểm "dep đã mở chưa" (RUL12 (frontier dẫn xuất)), nay tách ra thành một chặng riêng có tên · `retrospective` — chặng tổng hợp/học sau-thi-công theo lô, chỗ ở mới của bước Compound-learning sau khi nó thôi làm một stage (xem "Mô hình domain" dưới) · `cleanup` — chặng thu-hồi worktree có hạn TTL; một item đỗ ở đây chỉ đi tiếp khi TTL đã trôi qua và phép kiểm thu-hồi đạt, nếu không thì rẽ `cleanup→blocked` · `done` — TERMINAL, nay chỉ còn ĐÚNG MỘT lối vào `cleanup→done`, không bao giờ ra; hai lối vào cũ `doing→done`/`awaiting-approval→done` KHÔNG còn tồn tại — chúng đã được thay bằng `doing→delivered`/`awaiting-approval→delivered`, và phần đuôi nói trên chạy tiếp từ đó · `wontfix` — TERMINAL thứ hai (per fsm-wontfix-terminal-status), cho item bị đóng CHỦ Ý mà không xây (superseded/duplicate/quyết định hành chính), khác `done` (đã hoàn thành thật); ba lối vào — `blocked→wontfix`/`todo→wontfix`/`doing→wontfix` (mirror hai lối vào của `awaiting-human` cộng thêm `blocked`) — không lối ra; KHÔNG bắt buộc `reason` cơ học (cùng khuôn `todo→blocked`/`doing→blocked`), lý do đóng ghi ở decision log của item; `hasOpenDescendant` (`frontier.mjs`) coi `wontfix` là đã-giải-quyết ngang `done` — một con `wontfix` vĩnh viễn không neo gốc ngoài frontier mãi (khác lỗ hổng cũ của `blocked`) | yes | `todo` |
| 5 | deps | Các id item phải xong trước; mọi id phải tồn tại, cấm tự trỏ; "epic" chỉ là một item thường được deps trỏ vào. **Bất biến phi-chu-trình (per work-graph-intelligence S1):** đồ thị `deps` không bao giờ được phép khép vòng — cửa ghi duy nhất (qua verb `add` và `edit`) chặn MỘI lần ghi (thêm mới hoặc sửa `deps`) mà kết quả sẽ tạo một chu trình (A→B→A hoặc dài hơn), ngay sau bước kiểm tồn tại và TRƯỚC khi sự kiện được ghi; lần ghi bị chặn trả lỗi phạm trù `validation` (mã thoát 4). Chu trình được đo qua đúng một đường kiểm tra dùng chung, không có đường thứ hai. Vì id của một item mới phải trỏ tới các id đã tồn tại, một chu trình nhiều-nút chỉ có thể phát sinh khi SỬA `deps` của item đang có; lần ghi thêm mới chỉ có thể tự-trỏ (đã bị chặn từ trước ở bước kiểm hình dạng). Trước bất biến này, một lần sửa `deps` có thể tạo chu trình A↔B mà lọt qua âm thầm (phép kiểm deps khi đó chỉ xét sự tồn tại của id) — lỗ hổng đó nay đã đóng. **Mở rộng (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** bất biến phi-chu-trình nay phủ ĐỒ THỊ CẠNH-ĐỊNH-KIỂU HỢP NHẤT (`blocks` từ `deps` + `parent-child` từ `parent`), không chỉ riêng `deps` — xem quy tắc RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị) và Data Dictionary #13 | danh sách id | yes (rỗng được) | `[]` |
| 6 | risk | Mức rủi ro của việc (câu 4) | free text | yes | — |
| 7 | refs | Đọc gì trước / chạm contract nào (câu 1 + 3) | danh sách tham chiếu | yes (rỗng được) | — |
| 8 | verify | Proof gì thì xong (câu 5) | free text | yes | — |
| 9 | learn | Link bài học để lại (câu 6 — chỗ cắm vòng học sau này) | text | no | — |
| 10 | size | Độ lớn, công sức của việc ('light' · 'standard' · 'heavy') để ước lượng và chia việc, không bao giờ dẫn tới model (Phase 3 tách từ tier cũ; event cũ có tier được map thành size lúc đọc ở một chỗ duy nhất) | `light` · `standard` · `heavy` | no | `standard` |
| 10b | rigor | Độ nghiêm của việc (cùng thang với step và unit), dẫn tới model qua runner.rigorToTier; discovery phán từ bằng chứng thật | `low` · `standard` · `high` · `critical` | no | vắng mặt (dispatch dùng mặc định `standard`, trừ `risk: heavy` dùng `high`) |
| 11 | mode | Chế độ submit đã dùng khi item được tạo qua `submit` — quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-DISCOVERY-TRƯỚC (agent đang sống hay runner tự hành), KHÔNG phải điều kiện mà code rẽ nhánh (xem RUL17 (mode là quy ước gọi, không phải điều kiện code)) | `sync` (mặc định — người submit tương tác ngay) · `async` (người submit rời đi ngay) | no | `sync` (khi tạo qua `submit`; vắng mặt trên item tạo qua `add`) |
| 12 | workflowStep | Bước của item trong Workflow của domain nó (`domains/<domain>/workflows/*.yaml`) — chiều VĨ MÔ của vòng đời, song song với `status` (chiều vi mô, không đổi). Quyết định loại tác vụ/persona nào xử lý item ở thời điểm hiện tại; `status` vẫn áp dụng như cũ BÊN TRONG mỗi bước. Danh sách bước hợp lệ, cạnh chuyển bước hợp lệ (`transitions`), skill và operation của mỗi bước nằm trong định nghĩa Workflow — KHÔNG có bản chép nào ở dispatch hay ở Work. Với domain `coding` (Workflow `coding/feature`): `discovery` — chưa qua kiểm chất lượng thông tin, context-discovery còn phải chạy · `exploring` — context-discovery thấy chưa đủ rõ, cần một vòng đào sâu cùng người để khóa quyết định sản phẩm · `planning` — đã qua kiểm, đang chờ/qua phán chia-việc trước khi vào executing · `executing` — sẵn sàng cho vòng thi công. `decompose` KHÔNG còn là giá trị hợp lệ: nó là tên cũ của `planning`, được Workflow khai là bí danh (`aliases`) và replay đọc lại thành `planning` ở MỘT chỗ duy nhất (xem "Đường đọc dữ liệu cũ" dưới). `clarify` và `compound-learn` cũng không còn — cái trước dời về bước Init trước khi item tồn tại, cái sau dời sang chiều `status` (`retrospective`) | no | bước thỏa pha `execute` của Workflow (`executing` với coding) khi vắng mặt (item tạo qua `add` không kèm `--step`... xem Khai việc); `discovery` — bước đầu của Workflow — khi tạo qua `submit` |
| 13 | parent | Lineage: id của item GỐC mà item này là hậu duệ; chỉ sinh ra qua phán chia-việc, không phải trường người tự điền qua `add`/`submit`. **Mô hình cạnh-định-kiểu (per work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất), supersede ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường)):** `parent` là cạnh `parent-child` trong MỘT đồ thị cạnh-định-kiểu hợp nhất cùng `deps` (cạnh `blocks`) — hai quan hệ vẫn TÁCH BẠCH về lưu trữ và về điều-phối (con của một lần chia-việc KHÔNG BAO GIỜ được ghi vào `deps` của gốc — RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối) giữ nguyên), nhưng là MỘT đồ thị cho phép kiểm phi-chu-trình: `parent` nay tham gia bất biến acyclic ở cửa ghi (xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)). Trước S2a, một chu trình `parent-child` (A cha B, B cha A) lọt qua âm thầm vì id của `parent` không được kiểm tồn tại — nay bị cửa ghi từ chối | id của một work item đã tồn tại, hoặc vắng mặt | no | vắng mặt (item gốc, hoặc mọi item tạo trước tính năng chia-việc) |
| 14 | claimRole | Ai đang cầm claim hiện tại của item — lưu trên bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`), hoặc cộng-thêm (fold) từ `role` trên sự kiện di sản; phân biệt claim của cửa pull (`human`/`session`) với claim của runner (`runner`/`system`). Runtime claim phủ trạng thái hiệu lực `doing` lên item trong lúc hoạt động (xem "Cửa pull giao–nhận việc" dưới) | `runner` · `human` · `session` · `system` — vai thứ tư (per str46-io-contract): cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (dùng trên cạnh park nội bộ, xem RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)/spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) | no | vắng mặt (nhật ký di sản không mang `role` trên cạnh claim) |
| 15 | headAtTake | Vị trí commit (HEAD) của host repo tại đúng thời điểm cửa pull `take` cầm item — cộng-thêm trên CÙNG sự kiện `work.move` đưa item vào `doing`; CHỈ `take` ghi trường này, claim của runner không bao giờ mang nó | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim của runner, hoặc item chưa từng qua cửa pull) |
| 16 | headAtReturn | Vị trí commit (HEAD) của host repo tại đúng thời điểm `return` đo verify XANH — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; đối xứng `headAtTake` nhưng ghi ở đầu RA thay vì đầu VÀO (per pr-lifecycle / 1359ab5e); nguồn diff trung thực cho cổng duyệt tính dải `headAtTake→headAtReturn` của một đề xuất pull-door (xem spec Runner "Cổng duyệt PR nội bộ") | mã commit (string), hoặc vắng mặt | no | vắng mặt (đề xuất của runner không qua `return`, hoặc mọi đề xuất tạo trước pr-lifecycle) |
| 17 | description | Toàn văn mô tả gốc người submit gõ — nguồn ngữ cảnh đầy đủ để context-discovery đọc lại (xem "Giai đoạn Soi-rõ" dưới), không bị cắt gọn/phân loại như `title` (per discovery-context STR30 / cfae0120) | free text (không rỗng khi có mặt) | no | vắng mặt (item tạo qua `add`, hoặc mọi item tạo trước tính năng này) |
| 18 | reason | Lý do từ-chối/đỗ MỚI NHẤT của item — fold từ trường `reason` trên sự kiện `work.move` gần nhất mang nó (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`), KHÔNG phải trường người tự điền. GHI ĐÈ mỗi lần fold (latest-wins) — khác khuôn "cộng thêm không đè" của outcome/friction/settlement/discovery, vì đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker prompt, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)), không phải một chuỗi lịch sử cần giữ mọi lần. Khi item đạt trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason`/`parkReason` tồn dư từ đợt đỗ cũ có thể được xóa khỏi view phát lại qua verb `fgos resolve-park-reason <id> --note "..."` (bỏ khóa `reason`/`parkReason` trên view và ghi nhận note vào `view.parkResolutions[id]`) | free text | no | vắng mặt (item chưa từng bị đỗ/từ chối, hoặc đã được xóa qua resolve-park-reason) |
| 19 | branchHeadAtTake | Vị trí commit (HEAD) của CHÍNH NHÁNH đề xuất (`fgw/<id>`) tại đúng thời điểm `take` cầm một item `blocked` mang nhánh sống — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `blocked→doing`; KHÔNG BAO GIỜ cùng mặt với `headAtTake` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (claim main-based, hoặc claim của runner) |
| 20 | branchHeadAtReturn | Vị trí commit (HEAD) của CHÍNH NHÁNH tại đúng thời điểm `return` đo verify XANH trên một item nguồn-nhánh — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `doing→awaiting-approval`; KHÔNG BAO GIỜ cùng mặt với `headAtReturn` trên một item (RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh)) | mã commit (string), hoặc vắng mặt | no | vắng mặt (return main-based, hoặc đề xuất của runner) |
| 21 | domain | Domain nào chi phối Workflow (bộ bước + chuyển-bước) và bảng vòng đời Work (status labels, parkReason, classification, role graph) của item — chiều thứ BA, song song `workflowStep` (vĩ mô, "loại tác vụ nào") và `status` (vi mô, "đang ở đâu"). `domains/<domain>/registry.yaml` khai phần vòng đời Work; các bước, `phase` (`clarify`/`discover`/`plan`/`execute` — vai trò của bước, để pool và verb chọn đúng bước), skill, operation và `transitions` nằm ở Workflow của domain; domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`) (per base-workflow-model / 2ae492d8) | `coding` (bước `discovery`/`exploring`/`planning`/`executing`) · `synthetic` — fixture minh họa/dùng-một-lần, đúng MỘT bước, chỉ thỏa pha `execute` · `triage` — fixture ba bước mang tên riêng không trùng coding, thỏa pha clarify/plan/execute · `fixture-marketing` — fixture khai bộ nhãn status và skill tổng-hợp của riêng nó (xem "Mô hình domain" dưới) | no | `coding` khi vắng mặt (mặc định lazy, cùng khuôn mặc định lazy của `workflowStep`); `add`/`submit` đều nhận `--domain <tên>` tùy chọn (xem "Khai việc"/"Nộp vấn đề tự do" dưới) |
| 22 | discoveredFrom | Dòng dõi PHÁT-HIỆN: id của item mà trong lúc thi công nó, việc này lộ ra — cạnh `discovered-from` của mô hình cạnh-định-kiểu (xem #13/RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)), khác `parent` (dòng dõi CHIA-VIỆC): `discoveredFrom` không sinh từ một phán chia-việc, mà từ việc thi công item nguồn phát hiện thêm việc mới. KHÔNG BAO GIỜ chặn — loại trừ khỏi phép kiểm phi-chu-trình theo đúng thiết kế (chỉ `blocks`/`parent-child` tham gia acyclic, xem RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)); tồn tại của id nguồn KHÔNG được kiểm (cùng khuôn `parent` — một id treo vẫn được chấp nhận, degrade an toàn). Hai nguồn sinh: (a) người tự khai tường minh lúc `add`/`submit` một item mới; (b) tự động — khi trợ lý thi công một item báo có việc mới lộ ra, runner (bên duy nhất được ghi) tự tạo item đó và đóng dấu trường này trỏ về item đang thi công (xem spec Runner "Báo việc-phát-hiện từ trợ lý") | id của một work item đã tồn tại, hoặc vắng mặt (tồn tại không được kiểm) | no | vắng mặt (item không có dòng dõi phát-hiện, hoặc mọi item tạo trước tính năng này) |
| 23 | docsRef | Con trỏ CEREMONY-STATE tới artifact quyết định của tính năng đã tạo ra item này — đường dẫn tương đối trỏ vào `docs/history/<feature>/` (nơi CONTEXT.md/plan.md của tính năng đó thực sự sống). Item chỉ mang CON TRỎ; nội dung quyết định ở nguyên trong file markdown git-hoá đó — không có sự kiện/contract mới (`work.add`/`work.edit` payload đã đủ chỗ, C2 không đổi) (per p50-workflow-induct / 28e6184b). Cùng khuôn optional-additive với `description`/`parent` ở trên: kiểm hình dạng (chuỗi không rỗng) khi có mặt, KHÔNG kiểm tồn tại trên đĩa lúc ghi — một `docsRef` trỏ tới đường dẫn chưa tồn tại hoặc đã dời đi vẫn được chấp nhận, degrade an toàn cùng khuôn `parent`/`discoveredFrom` | đường dẫn tương đối dạng chuỗi (không rỗng khi có mặt), ví dụ `docs/history/p50-workflow-induct/` | no | vắng mặt (item tạo qua `add` không kèm field, hoặc mọi item tạo trước tính năng này) |
| 24 | acceptance | Danh sách clause điều-kiện-hoàn-thành (CoS) TÙY CHỌN của item, mỗi clause `{text, evidence}` — mirror discipline per-clause CoS mà bee tự áp cho backlog PBI của chính nó, port sang tầng work-item fgOS (per str73-done-flip-cos-check). `text` bắt buộc chuỗi không rỗng khi một clause tồn tại trong mảng; `evidence` tùy chọn — chuỗi không rỗng khi có mặt, hoặc vắng mặt/`null` khi clause đó chưa có bằng chứng. Khi TOÀN BỘ trường vắng mặt hoặc `null`, item hoàn toàn không bị chạm bởi gate RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) dưới — KHÔNG BAO GIỜ tự mặc định về mảng rỗng, cùng khuôn optional-additive với `docsRef`/`parent` ở trên. Sửa được qua `edit --acceptance '<json>'` — GHI ĐÈ TOÀN MẢNG mỗi lần (latest-wins), cùng khuôn `refs`/`deps`, KHÔNG có cửa sửa-từng-clause riêng | mảng `{text: string, evidence: string \| null}`, hoặc vắng mặt | no | vắng mặt (item tạo qua `add`/`submit` không kèm cờ, hoặc mọi item tạo trước tính năng này) |
| 25 | priority | Khóa sắp-xếp frontier CHÍNH — người hoặc một tác nhân tự khai qua `edit --priority <n>`, KHÔNG BAO GIỜ picker tự suy ra (giữ đúng RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item) dưới: picker cơ học vĩnh viễn). Số CÀNG NHỎ càng ưu tiên (ASC). Vắng mặt xếp SAU mọi item có `priority` tường minh, bất kể trị số — không coi vắng mặt là 0 (xem "Đọc (list / ready)" — thứ tự sẵn-sàng v2) | số nguyên không âm | no | vắng mặt (mọi item trước tính năng này, hoặc item không truyền cờ) |
| 27 | writer | Danh tính CÁ THỂ của tiến trình ghi lần gần nhất (fold không điều kiện, ghi đè mỗi lần) — object lồng hai trường con `id`/`source`, tách bạch khỏi `role` (#14/#S2, xem "Danh tính người ghi" dưới) | `{id, source}`, `source` một trong `registry`/`env`/`pid`/`unresolved` | no | vắng mặt (nhật ký di sản không mang `writer`, hoặc mọi item tạo trước tính năng này) |
| 26 | intent | Khóa sắp-xếp frontier PHỤ (tie-break sau `priority`) — điểm mức-độ-nên-làm-ngay do giai đoạn soi-rõ (stage `discovery`) TỰ TÍNH mỗi lần soi một item, đọc metrics đồ thị (STR43) + xếp hạng tác động (STR21) làm tín hiệu cơ học rồi tự quyết field cuối qua cửa ghi chuẩn — KHÔNG BAO GIỜ do người hay chat ghi thẳng (nếu STR38 sau này thêm gợi ý qua chat, gợi ý đó vẫn chỉ là tín hiệu đầu vào cho bước tính này, không tự nó là giá trị cuối). Ghi cả khi item CHƯA đủ rõ để rời `discovery` (đậu `awaiting-human` vẫn được chấm điểm) — không gắn với kết quả rõ/chưa-rõ của lần soi đó. Số CÀNG LỚN càng ưu tiên (DESC, ngược chiều `priority`). Vắng mặt xếp SAU mọi item có `intent`, cùng khuôn absent-last với `priority`. Cũng sửa được thủ công qua `edit --intent <n>` (không có ràng buộc dấu/khoảng — khoảng 0-100 chỉ là quy ước trong prompt phán, không phải ràng buộc schema) | số nguyên (không ràng buộc dấu) | no | vắng mặt (item chưa từng qua giai đoạn soi-rõ dưới tính năng này, hoặc mọi item trước tính năng này) |
| 28 | mergedSha | Mã commit merge THẬT đã đưa item này vào `mergedInto` — cộng-thêm trên CÙNG sự kiện `work.move` đưa item `→delivered`, chỉ do `approve`'s các đường merge thật (local root-into-main, local leaf-into-root, GitHub PR merge) ghi; đây chính là bằng chứng kiểm-chứng-được thay cho việc phải suy luận từ git xem "việc này đã lên main chưa" (per tsk-5dk, đóng lớp sự cố "việc xong nằm ngoài main mà không ai biết" — tsk-4b2/tsk-64h/tsk-2t5). Một `move --to delivered` gõ tay, hoặc một đề xuất pull-door chỉ verify-only (không có merge commit thật nào), KHÔNG BAO GIỜ mang trường này — vắng mặt CHÍNH LÀ tín hiệu "không có bằng chứng merge", không phải một lỗ hổng ghi thiếu | mã commit (string), hoặc vắng mặt | no | vắng mặt (351 item lịch sử trước tsk-5dk, một move gõ tay, hoặc một delivery verify-only) |
| 29 | mergedInto | Tên nhánh mà `mergedSha` thực sự nằm trên đó — `main` (root-into-main hoặc GitHub PR merge) hoặc `fgw/<rootId>` (leaf-into-root) — cộng-thêm trên CÙNG sự kiện với `mergedSha` (#28), luôn cùng có-mặt/vắng-mặt với nhau trên một sự kiện | tên nhánh (string), hoặc vắng mặt | no | vắng mặt (cùng điều kiện vắng mặt với `mergedSha` #28) |
| — | Sự kiện (không hiển thị) | Đơn vị ghi của nhật ký; mỗi thao tác ghi đúng MỘT sự kiện, số thứ tự tăng dần + thời điểm + phiên bản schema `v` (hiện hành: 3; sự kiện di sản không có `v` vẫn đọc được) | `work.add` — khai item (luôn mang tier tường minh từ v2) · `work.move` — chuyển trạng thái (from/to; cạnh từ-chối `awaiting-approval→todo` VÀ cạnh gate-gãy `awaiting-approval→blocked` (per pr-lifecycle) đều mang `reason` bắt buộc; cạnh vào chờ mang `ask`, cạnh rời chờ mang `answer`; mọi ngã-ngũ có thể mang thêm `role` tùy chọn — xem "Bản ghi settlement" dưới; ngã-ngũ vào chặng đóng cũng tự mang thêm một bản ghi học — xem "Bài học lúc đóng" dưới; cạnh claim `todo→doing` qua cửa pull `take` mang thêm `headAtTake`, xem Data Dictionary #15 (hoặc `branchHeadAtTake` thay vào đó khi claim là nguồn-nhánh, cạnh `blocked→doing`, Data Dictionary #19); cạnh `doing→awaiting-approval` qua cửa pull `return` (verify xanh) mang thêm `headAtReturn`, xem Data Dictionary #16 (hoặc `branchHeadAtReturn` cho nguồn-nhánh, Data Dictionary #20, xem RUL34 (branchHeadAtTake/branchHeadAtReturn — cặp marker nguồn-nhánh))) · `decision` — quyết định kèm chữ · `work.outcome` — dự đoán HOẶC thực tế cho một item (mỗi nửa là một sự kiện riêng, cùng id; xem "Bản ghi kết quả" dưới) · `work.friction` — một lần thất bại tự-quy-tội tại park/halt (xem "Bản ghi friction" dưới) · `work.stage` — chuyển stage (from/to; có thể kèm `verify` khi rời `discovery`/`exploring` — xem "Giai đoạn Soi-rõ" dưới; ngã-ngũ đó cũng có thể mang `role` tùy chọn) · `work.discovery` — một lần context-discovery soi (xem "Bản ghi cổng discovery" dưới) | — | — |
| — | Phạm trù lỗi (không hiển thị) | Hợp đồng cho consumer: rẽ nhánh theo mã thoát, không theo thông điệp | `precondition` → mã 2 · `conflict` (kỳ vọng lệch) → mã 3 · `validation` → mã 4 · `corrupt-log` → mã 5 · bất ngờ → mã 1 · thành công → 0 | — | — |
```

## claim_aa9218de6bffacb2aa3b7a151fedb77e

`docs/platform/work-state/spec.md#unheaded-block-5`
Unit SHA256: `95acad19943ec3bec0f17e89bd1a2913178b14fa1918abd8a3582102d3547e09`
Shown SHA256: `95acad19943ec3bec0f17e89bd1a2913178b14fa1918abd8a3582102d3547e09`

```text
Subsections: Outcome Record, Friction Record, Settlement Record, Close Lesson Record, Human Gate Record, Discovery Gate Record.
```

## claim_08dc9da86eb0d431f35d9589d5f19377

`docs/platform/work-state/spec.md#unheaded-block-6`
Unit SHA256: `2036267728ec19e4c861fb80c37a21024deb862018786e34c723b685d1cf9000`
Shown SHA256: `2036267728ec19e4c861fb80c37a21024deb862018786e34c723b685d1cf9000`

```text
Ngoài bảng trường của work item, một item có thể mang thêm một **bản ghi outcome**: hai nửa
đến ở hai thời điểm khác nhau trong đời của một lần chạy, gộp theo id — nửa đến sau CỘNG
THÊM vào bản ghi, không bao giờ đè mất nửa đã có.
```

## claim_6a9b5e0ddd4f78411b0c92f353f5b1bd

`docs/platform/work-state/spec.md#unheaded-block-7`
Unit SHA256: `ff1feada8730be0c2c0f9dfa7c5be3927cf2faad6056cceb6f9a5cc57102d942`
Shown SHA256: `ff1feada8730be0c2c0f9dfa7c5be3927cf2faad6056cceb6f9a5cc57102d942`

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| O1 | dự đoán | tier dự kiến | Hạng nặng-nhẹ dự kiến của việc tại thời điểm nhận việc | `light` / `standard` / `heavy` | lúc nhận việc (claim) |
| O2 | dự đoán | số dep | Số lượng việc phụ thuộc của item tại thời điểm nhận việc | số nguyên ≥ 0 | lúc nhận việc |
| O3 | dự đoán | số lần nhận trước đó | Item này đã từng được nhận (chuyển sang "đang làm") bao nhiêu lần trước lần này | số nguyên ≥ 0 | lúc nhận việc |
| O4 | thực tế | kết cục (disposition) | Kết cục cuối của lần chạy | `awaiting-approval` — goal-check đạt, thành đề xuất chờ duyệt · `parked` — dừng lại theo lẽ thường (hết trần thử lại, hoặc lỗi không thử lại được), item bị đỗ · `halted` — cầu dao chấm-trượt-liên-tiếp cắt cả vòng chạy, item bị đỗ trước khi vòng dừng hẳn | lúc item tới trạng thái cuối |
| O5 | thực tế | đạt goal-check | Phép đo goal-check của chính vòng tự hành có đạt hay không | boolean | lúc item tới trạng thái cuối |
| O6 | thực tế | số lần thử | Số lần thử trong đúng lần chạy này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| O7 | thực tế | lớp lỗi | Lớp lỗi (theo bảng phục hồi của spec Runner) nếu thất bại; rỗng nếu thành công | free text hoặc rỗng | lúc item tới trạng thái cuối |
| O8 | thực tế | số commit | Số commit mà item để lại trên nhánh đề xuất | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O9 | thực tế | số lần nhận (đến giờ) | Item này đã từng được nhận bao nhiêu lần tính đến hết lần chạy này | số nguyên ≥ 0 | lúc item tới trạng thái cuối |
| O10 | — (trực giao) | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN gắn trên bản ghi — chiều AUDIENCE/loại-tài-liệu, TRỰC GIAO với chiều type-axis kỹ sư (pattern/decision/failure), một chiều CỘNG THÊM chứ không thay thế. Kiểm hình dạng khi CÓ MẶT (phải là đúng một trong bốn quadrant); vắng mặt/`null` = chưa gắn nhãn, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (Data Dictionary #23). Đi ké payload thô của sự kiện capture nên sống sót replay qua chính spread-fold sẵn có, không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` (bốn quadrant Diataxis; giá trị khác khi có mặt bị từ chối `validation`) | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
| O11 | — (trực giao) | con trỏ tài liệu (docPath) | Con trỏ TÙY CHỌN tới tài liệu người-dùng-cuối mà bản ghi outcome này sinh ra — chiều LINKAGE nguồn↔tài-liệu, đứng CẠNH `docType` (O10) chứ không thay thế: `docType` nói "loại tài liệu", `docPath` nói "đúng tài liệu nào". Ghi lúc `compound --doc-path <path>` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)); không kiểm hình dạng (đường dẫn tự do), vắng mặt/`null` = chưa gắn linkage, luôn hợp lệ, không bao giờ bắt buộc — cùng khuôn optional-additive với `docType`/`docsRef`. Đi ké payload thô của sự kiện capture nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Là móc để chỉ mục đọc-theo-tag truy ngược tài liệu về capture (area `enduser-docs-index`), đảm bảo dựng lại tài liệu không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs) | chuỗi đường dẫn tài liệu (vd `docs/how-to/x.md`); vắng/`null` khi chưa gắn | tùy — bên sản xuất `compound --doc-path` (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)) |
```

## claim_a9627dc72af31db901e895a4b8a218b1

`docs/platform/work-state/spec.md#unheaded-block-8`
Unit SHA256: `cf725e032c48a71007b0fafa2a0378dd2919d5cf50358de2a7d34a2835940aae`
Shown SHA256: `cf725e032c48a71007b0fafa2a0378dd2919d5cf50358de2a7d34a2835940aae`

```text
Item chưa từng chạy không mang bản ghi outcome nào — vắng mặt hoàn toàn, không phải bản ghi
rỗng. Nhật ký ghi trước khi bản ghi này tồn tại replay lại nguyên vẹn, không sinh ra outcome
nào cho item nào (tương thích ngược, theo luật tiến hóa schema RUL11 (tiến hóa schema)).
```

## claim_086c0fa8fac29044b710c2b3ca0480e3

`docs/platform/work-state/spec.md#unheaded-block-9`
Unit SHA256: `81624ef90ec06c15d1fe97548de6ee216e9299aea8dea2e59d1b6ce725e6958f`
Shown SHA256: `81624ef90ec06c15d1fe97548de6ee216e9299aea8dea2e59d1b6ce725e6958f`

```text
Mỗi lần một item kết thúc thất bại (`parked` hoặc `halted`) sinh thêm một **bản ghi
friction**, ghi cùng lúc với nửa thực tế của outcome, tại cùng một điểm trong runner.
Khác outcome (hai nửa gộp làm một theo id), friction là **chuỗi lần xảy ra** — mỗi
record CỘNG THÊM vào danh sách của id, không bao giờ gộp/đè lên record trước.
```

## claim_2c1aa24e1f33bf2cfc686fd789ba3a94

`docs/platform/work-state/spec.md#unheaded-block-10`
Unit SHA256: `cd6d9c4f74d86fedc3fd1d0bc9f150fc56ba3dffbc0fc2fdec0fdeed5df29a4e`
Shown SHA256: `cd6d9c4f74d86fedc3fd1d0bc9f150fc56ba3dffbc0fc2fdec0fdeed5df29a4e`

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| F1 | disposition | Kết cục của lần thất bại này | `parked` / `halted` | lúc item tới trạng thái cuối (park/halt) |
| F2 | lớp lỗi | Lớp lỗi theo bảng phục hồi (spec Runner) | free text | lúc item tới trạng thái cuối |
| F3 | lớp friction | Runner tự quy tội — 5 lớp cơ học suy ra từ lớp lỗi: `task-spec` · `context` · `environment` · `verification` · `state` | một trong 5 lớp | lúc item tới trạng thái cuối |
| F4 | số lần thử | Số lần thử của lần chạy dẫn tới thất bại này | số nguyên ≥ 1 | lúc item tới trạng thái cuối |
| F5 | chi tiết | Thông điệp lỗi cụ thể (vd nội dung goal-check miss) | free text | lúc item tới trạng thái cuối |
| F6 | phân loại tài liệu (docType) | Nhãn Diataxis TÙY CHỌN, cùng nghĩa và cùng khuôn với O10 của bản ghi outcome (trực giao với type-axis kỹ sư, kiểm khi có mặt, vắng/`null` = chưa gắn) — đi ké payload thô của sự kiện friction, sống sót replay không đổi cơ chế | `tutorial` / `how-to` / `reference` / `explanation` | tùy — bên sản xuất `compound --doc-type` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52) hoặc bất kỳ bên ghi capture nào cung cấp |
```

## claim_b34b0e39a5ce99c43f848a590e005e52

`docs/platform/work-state/spec.md#unheaded-block-11`
Unit SHA256: `bd9df710198dd3461f8b9538bf3a16c38947d113ba5d445e5e7fff62abaf5915`
Shown SHA256: `bd9df710198dd3461f8b9538bf3a16c38947d113ba5d445e5e7fff62abaf5915`

```text
Item chưa từng thất bại không mang bản ghi friction nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục friction: đếm theo lớp trên TOÀN BỘ record,
kèm tối đa 5 record gần nhất (không xả vô hạn); và nhắc mọi item đã tới trạng thái
cuối (`awaiting-approval`/`blocked`/`done`) mà chưa có nửa outcome thực tế — hai cảnh báo này
đọc từ view, không sự kiện mới nào sinh ra khi chạy `check` (vẫn là read thuần).
```

## claim_ae68e807be7a0e4e3d199fc82963a584

`docs/platform/work-state/spec.md#unheaded-block-12`
Unit SHA256: `bf76999817d9cf208bb7c3634fc835e0154c0520a6eb90e6bce39c20dbaf3ce0`
Shown SHA256: `bf76999817d9cf208bb7c3634fc835e0154c0520a6eb90e6bce39c20dbaf3ce0`

```text
Mỗi lần một item đi qua một **ngã-ngũ** — một điểm quyết-xong cụ thể trong
vòng đời của nó — sinh thêm một **bản ghi settlement**, cùng khuôn "cộng thêm
không đè" với friction/discovery: mỗi lần ngã-ngũ là một lần xảy ra, APPEND
vào danh sách của id, không bao giờ gộp/đè lên lần trước.
```

## claim_dd4cc4719aa5c7640a0b398c496e5b1f

`docs/platform/work-state/spec.md#unheaded-block-13`
Unit SHA256: `79d33485a7951e73e67a2e485f8a2bbf8b839c71868bd303cecd35c16489225a`
Shown SHA256: `79d33485a7951e73e67a2e485f8a2bbf8b839c71868bd303cecd35c16489225a`

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| S1 | loại ngã-ngũ (kind) | Loại điểm quyết-xong | `clarify-pass` — context-discovery cho qua, item RỜI stage ĐẦU CHUỖI của domain nó (`discovery` với `coding`; khóa theo cạnh RỜI nên đích `planning` hay `exploring` không đổi phép kiểm, nhưng một verdict `clear: false` thì KHÔNG ngã-ngũ). Tên kind là nhãn DI SẢN đã ghi vào nhật ký, không phải tên stage — xem RUL27 (settlement clarify-pass theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict) · `answer` — người trả lời một câu hỏi đang chờ · `close` — item tới `done` | lúc chính ngã-ngũ đó xảy ra |
| S2 | role | Ai/cái gì đã ngã-ngũ | `runner` — vòng tự hành tự động (quét soi-rõ, nhận việc, đề xuất, đỗ) · `session` — phiên đang sống gọi tay context-discovery · `human` — người qua lệnh CLI (`move`, `answer`) · `system` — cạnh do máy sinh ra như hệ quả của một verb, không do ai quyết định (vai thứ tư, per str46-io-contract) · vắng mặt (rỗng) — ngã-ngũ không kèm role (nhật ký cũ hơn tính năng này, hoặc lời gọi không khai) | lúc ngã-ngũ xảy ra, tùy chọn |
| S3 | chi tiết | Nội dung đi kèm ngã-ngũ này — verify thật (clarify-pass), câu trả lời (answer), hoặc rỗng (close) | free text hoặc rỗng | lúc ngã-ngũ xảy ra |
```

## claim_d74f97ea4698961f991f72d478cee0c5

`docs/platform/work-state/spec.md#unheaded-block-14`
Unit SHA256: `ba396ad09ac0efb0cc666893e0e8dd34a46cb8061530b304c475e8de681f7774`
Shown SHA256: `ba396ad09ac0efb0cc666893e0e8dd34a46cb8061530b304c475e8de681f7774`

```text
Bản ghi settlement không sinh event mới: nó là một **bề mặt đọc dẫn xuất** từ
ba ngã-ngũ đã có sẵn trong nhật ký — không thêm một loại sự kiện "settlement"
riêng, tránh ghi-đôi cùng một sự thật (nguyên tắc sự-thật-một-nguồn). `role`
là trường tùy chọn cộng-thêm trên chính ngã-ngũ đó (`work.move`/`work.step`)
— item chưa từng mang role (nhật ký cũ) vẫn fold bình thường, chỉ với role
rỗng.
```

## claim_2dc540951ed71fdc57788b12ce892ed9

`docs/platform/work-state/spec.md#unheaded-block-15`
Unit SHA256: `77b57cc2fc23f47de457fcf8628c30c67ad965f283d657c41dfb2217e10a3652`
Shown SHA256: `77b57cc2fc23f47de457fcf8628c30c67ad965f283d657c41dfb2217e10a3652`

```text
**Bảo vệ tương thích ngược:** ngã-ngũ `answer`/`close` chỉ sinh bản ghi
settlement khi sự kiện gốc mang phiên bản schema hiện hành — một sự kiện nhật
ký thật sự tiền-phiên-bản (trước khi khái niệm phiên bản schema tồn tại) giữ
nguyên hình dạng bản chiếu lịch sử của nó, không tự nhiên "mọc thêm" một bản
ghi settlement mà nó chưa từng có (cùng luật tiến hóa schema RUL11 (tiến hóa schema)).
```

## claim_70609d201e70402b9ae4386171dd9a05

`docs/platform/work-state/spec.md#unheaded-block-16`
Unit SHA256: `e05bfd6579e6f7322e1de065ea2da5632c47959bcad3901679a770737e7ca648`
Shown SHA256: `e05bfd6579e6f7322e1de065ea2da5632c47959bcad3901679a770737e7ca648`

```text
Item chưa từng qua ngã-ngũ nào không mang bản ghi settlement — vắng mặt hoàn
toàn (tương thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục settlement: đếm theo
kind+role trên TOÀN BỘ record, kèm tối đa 5 record gần nhất (cùng cap-5 của
friction) — đọc từ view, không sự kiện mới nào sinh ra khi chạy `check`.
```

## claim_fb2a9a962da6232d65f77e6590b05bbe

`docs/platform/work-state/spec.md#unheaded-block-17`
Unit SHA256: `ed3f6a8a9333f6cbfdb1187f55a82008fc78796370ede7849c7bf3c257fc8517`
Shown SHA256: `ed3f6a8a9333f6cbfdb1187f55a82008fc78796370ede7849c7bf3c257fc8517`

```text
Đúng lúc một item tới `done` — qua BẤT KỲ lối vào nào (thao tác tay
`doing→done`, hoặc duyệt đề xuất `awaiting-approval→done`) — hệ thống tự động soạn
thêm một **bản ghi học**, trả lời câu-6 của sáu câu hỏi harness ("learning gì
để lại?"). Soạn cơ học hoàn toàn từ dữ liệu item đã tích lũy — không có phán
xét bên ngoài, không gọi model, không spawn — và không bao giờ chặn việc đóng
item nếu soạn lỗi (best-effort, cùng tinh thần fail-safe của context-discovery).
```

## claim_2aad07e15a92409a1e7a3959e62018d0

`docs/platform/work-state/spec.md#unheaded-block-18`
Unit SHA256: `0681984fac4769d49011b503c68adca746cd05a063b9e9817bad86d013fc85e8`
Shown SHA256: `0681984fac4769d49011b503c68adca746cd05a063b9e9817bad86d013fc85e8`

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| L1 | kết cục (outcome) | Nửa thực tế của bản ghi kết quả tại thời điểm đóng — kết cục/số lần thử/lớp lỗi | object, hoặc rỗng nếu item chưa từng chạy | lúc item tới `done` |
| L2 | friction theo lớp | Đếm các bản ghi friction của item, theo lớp | map lớp→số lượng, rỗng nếu item chưa từng thất bại | lúc item tới `done` |
| L3 | settlement theo loại/role | Đếm các bản ghi settlement của item — kể cả chính ngã-ngũ đóng vừa xảy ra — theo cặp loại+role | map loại/role→số lượng | lúc item tới `done` |
```

## claim_49fe97f1522567d6ee247ea9b2b7b836

`docs/platform/work-state/spec.md#unheaded-block-19`
Unit SHA256: `e3a661dc407ab6ebaf346d91bd15be94f8d960f02348b44b0704321b1adab82a`
Shown SHA256: `e3a661dc407ab6ebaf346d91bd15be94f8d960f02348b44b0704321b1adab82a`

```text
Item đóng mà KHÔNG có outcome/friction/settlement nào trước đó vẫn nhận một
bản ghi học tối thiểu nhưng thật — không nổ, không im lặng bỏ qua. Ngược lại,
soạn bài học không bao giờ là điều kiện chặn đóng item: nếu việc soạn lỗi,
item vẫn đóng thành công, chỉ bản ghi học bị bỏ qua lần đó.
```

## claim_5f3ecad2d2967a0fa5b2a1d4469deb65

`docs/platform/work-state/spec.md#unheaded-block-20`
Unit SHA256: `99b20d7c045112465b1d253548fc4859c472b437bcbd994aa2013061dba24ca1`
Shown SHA256: `99b20d7c045112465b1d253548fc4859c472b437bcbd994aa2013061dba24ca1`

```text
Item chưa từng đóng không mang bản ghi học nào — vắng mặt hoàn toàn (tương
thích ngược, RUL11 (tiến hóa schema)). `fgos check` in mục học: mỗi item đã đóng một dòng tóm tắt
kết cục + friction + settlement của nó, kèm tối đa 5 record gần nhất.
```

## claim_7f9092e7b2a0e5978a1ed9db95a15e62

`docs/platform/work-state/spec.md#unheaded-block-21`
Unit SHA256: `3f166793a6f5bfa2554d671367e7edd5c3e1d0ab4dd081a3cf9f6ce8ac72cef4`
Shown SHA256: `3f166793a6f5bfa2554d671367e7edd5c3e1d0ab4dd081a3cf9f6ce8ac72cef4`

```text
Một item từng đi qua cổng chờ-người mang thêm một **bản ghi cổng**: câu hỏi/câu trả lời/ảnh
chụp gốc đến ở các thời điểm khác nhau, gộp theo id — hệt khuôn bản ghi outcome. Câu hỏi ghi
lúc item vào chờ; câu trả lời ghi lúc người trả lời; nửa đến sau CỘNG THÊM, không đè mất nửa
đã có.
```

## claim_64e14b949f0747d6a608e38b2d0ed08e

`docs/platform/work-state/spec.md#unheaded-block-22`
Unit SHA256: `412aa1ea6671a21153e7a478836be52612dd86b48e8f06ac59cc3add3f4f720a`
Shown SHA256: `412aa1ea6671a21153e7a478836be52612dd86b48e8f06ac59cc3add3f4f720a`

```text
| # | Nửa | Element | Meaning | Values | Ghi khi nào |
|---|-----|---------|---------|--------|-------------|
| G1 | hỏi | câu hỏi (ask) | Điều người phải quyết trước khi việc đi tiếp (vd "OAuth hay mật khẩu?") — nhãn trạng thái đơn thuần không nói được "chờ gì" | free text (không rỗng) | lúc item vào `awaiting-human` |
| G2 | trả lời | câu trả lời (answer) | Quyết định của người; ghi xong thì item rời `awaiting-human` | free text (không rỗng) | lúc người trả lời |
| G3 | ảnh chụp gốc | `parentSnapshotAtAsk` | Ảnh `{id, title, status}` của gốc (`parent`) tại đúng lúc item vào chờ — mốc so sánh cho RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)'s "đổi-từ-lúc-hỏi"; KHÔNG BAO GIỜ tự sửa lại sau khi ghi (per str61-chat-context-continuity) | `{id, title, status}` | lúc item vào `awaiting-human`, CHỈ KHI item có `parent` giải được lúc đó |
| G4 | status trước hỏi | `statusAtAsk` | Status do bên gọi cung cấp ngay trước hỏi, dùng cho audit; cửa ghi chụp riêng `durableStatusAtAsk` từ status bền để `answer` chọn resume. Log cũ thiếu trường bền mới fallback sang `statusAtAsk`; giá trị `doing` luôn clamp về `todo`; KHÔNG BAO GIỜ tự sửa lại sau khi ghi, cùng khuôn G3 | `'todo'` \| `'doing'` | lúc item vào `awaiting-human`, LUÔN CÓ (không điều kiện như G3) |
```

## claim_94f44d126681f8cdbb989c893883adfc

`docs/platform/work-state/spec.md#unheaded-block-23`
Unit SHA256: `809b90b8be2eb5c55bb312e2db97291c9bd63a027c5e2b9ace3fa3c7d0fc9129`
Shown SHA256: `809b90b8be2eb5c55bb312e2db97291c9bd63a027c5e2b9ace3fa3c7d0fc9129`

```text
Item chưa từng vào cổng chờ-người không mang bản ghi cổng nào — vắng mặt hoàn toàn, không phải
bản ghi rỗng. Item đang chờ có G1 mà G2 chưa tới (đang chờ trả lời). Item không có `parent`
(hoặc `parent` không giải được lúc `ask`) không mang G3 — vắng mặt, không phải `null`. Log cũ
ghi trước claim-lock cũng không mang G4 — `answer` đọc vắng mặt là `todo` (tương thích ngược
byte-for-byte với hành vi trước §5.1). Một lần `ask` mới trên item vừa được `answer` xong ghi
lại G3/G4 mới, GHI ĐÈ ảnh cũ (không gộp hai ảnh). Nhật ký không có sự kiện cổng nào replay lại
không sinh bản ghi cổng nào (tương thích ngược, cùng khuôn RUL11 (tiến hóa schema)/RUL13 (bản ghi outcome, cộng thêm không đè)).
```

## claim_448d3b26a4cd9fb551588da0071935ca

`docs/platform/work-state/spec.md#unheaded-block-24`
Unit SHA256: `5c9201d70578877abf44602c087ab21de9d8966cca3adf8e3f9531bf324084f7`
Shown SHA256: `5c9201d70578877abf44602c087ab21de9d8966cca3adf8e3f9531bf324084f7`

```text
Mỗi lần context-discovery soi (dù đủ rõ hay chưa) sinh thêm một **bản ghi
discovery**, ghi CẢ hai kết cục — cùng khuôn "cộng thêm không đè" với bản
ghi friction: mỗi lần soi là một lần xảy ra, APPEND vào danh sách của id,
không bao giờ gộp/đè lên lần trước. Bản ghi không đổi hình dạng khi phán-quan
lồng bên trong rút đi: nó ghi verdict thật sự đã được áp dụng, bất kể verdict
đó do người gọi cung cấp hay do tín hiệu tin-cậy suy ra.
```

## claim_2f9d43cee86c72670d32027fb8294a78

`docs/platform/work-state/spec.md#unheaded-block-25`
Unit SHA256: `4f6b857125193bca6a36ed7697dfb8ee813d9ea8bf4144712c45a413e410010d`
Shown SHA256: `4f6b857125193bca6a36ed7697dfb8ee813d9ea8bf4144712c45a413e410010d`

```text
| # | Element | Meaning | Values | Ghi khi nào |
|---|---------|---------|--------|-------------|
| C1 | đủ rõ | Kết quả soi của lần này | boolean | mỗi lần context-discovery chạy |
| C2 | câu hỏi | Điều cần người làm rõ (chỉ có khi chưa đủ rõ) | free text | khi đủ rõ = false |
| C3 | verify đề xuất | Lệnh proof thật người gọi cung cấp (chỉ có khi đủ rõ) | free text | khi đủ rõ = true |
```

## claim_d9655cfd5b6cfba5fa5208a6ee909afb

`docs/platform/work-state/spec.md#unheaded-block-26`
Unit SHA256: `a8677c227421e6f9687f292d21ccebfb0e577e4ba14300875bffe1274261ccee`
Shown SHA256: `a8677c227421e6f9687f292d21ccebfb0e577e4ba14300875bffe1274261ccee`

```text
Item chưa từng qua context-discovery không mang bản ghi discovery nào — vắng
mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)).
```

## claim_1ef09ff15a7cb12419b5c10e1d60f936

`docs/platform/work-state/spec.md#unheaded-block-27`
Unit SHA256: `69876b8abcf241ab133b5f7a4e06a3366f94b8ecc9e315ccc249c01b612aaeba`
Shown SHA256: `69876b8abcf241ab133b5f7a4e06a3366f94b8ecc9e315ccc249c01b612aaeba`

```text
Subsections: Workflow Step Replaces Stage, Discovery And Exploring Stages, Planning Stage.
```

## claim_29667fe1dd7323ba26e6571aa2bbfce7

`docs/platform/work-state/spec.md#unheaded-block-28`
Unit SHA256: `4c51cdea46faa78544375c980fc34c07d03ffd4ec7bf8153fc9df7cb1b141800`
Shown SHA256: `4c51cdea46faa78544375c980fc34c07d03ffd4ec7bf8153fc9df7cb1b141800`

```text
Một item KHÔNG mang `stage`. Nó mang `workflowStep` — id một bước trong Workflow
của domain nó. Mọi thứ về bước (danh sách bước, `phase` của mỗi bước, skill và
operation mỗi bước cho phép, `transitions` hợp lệ, `aliases` tên cũ, `statusSkills`)
nằm trong định nghĩa Workflow (`domains/<domain>/workflows/*.yaml`,
`src/workflow/definition.mjs`), đọc qua `src/state/domain-registry.mjs`. Dispatch
không tra bước nào cả: tầng Work tra operation/skill/executor của bước rồi TRUYỀN
vào (xem spec Runner).
```

## claim_d7995a26c0379dfe68a5de7d87fe5151

`docs/platform/work-state/spec.md#unheaded-block-29`
Unit SHA256: `332cc03c0827f2cbfab57ea56e59828a43b0ce6d113aaf2720e103ddea5ad8ca`
Shown SHA256: `332cc03c0827f2cbfab57ea56e59828a43b0ce6d113aaf2720e103ddea5ad8ca`

```text
Phiên bản view: `VIEW_SCHEMA_VERSION` = 4 (view không còn `stage`). Snapshot cũ lệch
phiên bản → fold lại từ đầu log; reader Rust (`packages/work-state/rust`) chỉ đọc đúng
phiên bản 4 và bỏ qua view cũ.
```

## claim_c831f12dd72aacb905d84ab3c97f269f

`docs/platform/work-state/spec.md#unheaded-block-30`
Unit SHA256: `509d6750254a6802e862d838af1177d127df2fad450ac289d027f57e307d335b`
Shown SHA256: `509d6750254a6802e862d838af1177d127df2fad450ac289d027f57e307d335b`

```text
**MỘT đường đọc dữ liệu cũ** (`src/state/replay.mjs`, `foldLegacyStage`/`canonicalStep`):
sự kiện `work.add`/`work.edit` mang `stage`, và sự kiện `work.stage` (một binary cũ ở
project khác vẫn có thể ghi) đều được đọc thành `workflowStep`; tên bước cũ `decompose`
đọc thành `planning` qua `aliases` của Workflow. Cửa ghi từ chối `stage` (`work.stage is
retired`). Sự kiện mới ghi là `work.step`.
```

## claim_b5c860d660743abfdb836c6a497525c4

`docs/platform/work-state/spec.md#unheaded-block-31`
Unit SHA256: `26c7bc289872ab33201af4b02bb9b6499f805b51d9c8848c53ff88b42ab66fda`
Shown SHA256: `26c7bc289872ab33201af4b02bb9b6499f805b51d9c8848c53ff88b42ab66fda`

```text
Tên đã đổi trên bề mặt: field `workflowStep` (thay `stage`), `workflowStepEffective`
(thay `stageEffective`), `stepByItem` (thay `stageByItem`), `fgos add --step`,
`fgos ready --phase clarify|plan|execute` (thay `--step Clarify|Divide|Execute`),
`fgos workflow operations --step`, kiểm doctor `work-step-vocabulary`.
```

## claim_403eb72869847e36c4fea6c53fa91193

`docs/platform/work-state/spec.md#unheaded-block-32`
Unit SHA256: `3ef0991bbca1a01f425854ee2163524cce0cb46d05a4cb874d795c894b2d284d`
Shown SHA256: `3ef0991bbca1a01f425854ee2163524cce0cb46d05a4cb874d795c894b2d284d`

```text
Song song với `status` (vi mô, không đổi), mỗi item mang trường `workflowStep`
— trả lời "loại tác vụ nào đang cần cho item này ngay lúc này trong Workflow của
domain". Chuỗi bước SỐNG của domain `coding` hôm nay có bốn bước một item mới
đi qua được: `discovery` (soi phần còn mơ hồ, máy tự làm một mình), `exploring`
(đào sâu cùng người, khi máy tự soi thấy chưa đủ), `planning` (lập hình dạng +
phán chia-việc — xem "Giai đoạn Lập-kế-hoạch" dưới), và `executing` (đã qua các
bước trên, hoặc chưa từng cần qua). `status` vẫn vận hành y hệt BÊN TRONG mỗi
bước — một item ở bước `discovery` vẫn có thể là `todo` hay
`awaiting-human`, ý nghĩa của hai status đó không đổi.
```

## claim_5d1671e66c6207da8f14e93172c484f5

`docs/platform/work-state/spec.md#unheaded-block-33`
Unit SHA256: `023a0fbc2a4e4f7fb07374d8652f2cc37553e270a9b9011ee0e3e2416f42ade1`
Shown SHA256: `023a0fbc2a4e4f7fb07374d8652f2cc37553e270a9b9011ee0e3e2416f42ade1`

```text
**`clarify` KHÔNG còn là một stage.** Việc làm-rõ ý định của một câu mô tả tự
do nay xảy ra ở bước Init — TRƯỚC khi item tồn tại: cửa nộp gọi một trợ thủ
làm-rõ đọc thẳng văn bản gốc, chỉ hỏi người khi thật sự còn khoảng trống, rồi
mới khai item. Với domain `coding`, cửa khai từ chối `stage: clarify` trên
bất kỳ item mới nào — không phải bằng một luật riêng cho cái tên đó, mà vì
cửa chỉ nhận stage nằm trong danh sách stage của chính domain, và `coding` đã
gỡ tên đó khỏi danh sách. Một domain KHÁC còn khai `clarify` thật (hôm nay:
`fixture-marketing`) vẫn nhận bình thường — quy tắc là "stage phải còn đăng
ký", không phải "cấm chữ clarify". Toàn bộ item `coding` từng đỗ trên tên đó
đã được di trú THẬT sang chuỗi mới (khác `decompose` dưới, vốn được giữ lại
làm bí danh), nên không còn gì mắc kẹt; từ nay một item mở đứng ở stage
domain của nó không còn đăng ký sẽ bị `fgos doctor` gọi tên qua phép kiểm
`work-step-vocabulary`.
`stage` đầu tiên của một item mới là `discovery`.
```

## claim_eaed82e8c84716d56460c7fe896df96b

`docs/platform/work-state/spec.md#unheaded-block-34`
Unit SHA256: `58e2979350417bb923ddde74629df8f6d081f3ed3e390a5f77e54ca288d5825a`
Shown SHA256: `58e2979350417bb923ddde74629df8f6d081f3ed3e390a5f77e54ca288d5825a`

```text
Item vào stage `discovery` đi qua **context-discovery**: một lần soi xem
thông tin đã đủ để bắt tay lập kế hoạch chưa. Phép soi này KHÔNG còn tự gọi
một phán-quan lồng bên trong: người gọi — một phiên đang sống, vốn đã tự đọc
và tự lập luận — phải TỰ đưa ra verdict và truyền vào; engine không bao giờ
tự đoán hộ. Chỉ hai lối thay thế còn lại: một artifact quyết định đã commit
dưới `docsRef` được coi là tín hiệu tin-cậy rằng người đã chốt xong, và lượt
quét cơ học của vòng tự hành degrade an toàn về không-làm-gì thay vì đoán bừa.
```

## claim_11b40e6f042c8ebdf299fd0bdb8d0151

`docs/platform/work-state/spec.md#unheaded-block-35`
Unit SHA256: `e179ab994ffccea20065605932a825cd29a76101c538f88e5569ac53113ebdf7`
Shown SHA256: `e179ab994ffccea20065605932a825cd29a76101c538f88e5569ac53113ebdf7`

```text
- **Đủ rõ (`clear`)** — item chuyển thẳng `discovery → planning`, BỎ QUA
  `exploring`; MỘT sự kiện `work.step` vừa đổi stage vừa gắn lại `verify`
  bằng một lệnh chạy được thật, thay cho placeholder cố định `submit` đã điền
  lúc tạo — không bao giờ để placeholder giả sống sót qua khỏi bước này.
- **Chưa đủ rõ (`unclear`)** — item chuyển `discovery → exploring`: phần còn
  mơ hồ cần một vòng đào sâu cùng người, khóa lại các quyết định sản phẩm,
  trước khi có gì để lập kế hoạch. Chốt xong, item đi tiếp `exploring →
  planning`. Hai đường này là toàn bộ lối ra của `discovery` — không có cạnh
  nào đi thẳng từ đây tới `executing`.
- **Cần người quyết** — item đậu vào `awaiting-human` (như mọi cổng chờ-người
  khác — xem "Bản ghi cổng-người" trên), mang đúng một câu hỏi cụ thể; người
  trả lời xong, item về `todo` (GIỮ NGUYÊN stage), và phép soi chạy lại — lặp
  tới khi đủ rõ. Không có cơ chế "quay lại" riêng; đây là hành vi tự nhiên
  của vòng lặp.
```

## claim_47a7008c4a6e13de19e28bf617190e8e

`docs/platform/work-state/spec.md#unheaded-block-36`
Unit SHA256: `534a5eb27e492a380e76da117108b0c9517d5f4351e287d0cb4e655594c7ebf0`
Shown SHA256: `534a5eb27e492a380e76da117108b0c9517d5f4351e287d0cb4e655594c7ebf0`

```text
**Ngữ cảnh soi (per discovery-context STR30 / cfae0120):** phép soi không chỉ
đọc title/kind/refs/deps — nó còn đọc toàn văn `description` (Data
Dictionary #17; item không có description, vd tạo qua `add`, đọc ra
"(không có)" — degrade, không nổ), cặp hỏi-đáp MỚI NHẤT của cổng chờ-người
nếu item từng qua đó ("Bản ghi cổng-người" trên), và toàn bộ các lần soi
trước đó của chính item ("Bản ghi cổng discovery" dưới). **Câu trả lời của
người ở đây là quyết định CUỐI CÙNG — không bao giờ hỏi lại một chủ đề đã
được trả lời**; một câu trả lời đủ để thi công phải ra verdict đủ rõ kèm một
`verify` chạy được thật. Known limitation: bản ghi cổng chỉ giữ cặp hỏi-đáp
MỚI NHẤT (gộp-mới-nhất theo id, không phải một mảng lịch sử) — nếu một vòng
làm-rõ cần nhìn lại nhiều vòng hỏi-đáp trước đó, đó là mở rộng sau (xem Open
Gaps).
```

## claim_ea48224655ea19ec79af9368ada780d2

`docs/platform/work-state/spec.md#unheaded-block-37`
Unit SHA256: `f19a83a8922ba1a536d6698b742a5836d828f7acad56a6edc1ae4888bfc146f6`
Shown SHA256: `f19a83a8922ba1a536d6698b742a5836d828f7acad56a6edc1ae4888bfc146f6`

```text
**Ai chạy context-discovery, khi nào:** hai điểm gọi cùng một phép soi —
(a) lệnh `fgos discover <id>` (gọi tay/agent đang sống, dùng khi người submit
còn ở đó — mode `sync`), mang theo verdict của chính người gọi; (b) vòng tự
hành, MỖI lần chạy, quét TOÀN BỘ item đang ở stage `discovery` và status
`todo` — BẤT KỂ giá trị `mode` mang gì, TRƯỚC khi giao bất kỳ việc thi công
nào trong cùng lượt chạy đó (xem spec Runner). Vòng tự hành là lưới đỡ: dù
phiên sống (mode `sync`) không kịp gọi `discover` — chết giữa chừng, hay
người rời đi không dùng `--async` — lượt chạy kế tiếp vẫn tự quét, không item
nào kẹt vô hình; lượt quét cơ học đó không tự phán hộ mà để item nguyên tại
chỗ. `mode` chỉ là quy ước NGƯỜI-GỌI-NÀO-NÊN-LÀM-TRƯỚC, không phải điều kiện
mà code rẽ nhánh (RUL17 (mode là quy ước gọi, không phải điều kiện code)).
```

## claim_49bb6cdd091ecb02104435f6d1f1ab1b

`docs/platform/work-state/spec.md#unheaded-block-38`
Unit SHA256: `e2481ec8c127789704ae95a8a010c633b29d84225a8547df5151576390070fcb`
Shown SHA256: `e2481ec8c127789704ae95a8a010c633b29d84225a8547df5151576390070fcb`

```text
Mọi item RỜI `discovery` — dù đi thẳng (verdict đủ rõ) hay vòng qua
`exploring` (verdict chưa đủ rõ) — đều hẹn nhau ở `planning` trước khi thi
công: item đã qua kiểm chất lượng thông tin nhưng còn phải qua đúng một phép
phán chia-việc. Không có cạnh nào đi thẳng từ `discovery`/`exploring` sang
`executing`; `planning → executing` là lối vào duy nhất của bước thi công.
```

## claim_3c9b65402d8ece4ef57ad337ba5d9d72

`docs/platform/work-state/spec.md#unheaded-block-39`
Unit SHA256: `fadda0c2061d00de158fb62f8d16aba1e58002c1165e5b3d416be97331217f3e`
Shown SHA256: `fadda0c2061d00de158fb62f8d16aba1e58002c1165e5b3d416be97331217f3e`

```text
**`decompose` là bí danh di sản, CHỈ để tháo cạn (drain-only).** Stage này
từng là tên của chính bước lập-kế-hoạch và đã được đổi tên thành `planning`.
Cái tên cũ được GIỮ LẠI trong sổ đăng ký — cùng hai cạnh `exploring →
decompose` và `decompose → executing` — vì `stage` không nằm trong danh sách
trường sửa được, nên các item đang đỗ trên tên đó không thể gán nhãn lại và
sẽ mắc kẹt vĩnh viễn nếu tên bị gỡ. Nhưng KHÔNG item mới nào còn tới được đây:
`decompose` cố ý không mang mục step-mapping nào, nên phép tra "stage nào thỏa
bước Chia-việc" luôn trả về `planning`. Bí danh này biến mất khi số item còn
đỗ trên nó về 0 (lúc viết lại mục này: 5 item còn mở). Mọi điều mục này nói về
`planning` áp dụng nguyên vẹn cho một item còn đỗ ở `decompose`.
```

## claim_bad996bde68899169efd005c42d5b2f8

`docs/platform/work-state/spec.md#unheaded-block-40`
Unit SHA256: `b92d70625fb3063d776322ca266f01380490d9f9181509fb252a558059b1cbdf`
Shown SHA256: `b92d70625fb3063d776322ca266f01380490d9f9181509fb252a558059b1cbdf`

```text
Item vào stage `planning` đi qua **phán chia-việc**: xem item có cần tách
thành các việc con độc lập hay không. Cùng khuôn với context-discovery, phép
phán này KHÔNG còn tự gọi một phán-quan lồng bên trong — người gọi tự lập
luận rồi truyền verdict vào qua verb `plan`.
```

## claim_df443bb7a4340b2f4e011290268bcc5d

`docs/platform/work-state/spec.md#unheaded-block-41`
Unit SHA256: `6fd1889b01d12af05ea88205763f14af71126996f95ec74a66ed60f794fbd583`
Shown SHA256: `6fd1889b01d12af05ea88205763f14af71126996f95ec74a66ed60f794fbd583`

```text
- **Pass-through** (item đơn giản, hoặc không có gì để chia) — item chuyển
  thẳng `planning → executing`, GIỮ NGUYÊN `verify` đã gắn từ lúc rời
  `discovery`/`exploring` — không có bước gắn lại verify riêng ở đây.
- **Chia (decompose)** — phán sinh ra n ≥ 1 item con ĐỘC LẬP, mỗi con mang:
  field `parent` trỏ về item gốc (lineage — xem Data Dictionary #13), `deps`
  giữa các con nếu phán đề xuất (dùng nghĩa `deps` sẵn có, không phải trường
  mới), một `verify` THẬT — con thừa hưởng ngữ cảnh đã chốt của gốc và vào
  thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán
  chia-việc là nơi duy nhất sản xuất verify đó, không bao giờ để lại
  placeholder — và tùy
  chọn một `footprint` (cùng nghĩa `footprint` sẵn có ở trên, feed cố-vấn
  `fgos conflicts`) khi phán đề xuất đường-dẫn file con đó dự kiến chạm; phán
  không nêu, hoặc nêu sai hình dạng (không phải mảng chuỗi) → con đó ghi
  KHÔNG có `footprint` (vắng, không phải mảng rỗng), không bao giờ làm hỏng cả
  verdict chia. Sinh đủ con xong, gốc chuyển `planning → executing` ngay —
  gốc KHÔNG tự động `done`; nó chỉ dispatch-được khi mọi con đã `done` (xem bộ
  lọc frontier lineage dưới).
- **Cần người quyết (need-human)** — rơi vào cổng có điều kiện khi (a) phán
  tự báo mơ hồ không tách được rành mạch, hoặc (b) item gốc mang risk `heavy`
  (ngưỡng risk cao ánh xạ thẳng vào giá trị risk sẵn có từ classify). Item đậu
  `awaiting-human` (như mọi cổng chờ-người khác) mang một **đề xuất chia**
  (danh sách con + deps dự kiến) làm câu hỏi — CHƯA ghi con nào vào queue.
  Người trả lời xong, item về `todo` (vẫn ở stage `planning`), phán chia-việc
  chạy lại từ đầu ở lượt quét sau (không giữ lại đề xuất cũ, cùng khuôn lặp
  của context-discovery).
- **Verdict KHÔNG HỢP LỆ** — verdict chia sinh ra ít nhất một con THIẾU
  verify thật, hoặc người gọi không cung cấp được verdict nào đọc hiểu được:
  item ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không
  pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw, mẫu hệt
  context-discovery). Một lượt quét cơ học của vòng tự hành tới đây cũng dừng
  ở đúng chỗ đó thay vì đoán bừa một verdict.
```

## claim_f2c6496ee19b35da438259dc94874fe5

`docs/platform/work-state/spec.md#unheaded-block-42`
Unit SHA256: `86cba6c33b5a8fe95261ed07c3e670db494beb82c49fb80f0cb7cd32c6241e41`
Shown SHA256: `86cba6c33b5a8fe95261ed07c3e670db494beb82c49fb80f0cb7cd32c6241e41`

```text
**Ai chạy phán chia-việc, khi nào:** verb riêng `fgos plan <id>` (gọi
tay/phiên sống, mode `sync`) — TÁCH BẠCH khỏi `fgos discover`, vốn chỉ phục
vụ `discovery`/`exploring`: gọi nhầm verb cho một item ở stage sai bị từ chối
rõ lý do chứ không âm thầm dispatch chéo. Vòng tự hành cũng quét bước này mỗi
lượt chạy, NGAY SAU lượt quét soi-rõ và TRƯỚC khi giao việc thi công — cùng
lưới đỡ: dù phiên sống chết giữa chừng, lượt chạy kế tiếp vẫn tự quét, và khi
không có verdict nào được cung cấp thì để item nguyên tại chỗ.
```

## claim_a0103a2bab1b706ac2f2e7755abbc2f8

`docs/platform/work-state/spec.md#unheaded-block-43`
Unit SHA256: `86aefb98f6caa2bf4768e5d81ec4fdf67e88eb486cc2e7256ae196ac0204c16a`
Shown SHA256: `86aefb98f6caa2bf4768e5d81ec4fdf67e88eb486cc2e7256ae196ac0204c16a`

```text
**Lineage (`parent`) tách bạch khỏi `deps`:** `parent` trả lời "item này là
hậu duệ của gốc nào", `deps` trả lời "việc nào phải xong trước việc này" —
hai quan hệ không bao giờ trộn; con của một lần chia-việc TUYỆT ĐỐI KHÔNG bao
giờ được ghi vào `deps` của gốc. Bộ lọc frontier (tập việc sẵn-sàng) chặn một
item gốc khi bất kỳ hậu duệ nào của nó (dẫn xuất qua chuỗi `parent`, đệ quy
xuống mọi tầng) chưa `done` — chặn này DẪN XUẤT thuần từ `parent`, không thêm
cơ chế mới, không đụng `deps`. Khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt
frontier ở lượt kế tiếp như một item thường: KHÔNG có bước "đóng bộ" ghi
riêng — `verify` của chính gốc (mang từ lúc rời `discovery`/`exploring`) đóng
vai trò phép kiểm tích hợp cho toàn bộ hậu duệ, và gốc đi hết đường thường
`todo → doing → awaiting-approval → delivered → retrospective → cleanup →
done` như mọi item khác (xem Data Dictionary #4). Một con bị `blocked`
hoặc đỗ giữa chừng không sinh ra một trạng thái "bộ khẩn" riêng — nó dùng
đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn
dispatch cho tới khi con đó (và mọi hậu duệ khác) thật sự `done`.
```

## claim_b7ddd5d8383b1e61064eaafd709c4a50

`docs/platform/work-state/spec.md#unheaded-block-44`
Unit SHA256: `ffb0d2ad1ac7bdf66ed226440e16fe3dc0e2d6b5963d808d9bcc47da39690ad0`
Shown SHA256: `ffb0d2ad1ac7bdf66ed226440e16fe3dc0e2d6b5963d808d9bcc47da39690ad0`

```text
Item được tạo trước tính năng chia-việc, hoặc tạo qua `add`, không mang
`parent` — vắng mặt hoàn toàn, không lọt vào bộ lọc lineage (tương thích
ngược, RUL11 (tiến hóa schema)).
```

## claim_46f0065b4163d2805bc161c9dcce52d3

`docs/platform/work-state/spec.md#unheaded-block-45`
Unit SHA256: `feed8c8b2f035f912247b8dfe19899b63332ce0e071eeac988ea9880223fc98a`
Shown SHA256: `feed8c8b2f035f912247b8dfe19899b63332ce0e071eeac988ea9880223fc98a`

```text
Song song với `stage` (chuỗi sống của coding: `discovery`/`exploring`/
`planning`/`executing`, xem hai mục trên), mỗi item còn thuộc về một
**domain** — chiều thứ ba, trả lời "bộ stage nào áp dụng cho item này". Một
domain khai: (a) danh sách stage có thứ tự của nó, (b) mỗi stage đó thỏa bước
nào trong 5 bước của chu trình nền base-workflow (Init/Làm-rõ/Chia-việc/
Thực-thi/Compound-learning — `work-item-lifecycle-vision.md` §2), (c) cạnh
chuyển-stage hợp lệ (`{from,to}`) riêng của domain đó, và (d) skill hướng dẫn
(nếu có) ứng với mỗi stage của nó — `null` nghĩa là "không skill, thi công
máy móc thuần" (str89-fgos-domain-skills). Từ khi vòng đời mọc thêm
phần đuôi sau merge, một domain còn khai thêm ba thứ NGOÀI chiều `stage`:
(e) `worktreeBacked` — item của domain này có đi qua worktree/merge git thật
hay không, (f) nhãn phạm-trù cho từng status ĐẦU chuỗi của nó, để một bên đọc
không-biết-domain vẫn phân loại được "việc này đi tới đâu rồi", và (g) bộ giá
trị `kind`/`risk` hợp lệ khi khai việc. Bảng chuyển-status (`fsm.mjs`) vẫn
KHÔNG BAO GIỜ thuộc về domain — domain được quyền ĐẶT NHÃN cho status, không
được quyền đổi cạnh.
```

## claim_67db9bc38662d29c2e9ff68761b18a8b

`docs/platform/work-state/spec.md#unheaded-block-46`
Unit SHA256: `ff1cf9a54d7cc40a4006675ccdb21f00fe1240264e956c4c6d92c66d3883cda6`
Shown SHA256: `ff1cf9a54d7cc40a4006675ccdb21f00fe1240264e956c4c6d92c66d3883cda6`

```text
Hôm nay sổ đăng ký có **bốn** domain. `coding` là domain sản xuất thật duy
nhất (xem hai mục trên). Ba domain còn lại đều là fixture minh họa, dùng
một lần, KHÔNG phải sản phẩm marketing/HR/tài-chính thật — mỗi cái đóng đúng
một khoảng trống chứng minh:
```

## claim_8b2a201de5bd2a6ced057b82448cd4e4

`docs/platform/work-state/spec.md#unheaded-block-47`
Unit SHA256: `bce9d9e284ba2841c098c5258894d6fdc1a4b5eb2885630d586f146ae0bd3ae1`
Shown SHA256: `bce9d9e284ba2841c098c5258894d6fdc1a4b5eb2885630d586f146ae0bd3ae1`

```text
- `synthetic` — đúng một stage (`assembling`), chỉ thỏa bước Thực-thi, không
  cạnh chuyển-stage nào (một stage thì không có gì để chuyển): chứng minh mô
  hình chạy được với một domain KHÁC coding.
- `triage` — ba stage mang tên KHÔNG trùng chữ nào với coding
  (`triage`/`shaping`/`assembling`), thỏa lần lượt Làm-rõ/Chia-việc/Thực-thi:
  chứng minh một domain đi qua được các bước đó dưới tên riêng, để mọi lần
  quay lại hard-code tên stage của coding vỡ to thay vì lặng lẽ qua.
- `fixture-marketing` — mượn nguyên hình dạng stage của coding nhưng khai bộ
  nhãn status của RIÊNG nó và một skill tổng-hợp riêng: chứng minh phần khai
  báo per-domain ở (f)/(d) thật sự được đọc từ bảng của chính domain đó, chứ
  không âm thầm rơi về bảng của `coding`.
```

## claim_9b38fd09b00c8c222e85b72c3f2164e9

`docs/platform/work-state/spec.md#unheaded-block-48`
Unit SHA256: `b4fd3392f55abbeae560ec53ebb763fdf048ff1c40e2f856e0750dc935c6fc8a`
Shown SHA256: `b4fd3392f55abbeae560ec53ebb763fdf048ff1c40e2f856e0750dc935c6fc8a`

```text
Cả bốn dispatch qua đúng MỘT sổ đăng ký chung và đúng MỘT đường thi công
(vòng tự hành/CLI) — chứng minh trực tiếp acceptance criterion "domain thứ
hai chạy trên cùng base FSM, chỉ thêm stage riêng, không fork chu trình"
(backlog STR18). Một domain sản xuất thật thứ hai vẫn chưa có (xem Open Gaps).
```

## claim_bf62a66b9daca27c42610e35d4dc1b06

`docs/platform/work-state/spec.md#unheaded-block-49`
Unit SHA256: `2c3f5010803fe3d713f8b30038cc78b81ba34cc5f33b32247d528140d6baa436`
Shown SHA256: `2c3f5010803fe3d713f8b30038cc78b81ba34cc5f33b32247d528140d6baa436`

```text
**`compound-learn` KHÔNG còn là một stage.** Nó từng là stage thứ tư của
`coding`, chèn sau `executing`, giữ chỗ cho bước Compound-learning. Bước tổng
hợp/học sau-thi-công vẫn còn nguyên và vẫn quan sát-được — nhưng nay nằm trên
chiều `status` chứ không phải `stage`: status `retrospective`, một chặng thật
giữa `delivered` và `cleanup` mà mọi item đều đi qua (xem Data Dictionary #4).
Đổi trục như vậy vì phần đuôi sau merge vốn không còn "loại tác vụ" nào để
`stage` phân biệt — chỉ còn "đang ở đâu", đúng câu hỏi `status` trả lời.
```

## claim_e59f200bba81fad12adfb8f4429a59e5

`docs/platform/work-state/spec.md#unheaded-block-50`
Unit SHA256: `80c14ec598a82f09f8da9596853c9e1c2fef1759c97869fc7cbbf2f2a19be6fe`
Shown SHA256: `80c14ec598a82f09f8da9596853c9e1c2fef1759c97869fc7cbbf2f2a19be6fe`

```text
Từ str89-fgos-domain-skills, lớp hướng dẫn (P50, xem spec Runner) không còn
giả định ngầm domain `coding`: nó đọc trường `domain` của item rồi tra đúng
sổ đăng ký này để biết skill nào ứng với mỗi stage, thay vì một bảng
skill/stage hard-code cố định. Với `coding` hôm nay: `discovery` →
`fgos-coding-discovering`, `exploring` → `fgos-coding-exploring`, `planning` →
`fgos-coding-planning` (mặc định điểm-vào; phán shaping/proving giữa
`fgos-coding-planning`/`fgos-coding-validating` vẫn là xét-đoán phía phiên của
entry skill, không phải một mục sổ đăng ký thứ hai — `fgos-coding-validating`
KHÔNG có mục riêng nào ở đây, nó chạy như pha thứ hai của chính
`fgos-coding-planning`), `executing` → `fgos-coding-implement`. Bí danh di sản
`decompose` trỏ về CÙNG skill mà `planning` trỏ tới, để một item còn đỗ trên
tên cũ vẫn tra ra một skill có thật.
```

## claim_8d69a0b72228344f45a35e8197ee48ff

`docs/platform/work-state/spec.md#unheaded-block-51`
Unit SHA256: `b0d658bc1e1493990ff4c2e5d0a83aaa694a76a63c1ba805de687ac544446484`
Shown SHA256: `b0d658bc1e1493990ff4c2e5d0a83aaa694a76a63c1ba805de687ac544446484`

```text
Cùng BẢNG ĐÓ còn mang thêm một khóa không phải tên stage: **`retrospective`**
— một tên `status` — trỏ tới `fgos-coding-compounding`, skill tổng hợp
sau-thi-công. Hai bộ từ vựng không bao giờ đụng nhau (không stage nào của
coding tên `retrospective`), và "khóa này thuộc bảng tra nào" là việc của bên
gọi, không phải của bảng. `cleanup` cố ý KHÔNG có mục nào: nó là harness
thuần, không skill nào từng nạp cho nó.
```

## claim_ee3dda56ccb53db87ee1c4f1bd5711c2

`docs/platform/work-state/spec.md#unheaded-block-52`
Unit SHA256: `621c91d31cc07f4e090993c8b83d5b3fdd1f76796fc8c4c066faccfc6b456aee`
Shown SHA256: `621c91d31cc07f4e090993c8b83d5b3fdd1f76796fc8c4c066faccfc6b456aee`

```text
**Một domain không bắt buộc thỏa cả 5 bước base-workflow — và việc THIẾU một
bước có hệ quả vận hành thật, không chỉ là khai báo suông (R-domain-1, per
1cd895e1/38160a70).** Nếu một domain không có stage nào thỏa bước Làm-rõ,
item của nó KHÔNG BAO GIỜ được quét vào context-discovery dù đang ở vòng tự
hành — tương tự cho Chia-việc và phán chia-việc. Đây là chủ đích, không phải
khiếm khuyết: một domain không map bước nào tới đó thì item của nó không bao
giờ chạm hai bộ máy này — an toàn, nhưng cũng có nghĩa domain đó KHÔNG dùng
được context-discovery/chia-việc, dù muốn.
```

## claim_e4cb37d2449151921a43b11099e448d8

`docs/platform/work-state/spec.md#unheaded-block-53`
Unit SHA256: `ad648524d48fcbd3683cb44c82929a1787b813d7101548813fbd89440e034d7a`
Shown SHA256: `ad648524d48fcbd3683cb44c82929a1787b813d7101548813fbd89440e034d7a`

```text
Giới hạn này đã HẸP LẠI một bậc so với lúc luật được ghi. Hai bộ máy đó
không còn cố định theo tên stage của `coding` nữa: chúng hỏi sổ đăng ký "stage
nào của domain NÀY thỏa bước Làm-rõ / Chia-việc" rồi dùng đúng tên trả về, nên
một domain khai các bước đó dưới tên riêng (vd `triage` với
`triage`/`shaping`) đi qua được thật. Điều còn lại đúng nguyên văn là mệnh đề
mở đầu: KHÔNG khai bước nào thì không bao giờ chạm bộ máy nào — cái quyết định
là step-mapping, không còn là tên stage.
```

## claim_014119579acfa0eb94598e780a915d8c

`docs/platform/work-state/spec.md#unheaded-block-54`
Unit SHA256: `fcc3b5bc63c02eeb3180877c80fe6e2d2bb620cb2ffd41bd865d2f9624bac9a0`
Shown SHA256: `fcc3b5bc63c02eeb3180877c80fe6e2d2bb620cb2ffd41bd865d2f9624bac9a0`

```text
Item KHÔNG mang trường `domain` đọc ra `coding` — mặc định lazy, cùng khuôn
mặc định lazy của `stage`; `add`/`submit` đều nhận `--domain <tên>` tùy chọn, mặc định
`coding` khi không truyền (xem "Khai việc"/"Nộp vấn đề tự do" dưới). Một giá
trị `domain` không nhận diện được tới điểm đọc nóng của vòng dispatch (bộ lọc
frontier, vòng tự hành, bảng chuyển-stage) KHÔNG BAO GIỜ làm vỡ đường đó: cả
ba rơi về `coding` kèm một cảnh báo, không throw — khác với lúc KHAI
(`validateWork`), nơi một giá trị `--domain` hoặc `stage` không hợp lệ với
domain của item vẫn bị từ chối `validation` như trước (có chủ đích: một bên
là đường nóng không được vỡ, một bên là cửa khai chỉ chạy một lần, sai thì
báo ngay).
```

## claim_1f9fb4feceda8f5bf6a18b151ce0a397

`docs/platform/work-state/spec.md#unheaded-block-55`
Unit SHA256: `4b215c2fd35cfdf4e6786cf9adbb44f0e1bbb55662a39329bc271641ef99f6b0`
Shown SHA256: `4b215c2fd35cfdf4e6786cf9adbb44f0e1bbb55662a39329bc271641ef99f6b0`

```text
Song song với vòng tự hành (runner tự dispatch việc — xem spec Runner), một
**cửa pull** đơn giản cho phép một tác nhân NGOÀI runner — người vận hành,
một phiên đang sống, hay một runner thứ hai — cầm đúng một item và tự trả
kết quả, không qua bất kỳ tiến trình điều phối nào đứng giữa (không
registry/heartbeat/push/lease — tầng đó, khi cần, đắp sau trên cùng nhật ký,
xem Open Gaps). Tập item cửa pull mở ra là ĐÚNG tập frontier mà runner tự
dispatch (`fgos ready`) — cửa pull không mở một tập riêng.
```

## claim_0e35589bb843343df25b1e6ea065818c

`docs/platform/work-state/spec.md#unheaded-block-56`
Unit SHA256: `e56d40369e1c3ef2d969b256915fe94a2512432214a4c1f6eb8b84cf8adb8d01`
Shown SHA256: `e56d40369e1c3ef2d969b256915fe94a2512432214a4c1f6eb8b84cf8adb8d01`

```text
- **`fgos take [--id <id>] [--role human|session]`** (mặc định `human`) —
  cầm đúng một item: không truyền `--id` thì cầm đầu frontier; truyền
  `--id` thì item đó phải ở `status: 'todo'` nếu còn là status đó (một id đã bị
  cầm/đỗ/kẹt rơi thẳng xuống kỳ vọng (CAS) của pre-claim status, báo `conflict`
  thật (mã 3), không phải một thông điệp tùy biến trùng lặp). Claim nhận một bản
  ghi claim runtime (`.fgos/runtime/claims/<id>.json`, gitignored) qua `claimWork`/
  `acquireClaim`. **Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện**
  (*new claims do not durably write into doing*); trạng thái bền (**durable status**)
  giữ nguyên giá trị pre-claim (`todo`, hoặc `blocked` đối với đường tái claim nguồn-nhánh),
  còn `doing` là trạng thái hiệu lực (**effective status**) do lớp phủ runtime (`buildEffectiveView`)
  dẫn xuất: `effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item)` khi claim đang hoạt động.
  (Nếu một claim bị stale — `preClaimStatus` không còn khớp trạng thái bền hiện tại — `buildEffectiveView`
  bỏ qua claim đó và giữ nguyên trạng thái bền). Bản ghi claim lưu `role` (người cầm), `headAtTake`
  (HEAD hiện tại của host repo, hoặc `branchHeadAtTake` cho nguồn-nhánh), `preClaimStatus` và `preClaimRevision`.
  **Lưu ý (claim-lock):** `take` kiểm frontier nếu item còn `todo` (frontier = executing-stage items), nhưng `pick --id` không
  — `pick` mở cửa claim cho item đang ở `discovery`/`exploring`/`planning` cũng được (status chỉ là
  một trục độc lập từ stage, fsm.mjs; frontier-guard là một hard-check tại tầng verb, không phải luật FSM).
- **`fgos return <id> [--timeout <ms>]`** — trả kết quả, KHÔNG BAO GIỜ tin
  lời người gọi: verb tự đo đủ ba điều kiện, mirror TRUNG THỰC contract
  `awaiting-approval` của chính runner — (a) working tree của host repo phải SẠCH
  (mọi việc đã commit, loại trừ `.fgos/` — store sống tự mutate bởi chính
  take/return/approve nên không bao giờ tính là bẩn), (b) HEAD phải tiến so `headAtTake` (tiến bộ THẬT,
  không phải commit rỗng hay chưa commit gì), (c) verb TỰ CHẠY `verify`
  thật của item (goal-check — cùng một hàm runner dùng, xem spec Runner)
  tại HEAD đó, ngay trong thư mục làm việc hiện hành. Thiếu (a) hoặc (b) →
  từ chối `validation` (mã 4), item giữ nguyên trạng thái hiệu lực `doing`, KHÔNG ghi sự kiện
  nào. Settlement (`settleClaim`) chuyển THẲNG từ `preClaimStatus` ghi trên claim sang `finalStatus`
  ngay trong cùng giao dịch: Verify xanh → `settleClaim` chuyển bền từ `preClaimStatus → awaiting-approval`
  (không qua trạng thái trung gian bền `doing`) + nửa THỰC TẾ của outcome + giải phóng claim file (KHÔNG
  sinh settlement ở đây — settlement thuộc cạnh `→done`, xem "Bài học lúc đóng" trên; nếu `finalStatus === preClaimStatus`,
  `settleClaim` chỉ ghi `work.attempt` mà không ghi `work.move` bền nào). Verify đỏ → `settleClaim`
  chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` —
  mirror đúng đường đỗ của runner.
```

## claim_9847c9fdad76165c7d3f3d9e30791a78

`docs/platform/work-state/spec.md#unheaded-block-57`
Unit SHA256: `b6f12056369ca7e5650f2f58f585a9df16b8b6a1c04e7b237beda6f36667ab45`
Shown SHA256: `b6f12056369ca7e5650f2f58f585a9df16b8b6a1c04e7b237beda6f36667ab45`

```text
`return` chỉ hoàn tất một `take`: một item có trạng thái hiệu lực `doing` nhưng KHÔNG mang
`claimRole` là `human`/`session` (nghĩa là claim của chính runner, hoặc một
claim di sản không role) bị `return` từ chối `validation` — cửa pull không
bao giờ đụng vào claim của runner.
```

## claim_b94f2db838b056a5bbfb4130f0751f92

`docs/platform/work-state/spec.md#unheaded-block-58`
Unit SHA256: `169457cec66b3a789d636951cf5ce82ee55e64668f0c1355eae9047b67ba22a1`
Shown SHA256: `169457cec66b3a789d636951cf5ce82ee55e64668f0c1355eae9047b67ba22a1`

```text
Một item `blocked` mang một nhánh đề xuất còn sống (`fgw/<id>` — vd bị đỗ do
chạm trần chống-lặp, xem spec Runner RUL29 (cạnh awaiting-approval→blocked — gate duyệt gãy)) cũng đi qua CÙNG hai verb `take`/
`return` ở trên, không phải verb riêng — chỉ khác Ở NGUỒN được ghi lại:
```

## claim_1fa248ea8d619ac37ba167d58a2ac198

`docs/platform/work-state/spec.md#unheaded-block-59`
Unit SHA256: `6bdca3cb587dc58cb5388b2a2e34d9298183b50b61f7a2267033853fc6c68528`
Shown SHA256: `6bdca3cb587dc58cb5388b2a2e34d9298183b50b61f7a2267033853fc6c68528`

```text
- **`take`** trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua
  bản ghi runtime claim mang `preClaimStatus: 'blocked'`, trạng thái bền giữ `blocked`,
  trạng thái hiệu lực hiện `doing`, ghi **`branchHeadAtTake`**
  — HEAD của CHÍNH NHÁNH lúc take, KHÔNG phải HEAD của host repo — thay vì
  `headAtTake`. `branchHeadAtTake` là discriminator DUY NHẤT phân biệt một
  claim nguồn-nhánh với một claim main-based ở bước `return`; nguồn không
  được suy ra từ việc nhánh có tồn tại hay không tại thời điểm return (nhánh
  có thể tồn tại vì lý do khác, xem spec Runner "Cổng duyệt PR nội bộ" —
  phân loại nguồn `runner`/`pull`/`legacy` của cổng duyệt).
- Người commit thêm việc lên NHÁNH (không đụng cây làm việc chính của host
  repo).
- **`return`** kiểm `item.branchHeadAtTake` TRƯỚC ba điều kiện main-based ở
  trên — một claim nguồn-nhánh không mang `headAtTake` nên kiểm main trước
  sẽ từ chối oan. Đo: nhánh phải có commit MỚI kể từ `branchHeadAtTake`, và
  verify của item phải chạy XANH — nhưng chạy trong một **worktree tạm,
  DETACHED tại đúng SHA của nhánh** (không bao giờ checkout theo tên nhánh,
  không dùng cơ chế đòi-lại-worktree-mồ-côi của runner) — cây làm việc chính
  của người đứng KHÔNG BAO GIỜ bị đọc hay đụng tới, kể cả khi người đang
  đứng trên chính nhánh đó ở một worktree khác. Worktree tạm luôn được dọn
  sau khi đo xong, thành công hay thất bại như nhau. Sạch + xanh →
  `settleClaim` chuyển bền từ `preClaimStatus` (`blocked`) sang `awaiting-approval` mang **`branchHeadAtReturn`** (HEAD nhánh tại lúc đo) —
  **TUYỆT ĐỐI không ghi `headAtReturn`** (trộn hai marker cho `reviewDiff`
  của cổng duyệt một dải vô nghĩa). Không có commit mới, hoặc verify đỏ →
  từ chối rõ lý do (nguồn-nhánh: `verify-fail` + friction lớp
  `verification`), item giữ nguyên trạng thái hiệu lực `doing`, nhánh không đổi tip.
- Một đề xuất hoàn tất theo đường này đọc nguồn là `runner` ở cổng duyệt như
  bình thường (nhánh `fgw/<id>` còn sống) — không cần thay đổi cách phân
  loại nguồn của cổng duyệt.
```

## claim_2d40db0a3a51d53c2dcaca6f0e220760

`docs/platform/work-state/spec.md#unheaded-block-60`
Unit SHA256: `bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c`
Shown SHA256: `bf1d6f189051b2a329a87fe64f1be27ea4faec22215c94b6606481ebae6ba06c`

```text
Subsections: Registry Projection And Registration Standard, Tool Registry Verbs.
```

## claim_0a83ced96883ef59cd244432b112e8e0

`docs/platform/work-state/spec.md#unheaded-block-61`
Unit SHA256: `acb4c4f353694a4680b5527ac1a9d33e984465f985bbb03fb727426ef11b671a`
Shown SHA256: `acb4c4f353694a4680b5527ac1a9d33e984465f985bbb03fb727426ef11b671a`

```text
Cổng vào cho một mảnh distillery đã porting (tsk-1dj, ported từ
repository-harness's tool-registry-capability — xem
`docs/distillery/deep-dives/tool-registry.md`): một registry hai chiều —
project **đăng ký** công cụ (tool) nào phục vụ **capability** (nhãn tự do,
chuẩn hóa kebab-case) nào, rồi bất kỳ bước nào cần capability đó **hỏi**
registry thay vì hardcode tên tool cụ thể ("core consults capabilities,
never tools" — US-027, ported nguyên vẹn).
```

## claim_f2acbed2b90672c85fff9d012696292e

`docs/platform/work-state/spec.md#unheaded-block-62`
Unit SHA256: `19368a15d5d1a609f1138d1fe8c79a53a1f555576c365a30087b4a1c4724be4e`
Shown SHA256: `19368a15d5d1a609f1138d1fe8c79a53a1f555576c365a30087b4a1c4724be4e`

```text
- `view.tools` (bản chiếu, gộp từ hai sự kiện mới `tool.register`/
  `tool.remove` cùng cơ chế fold sẵn có — không store riêng, không schema
  SQL riêng): `{ [name]: { name, kind, capability, command, scanTarget?,
  responsibility?, description? } }`. `kind` ∈ `cli|binary|mcp|skill|http`
  — quyết định `tool check` probe bằng cách nào (PATH cho cli/binary; quét
  `scanTarget` trên đĩa cho mcp/skill — hai kind này vốn không nằm trên
  PATH; TCP probe ngắn cho http). `capability` LUÔN chuẩn hóa kebab-case
  lúc `register` (nhiều cách viết cùng gộp về một chuỗi).
- **`register`/`remove` là quyết định TEAM** — qua `.fgos/events.jsonl`
  như mọi sự kiện khác, cùng cửa ghi CTR002, `view.tools` fold y hệt
  `view.work` fold từ `work.add`/`work.move`.
- **`check`'s kết quả (`status`, `checkedAt`) là SỰ THẬT VỀ MÁY NÀY, không
  phải quyết định team** — KHÔNG qua event-log. Ghi vào một file cục bộ
  gitignored riêng, `.fgos/tool-status.local.json` (đặt cạnh
  `events.jsonl`, không phải trong nó) — cùng tinh thần "trạng thái máy
  này tách khỏi cấu hình được chia sẻ" mà `.fgos/sessions.json`/
  `.fgos/*.lock` đã theo trong `.gitignore`. `tool check` LUÔN thoát mã 0
  — thiếu tool là một sự thật cần báo cáo, không phải lỗi CLI ("absent
  capability = clean skip, never a failure" — nguyên tắc lõi item này
  port qua).
- **Đọc gộp lúc `query`:** `view.tools` (đăng ký) overlay file cục bộ
  (trạng thái máy này). Một tool đã đăng ký nhưng CHƯA từng `check` trên
  máy này đọc là `unknown` — KHÔNG BAO GIỜ là `missing` (`missing` nghĩa
  là đã probe và không thấy). Đây là phân biệt cốt lõi của US-027: "chưa
  đăng ký" (vô hại, `inactive`) khác hẳn "đăng ký rồi mà probe ra
  missing/unknown" (gap thật, `degraded`).
```

## claim_532e71f63794eeefb103c30c8390da06

`docs/platform/work-state/spec.md#unheaded-block-63`
Unit SHA256: `2b77791d889b05af4bf68e9d0af5f3a70ac232324ffd3e5290b5df0eb734f8af`
Shown SHA256: `2b77791d889b05af4bf68e9d0af5f3a70ac232324ffd3e5290b5df0eb734f8af`

```text
- **Runs when:** người/agent gọi `fgos tool <register|check|query|remove>
  ...`.
- **Blocked when:** `register` — thiếu `--name`/`--kind`/`--capability`/
  `--command`, `--kind` ngoài `cli|binary|mcp|skill|http`, `--capability`
  chuẩn hóa ra rỗng, hoặc `--kind mcp|skill` thiếu `--scan` (hai kind này
  không nằm trên PATH) — tất cả `validation`; `--name` đã tồn tại —
  `validation`. `remove` — `--name` chưa từng đăng ký — `validation`.
  `check --name x` — `x` chưa đăng ký — `validation`. `check`/`query`
  không có điều kiện chặn nào khác — `check` LUÔN thoát 0 kể cả khi mọi
  tool được probe đều `missing`.
- **What changes:** `register` — một sự kiện `tool.register` (bản ghi ĐẦY
  ĐỦ, ghi đè theo `name` — không có `tool.edit`, đăng ký lại một `name` đã
  gỡ là một `tool.register` mới, sạch). `remove` — một sự kiện
  `tool.remove` (xóa hẳn key khỏi `view.tools`, không phải tombstone).
  `check` — KHÔNG sự kiện nào; ghi đè các entry được probe trong
  `.fgos/tool-status.local.json` (entry của tool không nằm trong lượt
  probe này, vd gọi kèm `--name`, giữ nguyên). `query` — không gì, đọc
  thuần.
- **Side effects:** `check` gọi `command -v`-tương-đương qua PATH thật
  (cli/binary) hoặc mở một kết nối TCP ngắn thật (http) — không mock.
- **Afterwards:** `query --capability X [--status present]` trả về TẬP
  provider (nhiều tool cùng phục vụ một capability, bổ sung lẫn nhau —
  không loại trừ), mỗi provider kèm `status` đã gộp overlay cục bộ. Bất kỳ
  bước nào (skill/AGENTS.md của một project khác) muốn "hỏi trước khi làm
  X" tự chèn câu gọi `query` vào đúng chỗ cần — injection là hợp đồng văn
  xuôi (prose contract), KHÔNG có hook cấu trúc nào tự động gọi `query` hộ
  (phát hiện cốt lõi của deep-dive: ngay cả repository-harness, nơi sinh
  ra cơ chế này, cũng không tự động hóa bước đó).
```

## claim_acab595482e4f9f7ae05e21a1a28f11b

`docs/platform/work-state/spec.md#unheaded-block-64`
Unit SHA256: `6507aee6bfe4534417362ff8fbb85c58f51a633e49c81ef69ea29c75effb773a`
Shown SHA256: `6507aee6bfe4534417362ff8fbb85c58f51a633e49c81ef69ea29c75effb773a`

```text
- **Runs when:** người/agent gọi `fgos init` tại thư mục làm việc — bước đầu
  tiên trước khi bất kỳ verb nào khác dùng được kho work-state.
- **Blocked when:** không có điều kiện chặn — `init` luôn thành công bất kể
  phát hiện gì (per install-coexistence / f1715488).
- **What changes:** tạo `.fgos/` rỗng (nhật ký rỗng + bản chiếu rỗng) tại cwd
  nếu chưa có; quét READ-ONLY project tìm marker của harness agent khác đã có
  mặt (thư mục dấu ấn — `.bee/`, `.claude/`, `.codex/`, `.cursor/` là tập khởi
  đầu, mở rộng được — và khối managed trong `AGENTS.md` của host nếu file đó
  tồn tại); ghi kết quả phát hiện vào `.fgos/coexistence.json` (manifest v1:
  `territory` {data, worktrees {descriptor, resolved}, branches} +
  `detected_harnesses`), và in ra output những gì phát hiện được.
- Cộng thêm, phi-chặn: `init` còn tự kiểm project directory có phải một repo
  git với HEAD resolve được hay không (`git rev-parse --verify --quiet HEAD`,
  bọc try/catch fail-safe — git vắng mặt hay repo chưa có commit nào đều rơi
  cùng một nhánh, không phân biệt); khi KHÔNG resolve được, kết quả trả về
  mang thêm trường `gitHeadless: true` — một trường dữ liệu cộng-thêm trên
  phong bì `fgos.v1` sẵn có, không banner riêng, không đổi mã thoát, không
  chặn `init` (per D ecfd0d1a). Repo có ≥1 commit: không mang trường này
  (vắng mặt, không phải `false`) — hành vi/hình dạng output không đổi cho case
  đã có từ trước.
- **Side effects:** không ghi/sửa/xóa bất kỳ file nào thuộc harness khác —
  host không có `AGENTS.md` thì `init` bỏ qua bước đó, không tự tạo.
  Lỗi đọc một marker (vd `AGENTS.md` hỏng quyền) không chặn `init` — ghi nhận
  lỗi vào manifest, `init` vẫn thành công (fail-safe).
- **Afterwards:** re-init trên cùng project ghi lại manifest nhất quán
  (idempotent — không tích lũy/trùng lặp entry qua nhiều lần chạy). Doctrine
  đầy đủ (lãnh địa, một-nhạc-trưởng-mỗi-phiên, Known Gaps): `docs/coexistence.md`.
```

## claim_567bf1ddf315b3a08029eb28ac4ee2e2

`docs/platform/work-state/spec.md#unheaded-block-65`
Unit SHA256: `91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445`
Shown SHA256: `91c2e63acc8563a92edc6d06d6634a299a3120b6682db0bf3e3fd289b6987445`

```text
`add` không còn là cửa vào của câu chuyện public (đó là `submit`, per stage-intake) — vẫn hoạt động nguyên vẹn cho test/tooling nội bộ, đòi người
gọi điền đủ các cờ bắt buộc `--title`, `--description`, `--kind`, `--risk` và `--verify`; `--id` tùy chọn, khi vắng thì `generateId`
sinh id `tsk-<hash>` chống trùng từ title, khác UX "nộp rồi đi" của `submit`. **Đã quyết (STR22, per work-item-verb-surface): giữ `add`
làm bề mặt nội bộ, không xóa** — bộ test hiện dùng `add` để tự điền id/field
trực tiếp trong nhiều file tiếp tục dùng nguyên trạng (ví dụ `test/cli/fgos-intake-7.test.mjs` và `test/e2e/pr-gate.test.mjs`); tài liệu/spec không giới thiệu
`add` như một cửa vào public ở bất kỳ đâu khác.
```

## claim_08d4f1dad88d106e00b55ef0d5a35f82

`docs/platform/work-state/spec.md#unheaded-block-66`
Unit SHA256: `dd49a6c2fced83cebc38d9acb4a40dc3954a7776b9c56c825e3fc71c95407fd6`
Shown SHA256: `dd49a6c2fced83cebc38d9acb4a40dc3954a7776b9c56c825e3fc71c95407fd6`

```text
- **Blocked when:** thiếu trường bắt buộc, id sai dạng kebab-case, id trùng, dep trỏ id không tồn tại, `--domain` không khớp domain nào trong sổ đăng ký — tất cả trả phạm trù `validation` (mã 4), KHÔNG sự kiện nào được ghi.
- **What changes:** một sự kiện khai-item vào nhật ký, item xuất hiện trong bản chiếu ở `todo`.
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding` (mặc
    định lazy). `add` KHÔNG truyền `--stage` — vắng mặt `stage` tự đọc ra
    stage thỏa bước Thực-thi của domain đó (per "Mô hình domain" trên), nên
    một item `add --domain synthetic` (domain chỉ có một stage, thỏa Thực-thi)
    sẵn sàng dispatch ngay, không cần qua context-discovery/chia-việc.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'` (mảng `{text,evidence}`,
    Data Dictionary #24); giá trị hỏng dạng (không parse được, không phải
    mảng, một clause thiếu/rỗng `text`) bị chặn ở `validation` (mã 4) trước
    khi merge, cùng khuôn mọi trường khác của `add`; vắng cờ thì
    `item.acceptance` vắng mặt hoàn toàn, không mặc định mảng rỗng (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)).
- **Side effects:** không.
- **Afterwards:** người/agent thấy item trong `list`; clone khác thấy sau khi nhận commit chứa nhật ký.
```

## claim_7c4295aa058b6a7fa5c6b945a0441a35

`docs/platform/work-state/spec.md#unheaded-block-67`
Unit SHA256: `0cee9be267f694d7ef523f3c96e35b1837c9d6bd8f4eb275770357dab32a2cdf`
Shown SHA256: `0cee9be267f694d7ef523f3c96e35b1837c9d6bd8f4eb275770357dab32a2cdf`

```text
- **Runs when:** người/agent gọi `fgos submit "<mô tả>" [--async|--unattended] [--domain <tên>] [--deps <id1,id2,...>] [--tier <bậc>] [--kind <loại>] [--risk <mức>]` —
  song song với `add`, không thay thế; dùng khi người submit không muốn/không
  thể tự điền các trường tách rời của `add`.
- **Blocked when:** thiếu mô tả (không truyền văn bản nào) — `validation` (mã
  4), KHÔNG sự kiện nào được ghi; `--deps` trỏ một id không tồn tại —
  `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, KHÔNG sự kiện nào được
  ghi. Không có điều kiện chặn nào khác — mọi mô tả không khớp từ khóa phân
  loại nào vẫn tạo item thành công (rơi về mặc định an toàn), đúng tinh thần
  "không bao giờ chặn vì không đoán được loại".
- **What changes:** một sự kiện khai-item (đúng loại `work.add` như `add`,
  không phải sự kiện mới) vào nhật ký. Các trường được suy tự động từ mô tả:
  - **title** — câu/dòng đầu tiên của mô tả, hoặc một đoạn cắt gọn nếu mô tả
    không có ranh giới câu tự nhiên.
  - **id** — sinh từ title, kèm hậu tố chống trùng; nếu trùng với id đã có
    (hai mô tả tương tự nhau), tự thử lại với hậu tố khác cho tới khi ra một
    id chưa dùng.
  - **tier, kind, risk** — mặc định suy bằng cách đếm các từ khóa rủi ro/loại-việc
    xuất hiện trong mô tả (quy tắc cơ học, không dùng model/AI) — không khớp
    từ khóa nào thì `tier`/`risk` về mặc định `standard`, `kind` về mặc định
    `task`. Ba cờ tùy chọn `--tier`/`--kind`/`--risk` (str51-llm-assist-classify)
    GHI ĐÈ suy luận cơ học TỪNG TRƯỜNG MỘT khi có mặt — cờ nào vắng thì
    trường đó vẫn suy như cũ, không phụ thuộc các cờ khác có mặt hay không
    (per RUL60 (submit — ba cờ ghi-đè tier/kind/risk, độc lập từng trường) dưới). Luôn ghi đè được bằng một sửa (`edit`) sau đó dù trường
    đến từ suy luận hay từ cờ tường minh.
  - **verify** — một giá trị placeholder cố định, đánh dấu "chưa xác định" —
    một stage sau bổ sung proof thật.
  - **mode** — `sync` nếu không truyền cờ; `async` nếu truyền `--async` hoặc
    `--unattended` (hai cờ cùng nghĩa). Chỉ được GHI lại ở bước này, chưa có
    hành vi nào khác đi kèm — không có gì tự động đậu chờ người ở bước submit,
    kể cả với `--async`.
  - **deps** — tùy chọn qua `--deps <id1,id2,...>`, mirror HỆT cách `add` đã xử
    lý deps từ trước: mỗi id được kiểm tồn tại + kiểm chu trình qua ĐÚNG cửa
    ghi `addWork` mọi verb khác dùng, không cửa ghi mới; vắng cờ → `deps: []`,
    y hệt hành vi `submit` trước khi cờ này tồn tại (per str83-fgos-slash-commands / 757e5dd7).
  - item xuất hiện trong bản chiếu ở `todo` — y hệt `add`, ngay lập tức actionable
    nếu deps rỗng (mặc định của submit).
  - **domain** — tùy chọn qua `--domain <tên>`; vắng mặt đọc ra `coding`.
  - **acceptance** — tùy chọn qua `--acceptance '<json>'`, mirror HỆT `add`
    (Data Dictionary #24, RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)): cùng kiểm hỏng-dạng, cùng khuôn vắng-cờ-là-
    vắng-mặt, không mặc định mảng rỗng.
  - **stage** — stage của domain đó thỏa bước Làm-rõ, nếu domain đó có (per
    "Mô hình domain" trên); với `coding` (mặc định/vắng mặt) là `discovery`,
    stage đầu chuỗi (xem "Giai đoạn Soi-rõ" dưới) — item từ `submit`
    KHÔNG BAO GIỜ xuất hiện trong `ready` cho tới khi context-discovery cho
    qua, dù deps đã rỗng. Một domain KHÔNG có stage nào thỏa bước Làm-rõ (vd
    `synthetic`) nhận stage đầu tiên trong danh sách khai của domain đó thay
    thế — bỏ qua context-discovery hoàn toàn (per R-domain-1 trên); `submit`
    cho một domain như vậy chưa có proof thật (`verify` vẫn là placeholder
    của `submit`, không ai điền lại) — dùng `add --domain <tên> --verify ...`
    cho một domain bỏ-qua-discovery thay vì `submit`.
- **Side effects:** không.
- **Afterwards:** kết quả in ra là work item vừa tạo, bọc trong phong bì máy-đọc
  (xem dưới); item xuất hiện trong `list` ngay (ở stage `discovery`); chỉ xuất
  hiện trong `ready` sau khi qua context-discovery VÀ phán chia-việc.
```

## claim_02a2110f086ac00ef2d59c9d4d9afeb1

`docs/platform/work-state/spec.md#unheaded-block-68`
Unit SHA256: `ecb4ec26f8d1cd8578eb40c2e93a7e12016dc4658e1593d04c48fddaf40d4691`
Shown SHA256: `ecb4ec26f8d1cd8578eb40c2e93a7e12016dc4658e1593d04c48fddaf40d4691`

```text
- **Runs when:** người/agent gọi
  `fgos discover <id> [--verdict clear|unclear] [--tier <bậc>] [--kind <loại>] [--risk <mức>]`
  — điểm gọi tay/phiên-sống (mode `sync`). Verb này phục vụ ĐÚNG hai stage đầu
  chuỗi (`discovery`, `exploring`); item ở stage lập-kế-hoạch dùng verb `plan`
  riêng bên dưới, KHÔNG dispatch chéo. Vòng tự hành cũng quét đúng hai stage
  này mỗi lượt chạy (xem spec Runner) — cùng hành vi, khác điểm gọi.
- **Blocked when:** item không tồn tại — `validation`; item đang ở stage mà
  verb này không phục vụ — báo rõ và chỉ sang verb đúng, không âm thầm làm
  việc khác. Người gọi tương tác KHÔNG cung cấp verdict cũng bị từ chối, trừ
  khi tín hiệu tin-cậy (artifact quyết định đã commit dưới `docsRef`) trả lời
  thay: engine không bao giờ tự đoán verdict hộ.
- **What changes:** một bản ghi discovery (xem trên); rồi HOẶC một sự kiện
  đổi-stage `discovery → planning` (verdict `clear`, kèm `verify` thật) hoặc
  `discovery → exploring` (verdict `unclear`) hoặc `exploring → planning`
  (đã chốt xong), HOẶC một sự kiện đổi-status sang `awaiting-human` (kèm câu
  hỏi) khi còn cần người quyết. Kèm theo, khi người gọi có truyền
  `--tier`/`--kind`/`--risk`: một bản vá phân loại lên chính item — đây là
  chỗ `tier`/`kind`/`risk` được phán LẠI sau khi có bằng chứng, thay
  cho giá trị đếm-từ-khoá mà `submit` gán lúc sinh. Ba cờ đều tùy chọn và
  độc lập từng trường.
- **Side effects:** không có lời gọi model nào từ bên trong verb. Phán-quan
  lồng bên trong đã rút — lập luận nằm ở người gọi, verb chỉ áp dụng verdict
  nhận được. Bản vá phân loại đi qua ĐÚNG một chốt chặn dùng chung với đường
  headless của runner: chỉ áp dụng khi cả kết cục lẫn verdict đều `clear`,
  nên một verdict `unclear` (hay một tranh chấp `verify` đang park) không bao
  giờ ghi phân loại; và một giá trị ngoài từ vựng của domain bị từ chối
  TRƯỚC khi verb ghi bất cứ thứ gì. Trước đây chỉ đường headless có hợp đồng
  dữ liệu này còn đường tương tác chỉ có prose ("skill tự nhớ gọi `fgos
  edit`") — hai đường nay dùng chung một cửa.
- **Afterwards:** verdict `clear` → item sang `planning` (chưa lọt `ready` —
  còn một giai đoạn nữa phải qua) với `verify` thật, không còn placeholder;
  verdict `unclear` → item sang `exploring`; cần người → item xuất hiện trong
  `list` ở `awaiting-human` kèm câu hỏi, y hệt mọi cổng chờ-người khác. Mọi
  nhánh chưa xong đều trả lời xong rồi gọi lại `discover` (hoặc để vòng tự
  hành tự quét) sẽ soi lại.
```

## claim_a32a50f72a6c6f1ea86cba67b13a85dc

`docs/platform/work-state/spec.md#unheaded-block-69`
Unit SHA256: `876c0093197ca07debf3dbbc4844f926cfb2268f897bef63fca4254c50bd55f7`
Shown SHA256: `876c0093197ca07debf3dbbc4844f926cfb2268f897bef63fca4254c50bd55f7`

```text
- **Runs when:** người/agent gọi
  `fgos plan <id> [--verdict pass-through|decompose|need-human] [--children <json>]`
  — verb RIÊNG cho stage `planning` (và bí danh di sản `decompose`), tách bạch
  khỏi `discover` ở trên: một item đứng sai stage bị từ chối rõ lý do thay vì
  được dispatch nhầm phép phán. Vòng tự hành quét bước này NGAY SAU lượt quét
  soi-rõ và TRƯỚC khi giao việc thi công.
- **Blocked when:** item không tồn tại — `validation`; item không ở stage
  lập-kế-hoạch — chỉ sang `discover`. Verdict chia mà có bất kỳ con nào thiếu
  `verify` thật là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item
  ở nguyên trạng cho lượt sau (fail-safe, không bao giờ throw).
- **What changes:** HOẶC một sự kiện đổi-stage `planning → executing`
  (pass-through, hoặc sau khi sinh đủ con), HOẶC các sự kiện khai-con cộng sự
  kiện đổi-stage của gốc (verdict chia), HOẶC một sự kiện đổi-status sang
  `awaiting-human` mang đề xuất chia (cần người quyết), HOẶC không gì cả nếu
  verdict không hợp lệ (xem "Giai đoạn Lập-kế-hoạch" trên).
- **Side effects:** không có lời gọi model nào từ bên trong verb — cùng lý do
  với `discover` ở trên. Khi item tới `executing`, verb NHẢ luôn claim của
  item về `todo`: phiên nào cầm tiếp việc thi công phải claim lại qua cửa pull.
- **Afterwards:** pass-through hoặc chia xong → item/gốc sang `executing`,
  xuất hiện trong `ready` khi deps/lineage cũng đã mở; cần người quyết →
  `awaiting-human` mang đề xuất chia, trả lời xong thì phán lại từ đầu.
```

## claim_2d24212177cdc4b15ededd0322b41e87

`docs/platform/work-state/spec.md#unheaded-block-70`
Unit SHA256: `03e628ac0acb982ad74952d25a5455b032f21664ed147ecf3d8a7fb8c880bf18`
Shown SHA256: `03e628ac0acb982ad74952d25a5455b032f21664ed147ecf3d8a7fb8c880bf18`

```text
- **Blocked when:** (a) cạnh chuyển không có trong bảng — `todo→doing`, `doing→delivered`, `doing→awaiting-approval`, `awaiting-approval→delivered`, `delivered→retrospective`, `retrospective→cleanup`, `cleanup→done`, `cleanup→blocked`, `blocked→delivered`, `awaiting-approval→todo` (bắt buộc lý do), `awaiting-approval→blocked` (bắt buộc lý do — per pr-lifecycle / 1359ab5e, cạnh gate duyệt gãy: merge conflict hoặc verify đỏ sau merge, xem spec Runner "Cổng duyệt PR nội bộ"), `todo/doing→blocked`, `blocked→todo/doing`, `blocked→awaiting-approval` (per fan-out-parallel — cạnh cơ học, KHÔNG bắt buộc lý do, dành riêng cho một lần đồng bộ-lại/catch-up sạch, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)"), `todo/doing→awaiting-human` (bắt buộc câu hỏi), `awaiting-human→todo` (bắt buộc câu trả lời) là toàn bộ cạnh hợp lệ — trả `precondition` (mã 2); (a2) cạnh từ-chối `awaiting-approval→todo` hoặc cạnh gate-gãy `awaiting-approval→blocked` thiếu/rỗng lý do, hoặc cạnh vào chờ thiếu/rỗng câu hỏi, hoặc cạnh rời chờ thiếu/rỗng câu trả lời — trả `validation` (mã 4); (b) trạng thái thực khác `--expect` — trả `conflict` (mã 3); (c) cờ thiếu giá trị hoặc rỗng (`--to` trống, `--expect ""`) — trả `validation` (mã 4), không bao giờ lọt sang phạm trù 2/3; (d) **`--to delivered` khi nhánh `fgw/<id>` tồn tại mà CHƯA reachable từ trunk** (per tsk-5dk — `git merge-base --is-ancestor`, đo trực tiếp trong `case 'move'`, không tái dùng đường suy-luận-từ-git của cleanup-harness) — trả `validation` (mã 4), TRỪ KHI cờ `--override-reason "<lý do>"` được truyền kèm giá trị không rỗng; item không có nhánh `fgw/<id>` (item pull/legacy, hoặc fixture trạng thái thuần) hoặc có nhánh nhưng ĐÃ reachable không bị chặn — xem Data Dictionary #28/#29. Bốn trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái (kèm from/to) vào nhật ký, rồi bản chiếu cập nhật — luôn theo thứ tự nhật-ký-trước, bản-chiếu-sau.
- **Side effects:** không, TRỪ đường override ở (d) — khi `--override-reason` cho phép một `--to delivered` vượt qua kiểm reachability, một bản ghi `decision` (kind `engine`) được ghi TRƯỚC sự kiện chuyển-trạng-thái, mang chính lý do đó làm `rationale` — luôn kiểm được sau này qua nhật ký quyết định của item, không âm thầm.
- **Afterwards:** `done` là cửa một chiều ra: item đã done thì mọi lần move tiếp theo đều bị `precondition`; nay chỉ tới được `done` qua đúng một cạnh `cleanup→done`, sau khi item đã đi hết chuỗi đuôi `delivered → retrospective → cleanup`. Item bị từ chối về `todo` mang lý do trong nhật ký, vào lại hàng chờ làm tiếp. Cạnh `awaiting-approval→todo` (reject) hoặc `awaiting-approval→blocked` (gate gãy) mang `reason`: giá trị MỚI NHẤT còn được fold thêm lên chính item (`item.reason`, Data Dictionary #18, latest-wins) — không chỉ nằm trong nhật ký sự kiện, để consumer sau (prompt worker, người đọc `list`) thấy lý do mới nhất mà không cần lục nhật ký (per worker-execution STR33 / 396d9d9e, xem spec Runner RUL23 (hợp đồng con — verify thật, không placeholder)). Cạnh `blocked→awaiting-approval` (per fan-out-parallel) là cạnh DUY NHẤT rời `blocked` không mang `reason` và không đi qua `doing` — dành riêng cho một lần đồng bộ-lại (catch-up) sạch, phân biệt với người chọn cầm việc qua cửa pull để tự làm-lại tay (`blocked→doing`, đi qua chống-lặp bình thường như mọi lần nhận việc khác); xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)".
```

## claim_8c1ae13f6d7b056eea00005b9a9aef51

`docs/platform/work-state/spec.md#unheaded-block-71`
Unit SHA256: `62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4`
Shown SHA256: `62894935652369b5403e491ef4abbb29b006389988bc1e3e25fc20253ba48bc4`

```text
`edit` là cửa công khai để sửa đè các trường trên một item ĐÃ có sẵn — đóng
khoảng trống "luôn ghi đè được" mà `submit`'s phân loại cơ học (mechanical
classification) để lại (item vào qua `submit` không có cơ hội sửa lại field
đã phân loại sai). Ghi qua CÙNG một cửa ghi duy nhất (CTR002, `src/state/
store.mjs`) như `add`/`move` — không tạo cửa ghi thứ hai. Danh sách trường
được sửa (RỘNG): `title`, `kind`, `risk`, `verify`, `tier`, `refs`,
`deps`, `acceptance` (per str73-done-flip-cos-check — Data Dictionary #24,
RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done); ghi qua `JSON.parse`, không phải `parseListFlag` của `refs`/`deps`,
vì text clause có thể chứa dấu phẩy), `priority`, `intent` (per str7-str8-priority-intent —
Data Dictionary #25/#26; `--priority` ép kiểu số nguyên không âm, `--intent` ép
kiểu số nguyên bất kỳ dấu; truyền cờ KHÔNG kèm giá trị theo sau bị chặn tường
minh — không bao giờ âm thầm biến thành số nhờ ép kiểu boolean). Cố tình KHÔNG sửa được `id` (định danh bất biến), `status` (thuộc
`move`), `stage` (thuộc `moveStage` nội bộ, chưa có verb công khai), hay
`domain` — mỗi trường đó đã có cửa ghi riêng, gộp vào `edit` sẽ tạo cửa
ghi thứ hai cho cùng một trường.
```

## claim_0a5262c22b94129ed1e3a7fae90ee452

`docs/platform/work-state/spec.md#unheaded-block-72`
Unit SHA256: `c36313e9a59bc69c1f04a65dc22c55bd72e374e693fd9f4351a3534d1ccf1493`
Shown SHA256: `c36313e9a59bc69c1f04a65dc22c55bd72e374e693fd9f4351a3534d1ccf1493`

```text
- **Blocked when:** id không tồn tại — `validation` (mã 4); patch rỗng
  (không cờ `--<field>` nào được truyền) — `validation`; patch chứa một
  trường ngoài danh sách ở trên (kể cả cố tình truyền `id`/`status`/
  `stage`/`domain`) — `validation`, bị chặn TRƯỚC khi merge vào bản ghi; giá
  trị sau merge không qua được `validateWork` (vd `--tier` ngoài domain,
  `--deps` trỏ id không tồn tại, `--priority` âm) — `validation`; `--priority`/
  `--intent` truyền không kèm giá trị — `validation`, không bao giờ ghi `1`.
  Cả các trường hợp trên KHÔNG ghi sự kiện nào.
- **What changes:** một sự kiện `work.edit` mang patch (CHỈ những trường
  thật sự đổi, không phải toàn bộ bản ghi) vào nhật ký; bản chiếu gộp thêm
  (Object.assign) đúng những trường đó lên item — additive, không bao giờ
  ghi đè lại một sự kiện cũ (per RUL11 (tiến hóa schema)).
- **Side effects:** không.
- **Afterwards:** hai lần `edit` liên tiếp trên cùng item đều đọng lại —
  patch sau không xóa mất trường patch trước đã đổi (mỗi lần chỉ gộp đúng
  các key nó mang). Bỏ qua một cờ `--refs`/`--deps` giữ nguyên trường đó;
  truyền cờ với giá trị rỗng (`--refs ''`) XÓA trường về `[]` — hai trường
  hợp này phân biệt được, không lẫn vào nhau (cùng cơ chế `parseListFlag`
  `add` đã dùng). `edit --acceptance '<json>'` GHI ĐÈ TOÀN MẢNG mỗi lần
  (latest-wins), cùng ý nghĩa nhưng qua `JSON.parse` riêng — không có cơ chế
  sửa-từng-clause (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done)). `edit` chạy được y hệt bất kể `status` hiện tại của item
  là gì — verb này không bao giờ tự đổi `status`. Không có cơ chế CAS/
  `--expect` ở slice này (mỗi `edit` đã là một sự kiện cộng thêm nên giá trị
  cũ luôn phục hồi được qua nhật ký, không như một ghi-đè thật trong kho có
  thể biến đổi).
```

## claim_e3501e9c897d0150e7e41e8a3fc14526

`docs/platform/work-state/spec.md#unheaded-block-73`
Unit SHA256: `8e520755293c85e501ebeaff9485524a4e8d098caff35958b5c52baf0069b406`
Shown SHA256: `8e520755293c85e501ebeaff9485524a4e8d098caff35958b5c52baf0069b406`

```text
- **Blocked when:** thiếu nội dung chữ — `validation`.
- **What changes:** một sự kiện quyết-định vào nhật ký; quyết định đọc được lại từ bản chiếu sau replay.
```

## claim_00cd0ad86cbc44c609597a7f89457144

`docs/platform/work-state/spec.md#unheaded-block-74`
Unit SHA256: `3934104c59667221af37e30f52693b53c87032c9b95729315ceb9d18273f62bc`
Shown SHA256: `3934104c59667221af37e30f52693b53c87032c9b95729315ceb9d18273f62bc`

```text
- **Runs when:** người/agent gọi `fgos ask <id> --text "..."` để đậu một việc lại chờ người quyết.
- **Blocked when:** item không ở `todo`/`doing` (cạnh vào chờ không hợp lệ) — `precondition`; câu hỏi thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu hỏi vào nhật ký; item sang `awaiting-human`, bản chiếu gộp câu hỏi vào bản ghi cổng của item (theo id).
- **Side effects:** không.
- **Afterwards:** `list` hiện item ở `awaiting-human` kèm câu hỏi; `ready` không còn liệt kê item; mọi việc khác vẫn chạy bình thường — cổng bất đồng bộ, không chặn tiến trình khác. Việc đậu vô thời hạn cho tới khi có người trả lời.
```

## claim_543803710edb80a3ec320cdcdb8f880e

`docs/platform/work-state/spec.md#unheaded-block-75`
Unit SHA256: `31381297e4545267ec79a77e7535df60d454ddacffe884ced82a687bfcce2d2c`
Shown SHA256: `31381297e4545267ec79a77e7535df60d454ddacffe884ced82a687bfcce2d2c`

```text
- **Runs when:** người gọi `fgos answer <id> --text "..."` để trả lời câu hỏi của một việc đang chờ.
- **Blocked when:** item không ở `awaiting-human` (không có cạnh rời chờ từ trạng thái khác) — `precondition`; câu trả lời thiếu/rỗng — `validation`; trạng thái thực khác `--expect` — `conflict`. Không ghi sự kiện nào.
- **What changes:** một sự kiện chuyển-trạng-thái mang câu trả lời vào nhật ký; item về durable status trước lúc `ask` đậu nó (`durableStatusAtAsk`, do cửa ghi tính từ status bền); log cũ thiếu trường này dùng `statusAtAsk`, thiếu cả hai mặc định `todo`, và mọi giá trị `doing` đều được clamp về `todo`. `putInAwaiting` đã settle và nhả claim lúc đậu, nên trả lời không phục hồi claim cũ. Bản chiếu gộp câu trả lời vào bản ghi cổng (cạnh câu hỏi đã có vẫn còn — cộng thêm, không đè).
- **Side effects:** không.
- **Afterwards:** item không resume về `doing`; trường hợp resume về `todo` xuất hiện trong `ready` khi deps, workflow step và lineage đủ điều kiện; một lần `take` sau đó lấy claim mới. Bản ghi cổng giữ cả câu hỏi lẫn câu trả lời để tra sau.
```

## claim_f45ffe11ea4e490e8c73258a3381858e

`docs/platform/work-state/spec.md#unheaded-block-76`
Unit SHA256: `def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93`
Shown SHA256: `def08282f651f17f0d259f239b2ad9cc3d9e3b8dfeb3299cac39036dfcba7b93`

```text
- **Runs when:** không qua verb CLI riêng — được ghi từ bên trong vòng tự hành (spec Runner): nửa dự đoán ngay khi item được nhận việc; nửa thực tế khi item tới trạng thái cuối, CẢ khi thành công lẫn khi thất bại.
- **Blocked when:** thiếu id — `validation`.
- **What changes:** một sự kiện outcome vào nhật ký cho MỖI nửa (hai sự kiện riêng biệt, cùng id, đến ở hai thời điểm khác nhau); bản chiếu gộp hai nửa theo id — nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất.
- **Side effects:** không.
- **Afterwards:** `fgos check` đọc được cả hai nửa cho item đó ngay khi chúng tồn tại; item chưa từng chạy hoàn toàn không xuất hiện trong `check`.
```

## claim_e0fd94e304f77b878e72bbde3c0f28d7

`docs/platform/work-state/spec.md#unheaded-block-77`
Unit SHA256: `4a561ae476fb9a96d25fdd9172c3a452704f5ecedc7c131b71b85b6a5883d20d`
Shown SHA256: `4a561ae476fb9a96d25fdd9172c3a452704f5ecedc7c131b71b85b6a5883d20d`

```text
- **Runs when:** người/agent gọi `fgos check [id]`.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** truyền id → in đúng một khối cho item đó, mỗi nửa (dự đoán/thực tế) in giá trị thật nếu đã có, hoặc thông báo "chưa có dữ liệu" nếu nửa đó chưa tới; không truyền id → in một khối cho mỗi item ĐANG có ít nhất một nửa outcome; kho/log không mang bản ghi outcome nào → in đúng một dòng "chưa có dữ liệu" — thành công, không phải lỗi.
```

## claim_0881b0a9e9755d416f28e98c10fa504d

`docs/platform/work-state/spec.md#unheaded-block-78`
Unit SHA256: `fc9cf98c574c23b2d1cadd3b9c0c73dd84c2bfee51494ced1f60fa2a3cac637b`
Shown SHA256: `fc9cf98c574c23b2d1cadd3b9c0c73dd84c2bfee51494ced1f60fa2a3cac637b`

```text
- **Runs when:** người/agent gọi `fgos docs-index`.
- **Blocked when:** không có điều kiện chặn riêng — verb đọc-thuần với trạng thái item (quyền `read`): nó đọc bản chiếu outcome để truy ngược linkage và đọc cây tài liệu trên đĩa; nhật ký hỏng thì tầng đọc chung báo `corrupt-log` như mọi bên đọc. Không bao giờ ghi sự kiện, không đổi trạng thái item, không sửa tài liệu nào.
- **What changes:** ghi/ghi-đè đúng một tệp manifest `docs/enduser-docs-index.json` — một artifact dẫn xuất, không phải sự kiện hay bản chiếu trạng thái.
- **Afterwards:** manifest liệt kê mỗi tài liệu người-dùng-cuối tìm thấy dưới các thư mục quadrant, kèm linkage ngược về capture đã sinh nó (hoặc `null` cho tài liệu di sản chưa có linkage). Cơ chế đầy đủ (hình dạng manifest, ánh xạ quadrant→mục-đích/đối-tượng, cách truy linkage, tính idempotent, dung sai thư mục quadrant vắng) đặc tả ở area **`enduser-docs-index`** — bề mặt CLI sống ở đây (cửa lệnh `fgos` một cửa), hành vi chi tiết sống ở spec area đó, cùng khuôn `review`/`approve` trỏ sang spec Runner.
```

## claim_26910190bedd8d72e0f357f257c2141a

`docs/platform/work-state/spec.md#unheaded-block-79`
Unit SHA256: `8df771b9a95fb4b30a9156cd5e9d7a356eb45b338bdbe27701e457bb31b93f2d`
Shown SHA256: `8df771b9a95fb4b30a9156cd5e9d7a356eb45b338bdbe27701e457bb31b93f2d`

```text
- **Runs when:** người/agent gọi `fgos rollup <id>` để hỏi "việc tôi nộp tới đâu rồi" cho một item gốc (per stage-clarify / STR24).
- **Blocked when:** thiếu id — `validation`; id không tồn tại trong bản chiếu — `validation`, cùng khuôn `requireField`/not-found với `review`/`approve`. Không bao giờ ghi gì — đọc thuần, cùng họ với `check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in item gốc (title + status), rồi đếm con TRỰC TIẾP (qua `parent`, dựng từ STR16 decompose) đã `done` trên tổng số con (`k/n done`), rồi liệt kê từng con kèm status riêng của nó; item gốc không có con nào vẫn in `0/0 done` cộng một ghi chú rõ ràng "không có con" — không throw, không coi là lỗi.
```

## claim_7d98b6e290def0de929ee7898bfe2caa

`docs/platform/work-state/spec.md#unheaded-block-80`
Unit SHA256: `595c67ae94bc2fe4f46251ba6d6d35f16a9fbdb8fe0d09e92c87bfb810fb3070`
Shown SHA256: `595c67ae94bc2fe4f46251ba6d6d35f16a9fbdb8fe0d09e92c87bfb810fb3070`

```text
- **Runs when:** người/agent gọi `fgos triage` để hỏi "việc nào nổi lên chú ý" — cửa 2 của triage, phân biệt với STR14 intake-triage (cửa 1, phân loại rủi ro/lane lúc submit) — per deep-dive work-item-management.md, STR21.
- **Blocked when:** nhật ký hỏng → `corrupt-log`. Không bao giờ ghi gì — đọc thuần, cùng họ với `rollup`/`check`/`list`/`ready`.
- **What changes:** không gì.
- **Afterwards:** in mọi item CHƯA `done`, xếp hạng theo `blocks` — số item khác CŨNG CHƯA `done` đang liệt kê id đó trong `deps` — giảm dần, tie-break id tăng dần; item `done` không bao giờ xuất hiện trong danh sách VÀ không bao giờ được đếm vào `blocks` của item khác (một dep đã `done` không còn "chặn" ai); backlog rỗng hoặc mọi item đã `done` → một dòng thông báo rõ ràng, không throw. `blocks` là một proxy tác động (fan-out chặn), KHÔNG phải trường `priority` trên schema (đó là phạm vi STR7/STR8, còn `awaiting-approval`) — một derive thuần trên `deps` sẵn có, cùng tinh thần với `frontier.mjs`'s derive trên `parent`.
```

## claim_1878294482c51b01b5ecfc7c47f4df60

`docs/platform/work-state/spec.md#unheaded-block-81`
Unit SHA256: `c353e48e7f6e9d099ed7acc8db76b98bef4e8decacc1b68e6603f8fd009a58c5`
Shown SHA256: `c353e48e7f6e9d099ed7acc8db76b98bef4e8decacc1b68e6603f8fd009a58c5`

```text
- **Runs when:** một tác nhân ngoài runner gọi `fgos take [--id <id>] [--role human|session]`.
- **Blocked when:** `--role` khác `human`/`session` — `validation`; không truyền `--id` và frontier rỗng — `validation`; `--id` truyền một id không tồn tại — `validation`; `--id` truyền một item còn `todo` nhưng CHƯA nằm trong frontier (stage/deps/lineage chưa mở) — `validation`, thông điệp nói rõ "take chỉ mở đúng tập runner dispatch-được"; `--id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3). Mọi nhánh chặn KHÔNG ghi sự kiện nào.
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role` (`human`), `headAtTake` (Data Dictionary #14/#15), `preClaimStatus` (`todo` hoặc `blocked`), `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký sự kiện (*new claims do not durably write into doing*); trạng thái bền giữ nguyên pre-claim, trạng thái hiệu lực hiển thị `doing` qua lớp phủ runtime (`buildEffectiveView`). Một sự kiện outcome nửa DỰ ĐOÁN (tier/số dep/số lần nhận trước đó) được ghi cho cùng item — đối xứng claim của runner (xem spec Runner).
- **Side effects:** không.
- **Afterwards:** item hiển thị trạng thái hiệu lực `doing`, biến mất khỏi frontier (giống mọi claim khác); `fgos check` đọc được nửa dự đoán ngay; item chờ một `fgos return` để tới kết cục.
```

## claim_f6c704133e9a7ebeb8967d46887ed51e

`docs/platform/work-state/spec.md#unheaded-block-82`
Unit SHA256: `09be94379bedfc46f88f54503e52daa53a53e96f472cd8035e80db873e923ffe`
Shown SHA256: `09be94379bedfc46f88f54503e52daa53a53e96f472cd8035e80db873e923ffe`

```text
- **Runs when:** một tác nhân ngoài runner gọi `fgos pick [id]` — cùng cửa pull với `take`/`return`, nhưng gộp thêm bước dựng workspace trong MỘT lệnh.
- **Blocked when:** không truyền `id` và frontier rỗng — `validation` (no-id mở frontier-head như `take`); `id` truyền một id không tồn tại — `validation`; `id` truyền một item đã bị cầm/đỗ/kẹt — rơi thẳng xuống CAS của pre-claim status, báo `conflict` thật (mã 3) — HỆT `take`, không có cờ `--role` (role LUÔN `session`, không đọc/chấp nhận cờ đó). **Khác `take`: explicit `--id` không kiểm frontier** (claim-lock §3a) — `pick` nên cầm item ở BẤT KỲ stage nào nếu còn `status: 'todo'` (item đang ở `discovery`/`exploring`/`planning` đều được), miễn status chưa thay (CAS trong `moveWork` là guard thật).
- **What changes:** Tạo một bản ghi runtime claim (`.fgos/runtime/claims/<id>.json`) lưu `role: 'session'` + `headAtTake` (hoặc `branchHeadAtTake` cho đường nguồn-nhánh), `preClaimStatus`, `preClaimRevision`. Mọi claim mới KHÔNG BAO GIỜ ghi bền giá trị `doing` vào nhật ký (*new claims do not durably write into doing*); trạng thái bền giữ pre-claim, trạng thái hiệu lực hiển thị `doing`. Một sự kiện outcome nửa DỰ ĐOÁN được ghi cho cùng item, HỆT `take`. NGAY SAU claim thành công, một worktree + nhánh `fgw/<id>` được dựng (hoặc tái dùng nếu đã sống) qua CHÍNH `createWorktree` vòng tự hành dùng — không đường dựng workspace riêng.
- **Side effects:** nếu dựng workspace thất bại SAU KHI claim đã thành công, lỗi đó lộ ra nguyên vẹn cho người gọi — claim KHÔNG bao giờ bị âm thầm hoàn tác (không rollback tự động); item ở lại trạng thái hiệu lực `doing`, không worktree.
- **Afterwards:** người/phiên thấy item vừa claim VÀ đường dẫn worktree + tên nhánh của nó; item biến mất khỏi frontier như mọi claim khác; item chờ một `fgos return` để tới kết cục — HỆT vòng đời của một claim qua `take` (per str83-fgos-slash-commands / 757e5dd7).
```

## claim_fbd68c9c197768d52582a5b833543029

`docs/platform/work-state/spec.md#unheaded-block-83`
Unit SHA256: `b2eaf8daf7008b991917f223318d5e1de57fe2575580c0847cbe688ff6397baf`
Shown SHA256: `b2eaf8daf7008b991917f223318d5e1de57fe2575580c0847cbe688ff6397baf`

```text
- **Runs when:** người/phiên đang cầm một item qua `take` gọi `fgos return <id> [--timeout <ms>]`.
- **Blocked when:** item không tồn tại — `validation`; item không mang trạng thái hiệu lực `doing` — `validation`; item mang trạng thái hiệu lực `doing` nhưng `claimRole` không phải `human`/`session` (claim của runner) — `validation`, `return` chỉ hoàn tất một `take`; item thiếu `headAtTake` (claim di sản/không qua `take`) — `validation`; working tree host repo KHÔNG sạch (loại trừ `.fgos/` — store sống tự mutate bởi chính `return`, không bao giờ tính là bẩn) — `validation`; HEAD chưa tiến so `headAtTake` — `validation`; `--timeout` không phải số dương — `validation`. KHÔNG có nhánh chặn nào ghi sự kiện.
- **What changes:** verb TỰ CHẠY `verify` thật của item (goal-check) tại HEAD hiện hành, trong thư mục làm việc hiện hành — không bao giờ tin lời người gọi. Verify xanh: `settleClaim` chuyển bền trực tiếp từ `preClaimStatus → awaiting-approval` (mang thêm `headAtReturn`, Data Dictionary #16, per pr-lifecycle / 1359ab5e), giải phóng claim file, cộng một sự kiện outcome nửa THỰC TẾ (kết cục `awaiting-approval`, đạt goal-check, số commit kể từ `headAtTake`). Verify đỏ: `settleClaim` chuyển bền từ `preClaimStatus → blocked` (lý do `verify-fail`), giải phóng claim file, cộng nửa thực tế (kết cục `blocked`, không đạt), cộng một bản ghi friction lớp `verification`.
- **Side effects:** một tiến trình con chạy `verify` của item (shell, trong `cwd` hiện hành).
- **Afterwards:** verify xanh → item ở `awaiting-approval` mang `headAtReturn`, chờ người duyệt qua cổng `review`/`approve`/`reject` như mọi đề xuất khác (xem spec Runner "Cổng duyệt PR nội bộ" — dải `headAtTake→headAtReturn` là nguồn diff của một đề xuất pull-door) — KHÔNG sinh settlement ở bước này (settlement thuộc cạnh `→done`); verify đỏ → item ở `blocked`, mang một bản ghi friction verification, đi lại đường `blocked → todo` thường như mọi item đỗ khác.
```

## claim_41cdb3f312b868f996e5e0a70bfea6a3

`docs/platform/work-state/spec.md#unheaded-block-84`
Unit SHA256: `3b409a02d049a208d8dd89ec1517d283d06682dcd37aa9ae30e9ebd3028db7e4`
Shown SHA256: `3b409a02d049a208d8dd89ec1517d283d06682dcd37aa9ae30e9ebd3028db7e4`

```text
- **Runs when:** người/agent gọi, đặc biệt khi bản chiếu mất hoặc nghi lệch so với nhật ký.
- **What changes:** bản chiếu được dựng lại từ zero bằng phát lại toàn bộ nhật ký — kết quả giống hệt bản chiếu trước đó (đã chứng minh bằng test đầu-cuối chạy lệnh thật: xóa bản chiếu → rebuild → so sánh sâu bằng nhau).
- **On failure:** nhật ký có dòng cuối dở dang (đứt giữa chừng khi ghi) → báo `corrupt-log` (mã 5) nói rõ lỗi, phần nguyên vẹn phía trước vẫn đọc được; hỏng ở GIỮA nhật ký là lỗi cứng, không tự sửa, không nuốt.
```

## claim_9cc2da353fbd56243a142a56db5a65f8

`docs/platform/work-state/spec.md#unheaded-block-85`
Unit SHA256: `47f8d1203550fbf1cf157dc6f4b44f5dad48385f62994bb16a1834ad21e5b8a0`
Shown SHA256: `47f8d1203550fbf1cf157dc6f4b44f5dad48385f62994bb16a1834ad21e5b8a0`

```text
- **Blocked when:** nhật ký hỏng → `corrupt-log` (mã 5). Đọc không bao giờ ghi gì — chạy bao nhiêu lần nhật ký cũng không đổi một byte (có test so byte khóa).
- **ready:** trả danh sách việc sẵn-sàng dẫn xuất từ trạng thái (`todo` + mọi dep đã ngã-ngũ thật, tức từ `delivered` trở đi hoặc đã hủy + đang ở stage `executing` + không còn hậu duệ dang dở qua `parent`; dep đang `awaiting-approval`/`doing`/`blocked`/`awaiting-human` KHÔNG mở việc phụ thuộc), thứ tự đúng thứ tự khai việc; kho chưa khởi tạo → danh sách rỗng, thành công. Đầu ra máy-đọc-được. Item `awaiting-human` không lọt vào tập này vì chỉ trạng thái `todo` mới sẵn-sàng — cổng chờ-người được loại "miễn phí" bởi chính bộ lọc trạng thái, và một item có dep đang chờ-người cũng không được mở. Item còn ở stage `discovery`/`exploring`/`planning` cũng không lọt vào tập này dù status là `todo` — "sẵn sàng" nghĩa là đã qua cả context-discovery lẫn chia-việc, không chỉ đã hết dep. Một item gốc còn hậu duệ dang dở cũng không lọt vào tập này dù bản thân nó `todo`+`executing` — lineage (`parent`) là một chiều lọc riêng, tách khỏi `deps`.
- **Thứ tự sẵn-sàng là một HỢP ĐỒNG CÓ VERSION (STR43 S4, nâng lên v2 bởi str7-str8-priority-intent).** Thứ tự `ready` trả về là hợp đồng phân-thứ-tự có tên, có số phiên bản — v2 hiện hành: khóa 1 `priority` ASC (Data Dictionary #25, vắng mặt xếp cuối) → khóa 2 `intent` DESC (Data Dictionary #26, vắng mặt xếp cuối) → khóa 3 (tie-break) FIFO theo thứ tự khai việc, chính là toàn bộ khóa của v1. Đây là bề mặt DUY NHẤT quyết định thứ tự cầm-giao việc; sort ổn định (`Array.prototype.sort`) nên một view mà không item nào mang `priority`/`intent` cho kết quả BYTE-GIỐNG-HỆT v1 — v2 không đổi hành vi của bất kỳ nhật ký nào chưa từng dùng hai trường mới.
```

## claim_d1c7086a5b15c7f68fbc9af1c929be85

`docs/platform/work-state/spec.md#unheaded-block-86`
Unit SHA256: `6070f51f4128ebf3bdcc18334e1a4ecb281d516142e341777e411b91bb7eaf61`
Shown SHA256: `6070f51f4128ebf3bdcc18334e1a4ecb281d516142e341777e411b91bb7eaf61`

```text
Một verb đọc-thuần trả **metrics CƠ HỌC** của đồ thị công việc, fold từ nhật ký, qua envelope CTR001. Không bao giờ ghi, không bao giờ gọi model — chỉ tính SỰ THẬT đồ thị cho một bên đọc (picker STR7, planner-brain STR8) dùng làm đầu vào, thay vì tự suy lại topology (stance RUL42 (runner spec — picker cơ học vĩnh viễn, trí tuệ vào hệ qua field trên item)). Mọi số liệu deterministic (cùng nhật ký → cùng kết quả → `data_hash` ổn định).
```

## claim_eb24f286b355e6889e2e16f84a7301a5

`docs/platform/work-state/spec.md#unheaded-block-87`
Unit SHA256: `c1a962fe830292f73a80e7dbca5e8d0cf0df5bcb2020de0dbda1439032d85c0c`
Shown SHA256: `c1a962fe830292f73a80e7dbca5e8d0cf0df5bcb2020de0dbda1439032d85c0c`

```text
- **Connected-components (mấy mũi song song độc lập):** nhóm các item liên kết qua BẤT KỲ cạnh phụ-thuộc hoặc lineage nào (coi vô hướng) thành từng thành phần. Hai item ở hai thành phần khác nhau không chia sẻ dep/lineage → làm song song hoàn toàn được. Item không cạnh nào là một thành phần đơn.
- **Critical path (đường tới hạn / độ sâu):** chuỗi phụ-thuộc DÀI NHẤT trong đồ thị `deps` (bảo đảm phi-chu-trình ở cửa ghi) — độ dài là số bước tuần tự tối thiểu trước khi item sâu nhất khởi động được.
- **Stale-blocked (chuỗi kẹt):** các item `todo`/`blocked` còn ≥1 dep chưa `done` (kể cả một dep KHÔNG tồn tại — kẹt vĩnh viễn), kèm danh sách dep đang chặn. Item đã sẵn-sàng (mọi dep done) không liệt kê.
- **Greedy top-k-unblock (nên làm gì tiếp):** xếp hạng tham-lam dưới-mô-đun các item chưa `done` theo lượng công việc hoàn thành nó sẽ MỞ KHÓA — mỗi lượt chọn item phủ được nhiều hậu-duệ-chưa-done MỚI nhất; báo cả tổng hậu duệ (`unblocks`) lẫn phần mở mới biên (`newlyUnblocks`).
- **What-if (hoàn thành X → mở khóa gì):** `graph --what-if <id>` trả riêng tác động của một item: tổng hậu-duệ-chưa-done transitive + `newlyReady` (các item phụ thuộc trực-tiếp mà MỌI dep KHÁC đã `done` → hoàn thành X làm chúng thỏa-dep). Là sự thật phụ-thuộc, KHÔNG phải đủ-điều-kiện-frontier (không xét stage/lineage).
- **Frame (computed/skipped + revision):** mỗi payload metrics kèm một `frame` — `revision` (dấu vân tay view deterministic, S3) để một bên đọc cache theo revision và bỏ qua tính lại khi không đổi; `computed[]`/`skipped[]` nêu metric nào đã chạy: greedy `topUnblock` (metric duy nhất siêu-tuyến-tính) bị BỎ QUA trên đồ thị lớn (quá `maxNodesForGreedy`), giữ đọc luôn có biên.
- **Blocked when:** như mọi đọc — nhật ký hỏng → `corrupt-log` (mã 5); không bao giờ ghi một byte.
- Chỉ các id thật (có trong view) được nhóm/tính — một cạnh trỏ tới id không tồn tại (dangling parent/dep) không bao giờ tạo nút ma.
- **Đầu ra time-relative:** `graph`/`what-if`/components/critical-path là deterministic; chỉ advisory `stale` (dưới) mang thời-gian-thực nên `data_hash` của nó đổi theo thời gian đã trôi — đúng bản chất "kẹt bao lâu rồi".
```

## claim_88d75ffe4782950406eac86a9cedc3a9

`docs/platform/work-state/spec.md#unheaded-block-88`
Unit SHA256: `31897e527213803203f7a7e3fb5b126986d4821eb4c374117f00acf81a38d218`
Shown SHA256: `31897e527213803203f7a7e3fb5b126986d4821eb4c374117f00acf81a38d218`

```text
`stale` phân loại các item đang `doing` là kẹt-hay-không theo NGƯỠNG-THEO-CHỦ, gợi ý — không bao giờ hành động:
```

## claim_a62c7a916bf6ae0f61a53687b9274f48

`docs/platform/work-state/spec.md#unheaded-block-89`
Unit SHA256: `6eb3dc776fa680fbcd958d313c4a1a6a7362c13279a59bfaf074d7deb7d510d1`
Shown SHA256: `6eb3dc776fa680fbcd958d313c4a1a6a7362c13279a59bfaf074d7deb7d510d1`

```text
- **Ngưỡng theo chủ (người ≫ agent):** claim của `runner` là claim AGENT (ân hạn ngắn, mặc định 15 phút); claim của `human`/`session`/khác là claim NGƯỜI (ân hạn dài, mặc định 24 giờ). Cùng một tuổi claim có thể kẹt với agent mà chưa kẹt với người. Ngưỡng ghi đè được.
- Chỉ liệt kê item kẹt, kèm `ageMs`/`thresholdMs`/`suggestion`. **Gợi ý không bao giờ mô tả thu-hồi tự-động** — đúng luật đã khóa: reap của runner chỉ thu hồi claim của CHÍNH nó khi crash, không bao giờ thu hồi claim của một người. Đây là bên cố-vấn: phân loại + gợi ý, người quyết.
- Item không tìm được thời-điểm-claim bị bỏ qua (không bao giờ tuổi NaN).
```

## claim_ae7fe448dc96d9fbc95cc8269b2e01d3

`docs/platform/work-state/spec.md#unheaded-block-90`
Unit SHA256: `3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e`
Shown SHA256: `3694cfa1568e58a1b3fb4fa4e447f9cf23a953e2b2eb9dd8809a42c78c85204e`

```text
`conflicts` tìm rủi ro đụng-độ-file giữa các item CÓ THỂ giao SONG SONG. Tập ứng viên là frontier (`ready` = item giao được ngay bây giờ), nên mỗi xung đột là thật: một runner song song có thể nhặt cả hai cùng lúc.
```

## claim_c03019a0c5cb7d26def3c7f0d6f12931

`docs/platform/work-state/spec.md#unheaded-block-91`
Unit SHA256: `c6a18ec4c4d25ad879f1d641ceca294e769d4e0da33767626d17a8403c449400`
Shown SHA256: `c6a18ec4c4d25ad879f1d641ceca294e769d4e0da33767626d17a8403c449400`

```text
- Mỗi item có thể khai một **`footprint`** — danh sách đường-dẫn file nó dự kiến chạm (`add --footprint a,b`). Trường phụ TÙY CHỌN, cưỡi SCHEMA_VERSION lúc bằng 2 tại thời điểm nó được thêm vào (SCHEMA_VERSION hiện hành nay là 3, per str46-io-contract), vắng-khi-không-khai; là nội dung cụ thể cho hai trường CTR003 có-tên-mà-rỗng (`forbidden_paths`/`required_outputs`). Không vào cycle-check/frontier; footprint còn chặn đề xuất chia có overlap bằng cổng `awaiting-human`, xếp các item xung đột vào wave khác nhau trong `computeSchedule`, và cung cấp tín hiệu cho `mergeReadiness`.
- Mỗi cặp ready chia sẻ ≥1 đường-dẫn footprint được nêu kèm đường-dẫn chung + **lựa chọn giải quyết** `sequence`/`hoist`/`re-slice`. Bên cố-vấn CHỈ gợi ý — không bao giờ tự re-slice hay sửa deps. Item không khai footprint không bao giờ xung đột.
```

## claim_ea915c4e30d099daabf85b25b1f7b5f2

`docs/platform/work-state/spec.md#unheaded-block-92`
Unit SHA256: `6d080b8078df1fa4538a1750f5a61c2ad460fc86969fc695517e697388393628`
Shown SHA256: `6d080b8078df1fa4538a1750f5a61c2ad460fc86969fc695517e697388393628`

```text
| Capability | Người vận hành | Agent trong repo | Clone/máy khác |
|---|---|---|---|
| Mọi thao tác ghi (init/add/move/decision/ask/answer) | ✓ qua cửa lệnh duy nhất | ✓ qua cửa lệnh duy nhất | — (nhận qua commit) |
| Trả lời một cổng chờ-người (answer) | ✓ — người là bên quyết | ✓ về mặt cơ chế (cùng cửa lệnh); ai được phép trả lời cổng nào chưa phân quyền | — |
| Đọc (list) / rebuild | ✓ | ✓ | ✓ sau khi clone/pull |
| Ghi thẳng vào nhật ký hay bản chiếu không qua cửa | — cấm | — cấm | — cấm |
```

## claim_3d2d87a2a9582e2faebabc79470d8ee8

`docs/platform/work-state/spec.md#unheaded-block-93`
Unit SHA256: `f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63`
Shown SHA256: `f20c0ca6ad7490fa85635d8100333e97787282b0936df18a2f7f7599d5cd3b63`

```text
- **RUL1 (sự thật duy nhất là nhật ký sự kiện append-only, bản chiếu chỉ là dẫn xuất).** Sự thật duy nhất là nhật ký sự kiện append-only, được commit; bản chiếu là dẫn xuất dựng lại được từ zero — không bao giờ là truth (per 451ca088; luật nền L3).
- **RUL2 (mọi mutation đi qua đúng một cửa ghi).** Mọi mutation đi qua đúng MỘT cửa; mỗi mutation để lại đúng một sự kiện.
- **RUL3 (thứ tự ghi bất biến: sự kiện vào nhật ký trước, bản chiếu cập nhật sau).** Thứ tự ghi bất biến: sự kiện vào nhật ký TRƯỚC, bản chiếu cập nhật SAU; bản chiếu lệch thì rebuild là đường phục hồi.
- **RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal).** Chuyển trạng thái chỉ theo bảng cạnh tường minh; `done` terminal, không lối ra (per fd17309a; mở rộng per phase-2-routing / feed7428). `done` nay có ĐÚNG MỘT lối vào — `cleanup→done` — tới được sau một chuỗi tuần tự `delivered → retrospective → cleanup`. Hai lối vào cũ (`doing→done` thao tác tay, `awaiting-approval→done` duyệt đề xuất) KHÔNG còn tồn tại: chúng nay dừng ở `delivered`, và điều kiện "phải đi qua bước tổng hợp trước khi đóng" không còn được cưỡng chế bằng một gate gắn ở cửa `done` nữa mà bằng chính hình dạng tuần tự của chuỗi đuôi — không có đường vòng nào để lách qua `retrospective`.
- **RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù).** Ghi có kỳ vọng: trạng thái thực khác kỳ vọng → từ chối, không ghi đè mù.
- **RUL6 (consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp).** Consumer rẽ nhánh theo mã thoát phạm trù, không bao giờ theo thông điệp (per luật L4 / 14ebeea9).
- **RUL7 (schema item mang đủ chất liệu trả lời sáu câu hỏi harness).** Schema item mang đủ chất liệu trả lời sáu câu hỏi harness: refs (đọc gì/contract), kind (loại), risk (rủi ro), verify (proof), learn (bài học) (per luật L5).
- **RUL8 (deps phải trỏ id tồn tại, cấm tự trỏ).** Deps phải trỏ id tồn tại, cấm tự trỏ; một loại item duy nhất, không cấp bậc entity.
- **RUL9 (tầng này quản việc của chính forgent, chưa generic hóa cho consumer khác).** Tầng này quản việc của chính forgent; không generic hóa cho consumer khác khi chưa tới lượt (per 9ac6ca50).
- **RUL10 (tiền đề có ngưỡng).** Một người ghi tại một thời điểm; khi nhiều agent ghi đồng thời thành tải chính, mở lại thiết kế store theo ngưỡng đã ghi trong luật L3 (per ae461c8b). **Bổ chú (fgos-multi-session-checkout Epic 3 / STR35):** cửa ghi sự kiện `appendEvent` nay tự khóa liên-tiến-trình bằng một `.fgos/events.lock` riêng (chính sách CHẶN-có-timeout — thử lại với backoff cho tới khi thắng hoặc hết giờ, mirror `acquireSessionsLock` chứ KHÔNG phải lối lùi-không-chặn của `acquireRunnerLock`; một thể hiện thứ ba độc lập của cùng primitive wx-atomic-create + gặt-pid-chết, không đụng `runner.lock`/`sessions.lock`). Nhờ đó hai tiến trình `fgos` chạy song song không còn cùng đọc một `seq` cuối rồi cùng ghi `seq+1` — đua trùng-seq trên nhật ký append-only (đã xác nhận bằng spike) bị đóng NGAY TẠI append. Hết timeout khi giành khóa → phạm trù lỗi MỚI `lock-timeout` (tách bạch `corrupt-log`/`validation`: nghĩa là "đang có người ghi, thử lại cả thao tác", không phải hỏng dữ liệu). **Bổ chú 2 (store-atomic-rmw):** dư lượng trên — khóa chỉ đóng đua tại chính append, không đóng đua đọc-sửa-ghi cấp cao ở `store.mjs` — nay ĐÃ ĐÓNG. `events.mjs` xuất thêm `withEventsLock(logPath, fn)` (giữ nguyên `.fgos/events.lock` hiện có, không khóa mới) và `appendEventLocked` (lõi không-tự-khóa của `appendEvent`, dùng khi khóa đã đang giữ). `addWork`/`editWork`/`moveWork`/`moveStep` ở `store.mjs` nay bọc TRỌN chuỗi đọc-tiền-kiểm-rồi-ghi (kiểm id-đã-tồn-tại, CAS `expectedStatus`/`expectedStep`) trong MỘT phiên giữ khóa đó — tiến trình thứ hai giành khóa sẽ đọc lại SAU KHI sự kiện của tiến trình thứ nhất đã nằm trong nhật ký, nên tiền-kiểm của nó phát hiện đúng xung đột (`validation` "already exists" hoặc `conflict` CAS) thay vì cùng qua rồi cùng ghi. `refreshView` (dựng lại bản chiếu + ghi `state.json`) vẫn chạy SAU khi khóa nhả, không đổi. `runner.lock`/hàng-ghi ở tầng vòng lặp không đụng tới.
- **RUL12 (frontier dẫn xuất).** Việc-kế-tiếp là truy vấn dẫn xuất từ trạng thái, không bao giờ là danh sách tay; dep chỉ mở việc phụ thuộc khi việc đó thật sự đã ngã-ngũ — đề xuất chưa duyệt KHÔNG mở (per phase-2-routing / luật RUL5 (ghi có kỳ vọng: trạng thái thực khác kỳ vọng thì từ chối, không ghi đè mù) nền tảng). "Ngã-ngũ" tính từ `delivered` trở đi (`delivered`/`retrospective`/`cleanup`/`done`), cộng item bị hủy: ngưỡng thật là "code đã vào cây chính", đúng nghĩa hẹp mà `done` vốn mang không chính thức cho phép kiểm này trước khi chuỗi đuôi tách các chặng đó ra thành tên riêng. Một item đang nằm ở `retrospective`/`cleanup` vì thế không giữ chân việc phụ thuộc nào — phần đuôi là tổng-hợp và thu-hồi, không phải phần việc mà ai đó còn phải chờ.
- **RUL11 (tiến hóa schema).** Nhật ký đã commit bất khả xâm phạm — không bao giờ migration ghi đè; replay tương thích ngược có test khóa (bản ghi di sản thiếu trường nhận default khai báo, fixture nhật ký Phase 1 thật là chuẩn nghiệm thu); mỗi sự kiện mới mang phiên bản schema (per phase-2-routing / feed7428). **Miễn trừ pre-release** (viết lại tại chỗ cho phép trong lúc sản phẩm chưa phát hành, hết hiệu lực ở v1.0.0): xem `0017-mien-tru-viet-lai-nhat-ky`.
- **RUL13 (bản ghi outcome, cộng thêm không đè).** Dự đoán và thực tế của cùng một item là hai sự kiện outcome riêng, gộp theo id ở bản chiếu; nửa đến sau CỘNG THÊM vào nửa đã có, không bao giờ đè mất nửa trước (per phase-3-compound-learning / 1a80b4d3). Đây là một ca cụ thể của luật tiến hóa schema RUL11 (tiến hóa schema): cộng thêm, không migration, log cũ replay nguyên vẹn không sinh outcome nào.
- **RUL14 (cổng chờ-người, awaiting-human).** "Chờ người quyết" là một trạng thái RIÊNG, tách bạch khỏi `blocked` (kẹt vì lỗi/runner-park) — "việc đang chờ tôi" tra được sạch theo một status. Là MỘT trạng thái chung, không đẻ nhiều loại cổng (need-review/need-approval/…) khi chưa có consumer thật cần — nội dung câu hỏi/câu trả lời đã gánh phần "chờ gì". Mỗi cổng mang một cặp câu hỏi/câu trả lời cụ thể, không chỉ nhãn: câu hỏi ghi lúc vào chờ, câu trả lời ghi lúc người trả lời. Đậu VÔ THỜI HẠN — không timeout, không hết-hạn, không đánh-thức tự động; người quay lại lúc nào trả lời lúc đó. Người trả lời qua một lệnh CLI; câu trả lời thành một sự kiện trong nhật ký, rồi item RỜI `awaiting-human` về `todo` và chạy tiếp. Câu hỏi của một cổng đang chờ đọc được qua `list` sẵn có — không cần surface đọc riêng. Tất cả per 65c642a8 (khóa exploring async-human-gate).
- **RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng).** Bộ chọn việc-sẵn-sàng và runner KHÔNG BAO GIỜ pick một item `awaiting-human`; một item có dep đang `awaiting-human` cũng không được mở (dep mở ở `delivered`/`retrospective`/`cleanup`/`done` hoặc khi bị hủy). Đây là tiêu chí nghiệm thu, không phải khuyến nghị: một việc chờ người mà runner vẫn pick thì phá cả ý nghĩa cổng (per 65c642a8). Là hệ quả trực tiếp của RUL12 (chỉ `todo` mới sẵn-sàng) áp cho trạng thái mới — không cần điều kiện lọc thêm, có test khóa cả hai chiều.
- **RUL16 (submit là cơ học, không bao giờ chặn).** Phân loại size/kind/risk cơ học của `submit` (rigor là cờ tùy chọn) chỉ đếm từ khóa, không gọi model/AI; mô tả không khớp từ khóa nào KHÔNG BAO GIỜ chặn tạo item — luôn rơi về mặc định an toàn, luôn ghi đè được sau (per stage-intake / 9f6b52c8). **Bổ chú (self-improve loop STR13 Slice 2):** bộ từ khóa rủi-ro-nặng quyết định size `heavy` và risk `heavy` không còn riêng của `submit` — nó là MỘT nguồn dùng chung với phép thử-từ-khóa của Iron Law (xem spec Runner "Iron Law — phân loại rủi ro của một candidate fix"), và đã được mở rộng thêm 13 từ khóa (nhóm hệ thống ngoài/bỏ kiểm tra/kiểm toán) — `submit` từ nay phân loại `heavy` cho các mô tả trùng từ khóa mới này, một thay đổi hành vi CHỦ Ý, không phải hồi quy.
- **RUL17 (mode là quy ước gọi, không phải điều kiện code).** Trường `mode` do `submit` ghi lại chế độ đã dùng khi tạo item; KHÔNG có đoạn code nào (submit, discover, hay vòng tự hành) đọc/rẽ nhánh theo giá trị của nó. Ý nghĩa của `mode` là quy ước NGƯỜI-GỌI-NÀO-NÊN-CHẠY-discover-TRƯỚC (per stage-intake / 9f6b52c8, làm rõ tại stage-clarify / 9a19eea5): `sync` gợi ý phiên đang sống nên tự gọi `discover` ngay; `async` gợi ý không ai làm vậy, để vòng tự hành lo. Dù người gọi bỏ qua gợi ý này (gọi sai chiều, hoặc không gọi gì cả), RUL18 (stage — chiều vĩ mô song song với status) đảm bảo item vẫn được xử lý.
- **RUL18 (stage — chiều vĩ mô song song với status).** Mỗi item mang thêm một trường `stage`, tách bạch khỏi `status` (vi mô): `stage` trả lời "loại tác vụ nào đang cần", `status` trả lời "việc đang ở đâu trong vòng đời của tác vụ đó". Với `coding` hôm nay bộ giá trị sống là `discovery`/`exploring`/`planning`/`executing`, cộng bí danh di sản `decompose`. Item vào hệ qua `submit` bắt đầu ở stage đầu chuỗi của domain nó (`discovery` với `coding`); qua `add` cũng mặc định step đầu chuỗi qua `entryStepFor` (`discovery` với `coding`); chỉ bản ghi cũ không mang step mới được đọc lazy là `executing` (per stage-clarify / 9a19eea5). `stage` chỉ có nghĩa ở PHẦN ĐẦU vòng đời: từ `awaiting-approval` trở đi không còn cạnh chuyển-stage nào, nên chiều trả lời "đang ở đâu" từ đó là `status`, không phải `stage`.
- **RUL19 (vòng tự hành là lưới đỡ context-discovery, bất kể mode).** Mỗi lượt chạy, vòng tự hành quét TOÀN BỘ item đang ở stage soi-rõ của domain nó (`discovery` với `coding`) VÀ `status: todo` — không phân biệt giá trị `mode` — TRƯỚC khi giao bất kỳ việc thi công executing nào trong cùng lượt. Lượt quét dispatch worker `fgos-researching`; verdict thật của worker đi qua `resolveDiscovery`, có thể chuyển item sang `planning` hoặc `exploring` mà không cần một phiên sống ngồi chờ. Không bao giờ chạm item đang `awaiting-human` (hệ quả trực tiếp của RUL15 (runner/frontier loại cổng chờ-người — ràng buộc cứng), áp dụng cho cả sweep này). Đảm bảo không item nào kẹt vô hình dù phiên sống đã chết giữa chừng hoặc người submit bỏ đi không gọi `discover` (per stage-clarify / 9a19eea5).
- **RUL20 (settlement — kênh 1 của capture 2 kênh).** `role` là trường cộng-thêm tùy chọn trên chính ngã-ngũ (`work.move`/`work.step`) — không sinh event mới. Bản ghi settlement là bề mặt đọc dẫn xuất từ ba loại ngã-ngũ đã có (clarify-pass/answer/close), cộng thêm không đè theo id, và giữ nguyên nhật ký di sản thật (không tự "mọc" bản ghi cho một ngã-ngũ tiền-phiên-bản) (per phase-3-compound-learning S3-closeout / 96a65365; hoàn thành quyết định trì hoãn 719cbe3a).
- **RUL21 (câu-6 tự động — bài học lúc đóng).** Bất kỳ item nào tới `done` — nay qua đúng một lối vào `cleanup→done` — đều tự động sinh một bản ghi học cơ học — không phán xét, không gọi model. Soạn bài học là best-effort: lỗi soạn không bao giờ chặn việc đóng item; item không dữ liệu nào trước đó vẫn nhận một bản ghi tối thiểu, không rỗng-im-lặng (per phase-3-compound-learning S3-closeout / 96a65365).
- **RUL22 (mọi item qua chia-việc trước executing).** Item rời chuỗi soi-rõ luôn vào stage `planning` trước — dù đi thẳng (`discovery → planning`, verdict đủ rõ) hay vòng qua `exploring` (`discovery → exploring → planning`). Không có cạnh nào đi từ `discovery`/`exploring` thẳng tới `executing`: `planning → executing` là lối vào duy nhất của bước thi công. Item đơn giản được phán pass-through rẻ; chỉ item cần chia mới tốn công thật (per stage-decompose / 43f257ae).
- **RUL23 (hợp đồng con — verify thật, không placeholder).** Mỗi con sinh ra từ phán chia-việc phải mang `verify` THẬT (lệnh chạy được) ngay từ lúc sinh — con thừa hưởng ngữ cảnh đã chốt của gốc và vào thẳng `planning`, không chạy lại vòng soi-rõ của riêng nó, nên chính phán chia-việc là nơi sản xuất verify đó. Verdict có bất kỳ con nào thiếu verify là verdict KHÔNG HỢP LỆ toàn bộ: không con nào được ghi, item ở nguyên trạng cho lượt quét sau (per stage-decompose / 43f257ae).
- **RUL24 (lineage `parent` tách bạch với `deps` về lưu trữ và điều-phối).** `parent` là quan hệ lineage (hậu duệ→gốc); `deps` là quan hệ chặn. Về LƯU TRỮ và ĐIỀU-PHỐI hai quan hệ không bao giờ trộn: con của một lần chia-việc TUYỆT ĐỐI KHÔNG được ghi vào `deps` của gốc (per stage-decompose / 43f257ae). **Bổ chú (work-graph-intelligence S2a / record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)):** "tách bạch" nay giới hạn ở lưu trữ + điều-phối; cho phép kiểm PHI-CHU-TRÌNH, `deps` và `parent` được chiếu thành MỘT đồ thị cạnh-định-kiểu hợp nhất (RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị)) — không mâu thuẫn: con vẫn không nằm trong `deps` của gốc, chỉ là cả hai cạnh cùng được một phép kiểm chu trình soi.
- **RUL25 (frontier chặn gốc theo lineage, gốc tự chứng minh khi bộ đóng).** Bộ lọc frontier chặn một gốc khi bất kỳ hậu duệ nào (qua chuỗi `parent`, đệ quy) chưa `done` — dẫn xuất thuần từ `parent`, không cơ chế mới. Khi hậu duệ cuối đóng, gốc tự lọt frontier như một item thường; `verify` của chính gốc (mang từ lúc rời chuỗi soi-rõ) là phép kiểm tích hợp của cả bộ — không có bước "đóng bộ" ghi riêng, không auto-`done` không chứng minh (per stage-decompose / 43f257ae).
- **RUL26 (cổng-người có điều kiện trên kết quả chia).** Con mặc định vào queue thẳng; item đậu `awaiting-human` mang đề xuất chia khi phán báo cần người, khi cổng từ khóa rủi ro đòi duyệt, khi blast-radius gate đòi duyệt, khi lần kiểm thứ hai tranh chấp verify của con, hoặc khi footprint con overlap mà chưa được phân thứ tự bằng deps. Chế độ sync hỏi ngay trong phiên, dấu vết y hệt async (per stage-decompose / 43f257ae).
- **RUL27 (settlement `clarify-pass` theo cạnh RỜI stage đầu chuỗi, có điều kiện verdict).** Bản ghi settlement kind `clarify-pass` khóa theo cạnh RỜI stage ĐẦU CHUỖI của domain nó — với `coding` hôm nay là `discovery` — không theo cạnh ĐẾN, để việc chèn stage mới ở giữa không làm câm bản ghi settlement đã có (per stage-decompose / 43f257ae); cái đổi khi `clarify` rút là stage nào giữ vai "đầu chuỗi", không phải hình dạng của luật. Tên `clarify-pass` GIỮ NGUYÊN như một nhãn di sản: nó là giá trị đã ghi vào nhật ký append-only, không phải một tên stage, nên đổi tên sẽ vô hiệu các bản ghi cũ mà chẳng được gì. RỜI stage đầu chuỗi là điều kiện CẦN nhưng không ĐỦ: từ khi một verdict `unclear` cũng đổi stage (`discovery → exploring`, item vẫn đậu `awaiting-human` với câu hỏi mở), settlement chỉ ghi khi verdict dẫn tới chính cạnh đó không phải `clear: false` — đọc từ bản ghi `work.discovery` mà `resolveDiscovery` ghi ngay trước `work.stage` của nó, chứ KHÔNG đọc cạnh ĐẾN (giữ nguyên lý do khóa-theo-cạnh-RỜI ở trên) và KHÔNG thêm trường mới vào payload (replay là fold thuần trên log đã ghi, một cờ ghi ở nguồn chỉ sửa được các cạnh ghi SAU khi sửa). Log không mang verdict đọc được (log di sản, hoặc một lệnh đổi stage chạy tay) vẫn ngã-ngũ y như trước. Hệ quả cần biết: các hop SAU đó (`exploring → planning`, `planning → executing`) KHÔNG sinh settlement — chúng không bao giờ mang cạnh RỜI `discovery`.
- **RUL28 (cửa pull take/return — mirror trung thực, không tin lời).** `take` mở đúng tập frontier runner dispatch-được (`readyWork`), không bao giờ mở một tập riêng (per stage-decompose / 43f257ae). `return` không bao giờ chuyển `doing → awaiting-approval` chỉ vì người gọi tự báo xong: nó tự đo working tree sạch + HEAD tiến so `headAtTake` (tiến bộ THẬT) + tự chạy `verify` thật của item, cùng khuôn "không tin lời" của RUL13 (bản ghi outcome, cộng thêm không đè); verify đỏ đi đúng đường `blocked` + friction như runner tự đỗ. Không sinh settlement ở `return` — settlement chỉ sinh ở cạnh `→done` (per stage-decompose), giữ đúng một nguồn sự thật cho "đóng bộ" (per 6f2cbc47, a30a3d3c).
- **RUL29 (cạnh `awaiting-approval→blocked` — gate duyệt gãy, bổ sung schema duy nhất của pr-lifecycle).** Cổng duyệt (spec Runner "Cổng duyệt PR nội bộ") khi gặp merge conflict hoặc verify đỏ sau merge chuyển item `awaiting-approval → blocked` mang `reason` bắt buộc, cùng khuôn enforce-reason với `awaiting-approval→todo` — cạnh MỚI DUY NHẤT mà feature này thêm vào bảng FSM (per pr-lifecycle / 1359ab5e). `todo` bị loại vì runner tự re-dispatch (sai nghĩa giữ-chờ-người); `blocked` đúng nghĩa kẹt-vì-lỗi. KHÔNG tự rebase, KHÔNG halt cả vòng runner — item đậu lại như mọi `blocked` khác, đi lại đường `blocked → todo/doing` sẵn có khi người xử lý xong.
- **RUL30 (`headAtReturn` — đối xứng `headAtTake`, nguồn diff của một đề xuất pull-door).** `return` verify xanh ghi thêm `headAtReturn` (HEAD host repo tại đúng thời điểm đó) lên CÙNG sự kiện settle về `awaiting-approval` (claim mới: `todo→awaiting-approval` hoặc `blocked→awaiting-approval`; không ghi bền vào `doing`) (per pr-lifecycle / 1359ab5e) — cổng duyệt dùng dải `headAtTake→headAtReturn` làm nguồn diff trung thực của một đề xuất pull-door. Vắng mặt cho đề xuất runner (không qua `return`) và cho mọi đề xuất tạo trước feature này (tương thích ngược, RUL11 (tiến hóa schema)).
- **RUL31 (lãnh địa fgos tường minh, `init` chỉ đọc-và-ghi-nhận).** Lãnh địa ghi/khóa của fgos là CHÍNH XÁC `.fgos/` (data dir theo cwd) + worktree tmpdir + nhánh `fgw/*`, cộng đúng hai cửa có chủ (merge-sau-duyệt cổng review, và source repo khi một runner worker được giao việc) — mọi thứ fgos làm với file của một harness khác là READ-ONLY, không bao giờ ghi/sửa/xóa. `init` quét marker harness khác (thư mục dấu ấn + khối managed AGENTS.md) chỉ để GHI NHẬN vào manifest `.fgos/coexistence.json`, không bao giờ tạo/sửa `AGENTS.md` của host; lỗi phát hiện không chặn `init` (fail-safe), re-init idempotent (per install-coexistence / f1715488; doctrine đầy đủ: `docs/coexistence.md`).
- **RUL32 (`reason` mới nhất fold lên item, latest-wins — khác khuôn cộng-thêm-không-đè).** Trường `reason` trên một sự kiện `work.move` (reject `awaiting-approval→todo`, hoặc gate-gãy `awaiting-approval→blocked`) được fold thêm lên `item.reason` (Data Dictionary #18) — GHI ĐÈ giá trị cũ mỗi lần (latest-wins), khác hẳn khuôn "cộng thêm, không đè" của outcome/friction/settlement/discovery: đây là ngữ cảnh SỐNG cho lần dispatch kế tiếp (worker cần lý do MỚI NHẤT, không phải toàn bộ lịch sử), không phải một chuỗi ghi nhận lịch sử. Item chưa từng bị đỗ/từ chối không mang trường này — vắng mặt hoàn toàn (tương thích ngược, RUL11 (tiến hóa schema)) (per worker-execution STR33 / 396d9d9e).
- **RUL33 (cạnh `blocked→awaiting-approval` — đồng bộ-lại cơ học, cạnh MỚI DUY NHẤT mà fan-out-parallel thêm vào bảng FSM).** Khi một việc đỗ vì gãy nhập (xung đột/verify-đỏ-sau-nhập/trôi-tích-hợp) được đồng bộ-lại (catch-up) sạch, nó chuyển thẳng `blocked → awaiting-approval` — cạnh này KHÔNG mang `reason` bắt buộc (khác khuôn của `awaiting-approval→todo`/`awaiting-approval→blocked`, cùng khuôn cơ học của `blocked→todo`/`blocked→doing`) và KHÔNG BAO GIỜ đi qua `doing`, nên không tính vào ngân sách chống-lặp (`visitCount`) của việc — phân biệt rõ với người chọn cầm việc qua cửa pull để tự làm-lại tay (claim overlay đọc effective status `doing`, không ghi cạnh bền `blocked→doing`) (per fan-out-parallel / 2e92b7a5, xem spec Runner "Đồng bộ lại một việc đỗ (catch-up)").
- **RUL34 (`branchHeadAtTake`/`branchHeadAtReturn` — cặp marker nguồn-nhánh, luôn tách bạch với `headAtTake`/`headAtReturn`).** Cửa pull `take`/`return` trên một item `blocked` mang nhánh sống ghi CẶP marker riêng — `branchHeadAtTake` (HEAD của NHÁNH lúc `take`, Data Dictionary #19) trên claim record, `branchHeadAtReturn` (HEAD của NHÁNH lúc `return` đo xanh, Data Dictionary #20) trên settlement/lastAttempt khi về `awaiting-approval` — mirror đúng cặp `headAtTake`/`headAtReturn` main-based nhưng KHÔNG BAO GIỜ cùng xuất hiện với cặp đó trên MỘT item: một claim nguồn-nhánh ghi `branchHeadAtTake` thay vì `headAtTake`, một return nguồn-nhánh ghi `branchHeadAtReturn` thay vì `headAtReturn` — trộn hai cặp cho cùng một đề xuất khiến `reviewDiff` của cổng duyệt dựng một dải vô nghĩa (cấm tuyệt đối, kiểm bằng test). `branchHeadAtTake` là discriminator DUY NHẤT `return` dùng để rẽ nhánh nguồn-nhánh — không dùng `classifySource` (nó ưu-tiên-nhánh và nhập nhằng với một pull-take main-based mà nhánh vẫn còn sót lại) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- **RUL35 (domain — chiều thứ ba chi phối bộ stage, song song status/stage).** Một domain khai: danh sách stage có thứ tự, step-mapping (bước nào trong 5 bước base-workflow mỗi stage thỏa), cạnh chuyển-stage hợp lệ riêng của nó, skill ứng với mỗi stage, cộng ba khai báo ngoài chiều `stage` — có đi qua worktree/merge git thật hay không, nhãn phạm-trù cho từng status đầu chuỗi, và bộ `kind`/`risk` hợp lệ. Domain KHÔNG BAO GIỜ chi phối bảng chuyển-status (`fsm.mjs`): nó được quyền ĐẶT NHÃN cho status, không được quyền đổi cạnh; và bốn chặng đuôi (`delivered`/`retrospective`/`cleanup`/`done`) thì mọi domain đi y hệt nhau, không đặt nhãn lại được. Hôm nay tồn tại bốn domain: `coding` (sản xuất thật) cộng ba fixture minh họa `synthetic`/`triage`/`fixture-marketing` (xem "Mô hình domain" trên); cả `add`/`submit` đều có flag `--domain` (mặc định `coding` khi vắng) nối thẳng vào cửa CLI thật (per base-workflow-model / 2ae492d8, hoàn tất S1+S2). Item vắng `domain` (mọi item tạo trước base-workflow-model) đọc ra `coding` — mặc định lazy, cùng khuôn mặc định lazy của `stage`. Một giá trị `domain` lạ tại các điểm đọc nóng (frontier/vòng tự hành/bảng chuyển-stage) fail-safe về `coding` kèm cảnh báo, không throw.
- **RUL44 (đồ thị cạnh-định-kiểu hợp nhất — bất biến phi-chu-trình toàn đồ thị).** Quan hệ giữa các work item được mô hình hóa thành MỘT đồ thị cạnh-định-kiểu DẪN XUẤT (không phải một trường lưu trữ mới): mỗi phần tử `deps` là một cạnh **chặn** (`blocks`), mỗi `parent` là một cạnh **cha-con** (`parent-child`) — hướng cạnh là "nguồn chờ đích" (một gốc chờ hậu duệ của nó, đúng theo lineage của frontier: cạnh cha→con). Bất biến phi-chu-trình của cửa ghi phủ TOÀN đồ thị hợp nhất này (chặn + cha-con), không chỉ `deps`: `add`/`edit` từ chối mọi ghi khép một chu trình — kể cả chu trình TRỘN (một cạnh chặn cộng một chuỗi cha-con) hay chu trình cha-con thuần — với lỗi phạm trù `validation` (mã thoát 4). Đây là supersession CÓ CHỦ Ý của thiết kế "deps và parent tách bạch tuyệt đối" (record ADR0002 (mô hình việc phẳng — một loại work item, một FSM, epic là item thường) → record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)): hai quan hệ giữ lưu trữ + điều-phối riêng (RUL24 (lineage parent tách bạch với deps về lưu trữ và điều-phối)) nhưng là một đồ thị cho phép kiểm chu trình. Bốn LOẠI CẠNH của mô hình là `blocks` / `parent-child` / `waits-for` / `discovered-from`. `blocks`/`parent-child` có nguồn dữ liệu từ `deps`/`parent` và tham gia bất biến acyclic. `discovered-from` NAY CÓ trường lưu trữ thật (`discoveredFrom`, xem Data Dictionary #22) và hai nguồn sinh (tường minh lúc khai việc, hoặc tự động khi trợ lý báo phát-hiện lúc thi công — xem spec Runner "Báo việc-phát-hiện từ trợ lý", per work-graph-intelligence S2b / 8cf7effe) nhưng là cạnh KHÔNG chặn theo đúng thiết kế ban đầu — loại trừ khỏi phép kiểm chu trình. `waits-for` (chờ mềm) VẪN là TỪ VỰNG MÔ HÌNH đã khai, chưa có trường lưu trữ hay nguồn sinh — chưa có driver fgOS cụ thể nào cần tới nó, deferred có chủ ý (per work-graph-intelligence S2b / 81322763) tới khi một use-case thật xuất hiện. Chỉ hai loại cạnh chặn (`blocks`, `parent-child`) tham gia bất biến acyclic (per work-graph-intelligence S2a / b5c0ba0c, record ADR0012 (đồ thị typed-edge derive trên work item — deps→blocks, parent→parent-child, bảo đảm acyclic hợp nhất)).
- **RUL45 (`awaitingContext` — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm, không lưu trữ).** Với mọi item `awaiting-human` có `parent`, `list` tính thêm một khóa cộng thêm `awaitingContext[id]` — KHÔNG BAO GIỜ lưu vào bản chiếu hay nhật ký, tính lại mỗi lần đọc từ đúng dữ liệu đang có — không "session" nào sống ngoài nhật ký/bản chiếu; không có transcript nào được lưu lại hay phát lại. Nội dung luôn mang `parent: {id, title, status}` lấy từ trạng thái SỐNG hiện tại của gốc — neo luôn cập nhật, không đông cứng tại lúc hỏi; gốc trỏ một id không còn giải được trong bản chiếu degrade về không có neo (cùng khuôn dung sai id-treo đã có cho `parent`/`discoveredFrom` ở nơi khác trong schema này). Cộng thêm khóa `changedSinceAsk` — mảng `{field, from, to}` — CHỈ khi so ảnh chụp G3 (`parentSnapshotAtAsk`) với gốc hiện tại thấy khác trên `title` HOẶC `status` (so sánh chuỗi chính xác, không trim/normalize — cố ý, không phải thiếu sót); khóa này VẮNG MẶT hoàn toàn khi so ra không có gì đổi HOẶC khi item không mang G3 (item tạo trước tính năng này, hoặc gốc không giải được lúc `ask`) — hai trạng thái "đã so, không đổi" và "không có gì để so" không bao giờ lẫn vào nhau qua cùng một mảng rỗng đại diện cho cả hai. Bộ trường so sánh CHỈ gồm `title`/`status` — schema nay đã có `priority`/`intent` (Data Dictionary #25/#26, str7-str8-priority-intent) nhưng chưa được thêm vào bộ so sánh này hay assignee/owner nào khác; mở rộng bộ trường này khi có nhu cầu thật là follow-up tự nhiên, không phải khoảng hở của luật này. `list` không có item nào thuộc diện `awaiting-human`-có-`parent` thì không sinh khóa `awaitingContext` ở envelope — hành vi `list` với các repo/item không thuộc diện này y hệt trước khi tính năng này tồn tại (per str61-chat-context-continuity / 14091e58, 19330e09, bce79d8a).
- **RUL48 (thử-lại-một-lần: ĐÃ RÚT cùng với phán-quan lồng bên trong).** Luật này từng mô tả cách context-discovery và phán chia-việc xử lý một lời gọi model hỏng: lỗi thật (không phản hồi, hết giờ) rơi thẳng fail-safe, còn phản hồi thành công mà nội dung không đọc được thì gọi lại đúng MỘT lần với chỉ dẫn định dạng nghiêm ngặt hơn (per str68 / 87536f3f). Cơ chế đó không còn tồn tại: cả hai phép phán đều đã bỏ phán-quan lồng bên trong, verdict nay do người gọi cung cấp, nên không còn lời gọi model nào bên trong verb để mà thử lại. Cái CÒN NGUYÊN là kỷ luật fail-safe mà luật này bảo vệ: một verdict không đọc được hoặc không đạt hợp đồng nội dung (vd verdict chia có con thiếu verify thật) KHÔNG BAO GIỜ được âm thầm cho qua — item ở nguyên trạng cho lượt sau, không có nhãn hay trạng thái thứ ba nào phát sinh, và không bao giờ throw ra ngoài.
- **RUL49 (Compound-learning đổi trục: từ stage sang status `retrospective`).** Bước tổng hợp/học sau-thi-công từng là stage thứ tư của `coding` (`compound-learn`, chèn sau `executing`). Stage đó ĐÃ RÚT; bước này nay là một chặng trên chiều `status` — `retrospective`, nằm giữa `delivered` và `cleanup` trong chuỗi đuôi dùng chung mọi domain (Data Dictionary #4). Lý do đổi trục: phần vòng đời sau merge không còn "loại tác vụ" nào để `stage` phân biệt, chỉ còn "đang ở đâu" — đúng câu hỏi `status` trả lời. Điều luật này bảo vệ giữ nguyên: tổng hợp là một chặng quan sát-được, FSM-hóa, không phải một phản xạ có thể bị bỏ sót lặng lẽ (per compound-learn-enduser-docs / 9c67c3d1, đổi trục sau đó).
- **RUL50 (không đóng được nếu chưa qua tổng hợp — nay do hình dạng chuỗi, không do một gate riêng).** Một item không thể tới `done` mà chưa đi qua bước tổng hợp. Trước đây điều này được cưỡng chế bằng một gate gắn ở cả hai cửa vào `done`, kiểm "item đã qua stage `compound-learn` chưa". Gate đó không còn cần thiết: `done` nay chỉ có đúng một lối vào `cleanup→done`, và `cleanup` chỉ tới được từ `retrospective`, nên chuỗi tuần tự TỰ NÓ đảm bảo điều luật này — không còn đường vòng nào để lách. Điều khác biệt đáng ghi: luật này giờ áp dụng cho MỌI domain như nhau (chuỗi đuôi dùng chung), thay vì chỉ domain nào khai stage tổng hợp. Bản ghi học câu-6 tự động lúc đóng (RUL21 (câu-6 tự động — bài học lúc đóng)) không đổi.
- **RUL51 (verb `compound` — nay là cửa GẮN NHÃN, không còn là cửa chuyển stage).** `fgos compound <id>` từng là hành động chủ ý duy nhất mở lối vào stage `compound-learn`. Stage đó rút, nên verb KHÔNG còn chuyển stage nào — nó chỉ ghi nhãn tài liệu lên bản ghi outcome. Điều kiện tiên quyết đổi theo: verb đòi item đang `status: retrospective` (không còn là `awaiting-approval`) — item ở status khác bị từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Cờ TÙY CHỌN `--doc-type <quadrant>`: khi có mặt, giá trị được KIỂM TRƯỚC MỌI GHI (đúng một trong bốn quadrant) — sai thì từ chối `validation` (mã 4), không sự kiện nào ghi. Cờ `--doc-path <path>` đi kèm ghi con trỏ linkage lên cùng bản ghi outcome đó — xem RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome). Vì không còn nhánh chuyển-stage nào, ca "gọi lại lần hai trên item đã ở stage tổng hợp" mà luật cũ phải xử lý riêng cũng biến mất: mọi lời gọi hợp lệ nay đi đúng một đường ghi outcome (per + producer & linkage bước-3 compound-learn-enduser-docs).
- **RUL52 (nhãn Diataxis `docType` — trường capture cộng-thêm, trực giao và tùy chọn).** Bản ghi capture của chặng tổng hợp (outcome VÀ friction) mang thêm một trường TÙY CHỌN `docType` — nhãn phân loại tài liệu Diataxis theo chiều audience, đúng một trong bốn quadrant `tutorial`/`how-to`/`reference`/`explanation`. Chiều này TRỰC GIAO với type-axis kỹ sư (pattern/decision/failure): một chiều CỘNG THÊM, không thay thế. Kiểm hình dạng chỉ KHI có mặt — giá trị ngoài bốn quadrant bị từ chối `validation`; vắng mặt/`null` luôn hợp lệ (chưa gắn nhãn), không bao giờ bắt buộc — cùng khuôn optional-additive với `docsRef` (RUL nền của Data Dictionary #23). KHÔNG event type mới, KHÔNG đổi fold: trường đi ké payload thô của `work.outcome`/`work.friction` nên sống sót replay/rebuild qua chính spread-fold sẵn có, cơ chế không đổi một byte. `fgos check` hiển thị `docType` khi có mặt (trên khối outcome và trong record friction gần nhất); log chưa có nhãn nào giữ hình dạng đầu ra byte-for-byte như trước khi trường tồn tại. BÊN SẢN XUẤT nhãn nay đã tồn tại: cờ TÙY CHỌN `--doc-type <quadrant>` trên verb `compound` (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) ghi một `docType` thật lên bản ghi outcome — nên `fgos check` hiển thị nhãn thật, không còn chỉ là khả năng. Cờ tái dùng đúng kiểm slice-2 (giá trị ngoài bốn quadrant bị từ chối `validation`); vắng cờ thì `compound` giữ hành vi cũ byte-for-byte. Lớp phán đoán tổng hợp cấp nhãn — kỹ năng `fgos-coding-compounding`, nay kích hoạt theo STATUS `retrospective` chứ không theo một stage — nay cũng đã dựng: nó gom capture thật, phân loại quadrant, gọi `compound --doc-type`, rồi soạn tài liệu người-dùng-cuối đặt dưới `docs/<quadrant>/` có trích dẫn bằng chứng thật; skill nào ứng với status đó tra từ chính bảng skill của domain, nên một domain khác khai skill tổng-hợp riêng thì dùng skill của nó (per + producer/skill slice 3 compound-learn-enduser-docs / 6aa67ae4).
- **RUL53 (con trỏ tài liệu `docPath` — trường linkage cộng-thêm trên outcome).** Verb `compound` nhận thêm cờ TÙY CHỌN `--doc-path <path>`: khi có mặt, ghi trường `docPath` lên CÙNG bản ghi outcome mang `docType`, tại site ghi outcome của verb — trước đây verb có HAI site (một đường chuyển-stage, một đường gắn-nhãn-lại) và bỏ sót một site thì linkage bị nuốt lặng lẽ; nay verb không chuyển stage nữa nên chỉ còn đúng một đường ghi, và cái bẫy đó không còn. Trường này trực giao và tùy chọn hệt `docType` (RUL52 (nhãn Diataxis docType — trường capture cộng-thêm, trực giao và tùy chọn)): `compound` (đã deprecated, khuyến nghị `fgos doc`) đòi đường dẫn đã commit ở HEAD của main checkout; khi bật `docRegistry.enforce`, đường dẫn phải là currentPath đã đăng ký, không ambiguous hay alias, KHÔNG event type mới, KHÔNG đổi fold — đi ké payload thô của `work.outcome` nên sống sót replay/rebuild qua chính spread-fold sẵn có, tầng lưu không đổi một byte. Vắng cờ thì `compound` giữ hành vi cũ byte-for-byte (kể cả bare `compound` không cờ nào; chỉ có `--doc-type` mà không `--doc-path` vẫn ghi `docType` bình thường, `docPath` là `null`). `fgos check` hiển thị `docPath` khi có mặt. Con trỏ này là NỀN cho chỉ mục đọc-theo-tag (area `enduser-docs-index`): mỗi tài liệu người-dùng-cuối truy ngược được về capture đã sinh ra nó, nên khi dựng lại tài liệu (slice gộp-sống về sau) không mất chi tiết/cấu trúc (per bước-3 compound-learn-enduser-docs).
- **RUL54 (sổ verb máy-đọc không bao giờ in nhầm tham số positional thành cờ bắt buộc).** Một tham số CHỈ nhận qua vị trí trên dòng lệnh (positional — vd `text` của `submit`) được đánh dấu riêng trong sổ verb máy-đọc; dạng trợ giúp chữ cho người đọc in "positional: `<tên>`" cho tham số đó, KHÔNG BAO GIỜ "required: `--<tên>`" — trước fix này, sổ verb in nhầm mọi tham số bắt buộc thành dạng cờ dù tham số chỉ nhận positional, khiến người dùng thử một cờ chưa từng hoạt động. Tham số vừa nhận positional vừa nhận qua cờ (vd `id` của `discover`/`take`) in cả hai dạng phân biệt. Sổ verb máy-đọc (`--help --json`) không đổi hình dạng — chỉ dạng chữ cho người đọc đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL55 (trợ giúp theo từng verb luôn có thật, không tác dụng phụ).** `fgos <verb> --help` (không kèm `--json`) luôn in mục trợ giúp CỦA RIÊNG verb đó, thoát mã 0, không ghi sự kiện/đổi bản chiếu/tác dụng phụ nào — áp dụng ĐỒNG NHẤT cho mọi verb kể cả `init` (gọi `init --help` không chạy `init` thật, không tạo `.fgos/`). Trước fix này, verb không có xử lý `--help` riêng: hầu hết verb rơi vào nhánh lỗi thiếu-tham-số (thoát mã 4, một dòng chẩn đoán thay vì trợ giúp thật), còn `init --help` lặng lẽ bỏ qua cờ và chạy `init` thật (tác dụng phụ ngoài ý muốn). `fgos --help` (không kèm tên verb) và `fgos <verb> --help --json` không đổi (per str77-79-doc-gap-fixes / ea8b9a8d).
- **RUL56 (`pick` — `take` + dựng workspace trong MỘT lệnh, role cố định, không rollback claim khi worktree gãy).** `fgos pick` tái dùng NGUYÊN VẸN logic claim của `take` (cùng CAS, cùng luật frontier, cùng đường tái claim nguồn-nhánh) — khác đúng một điểm: role LUÔN `session`, không có cờ `--role` (per str83-fgos-slash-commands — role cửa pull tự-hoàn-tất bằng chính phiên được dispatch, không phải một proxy). Ngay sau claim, `pick` dựng/tái dùng workspace qua CHÍNH `createWorktree` (spec Runner) — không một cơ chế dựng-worktree thứ hai. Claim và dựng-workspace không phải một giao dịch nguyên tử: nếu `createWorktree` ném lỗi SAU KHI claim đã ghi, `pick` không tự động hoàn tác claim đó — lỗi lộ ra nguyên vẹn, item ở lại `doing` không worktree, người gọi tự xử lý tiếp (per str83-fgos-slash-commands / 757e5dd7).
- **RUL57 (`init`'s cảnh báo git-headless là dữ liệu cộng-thêm, không bao giờ chặn `init`).** `init` tự kiểm project directory có HEAD git resolve được hay không, cùng kỷ luật fail-safe với bước quét coexistence-manifest liền kề: lỗi đọc (git vắng mặt, không phải repo git, hay repo có 0 commit) không bao giờ ném ra ngoài, không bao giờ đổi mã thoát của `init`. Khi không resolve được, kết quả mang thêm `gitHeadless: true` trên CÙNG phong bì `fgos.v1` đã có — một trường dữ liệu thuần, không banner riêng; đây là NHẮC SỚM cho người/agent trước khi chạm `fgos-runner`/`pick`/`take`'s worktree, vốn cần git thao tác thật — không thay thế cho kiểm tra fail-fast của chính vòng tự hành lúc khởi động (xem spec Runner "Kiểm tra tiền-điều-kiện lúc khởi động", RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)) (per D ecfd0d1a).
- **RUL59 (`priority` — khóa sắp-xếp frontier; `intent` đã retired in place, picker vẫn cơ học vĩnh viễn per RUL42 (runner)).** `priority` (Data Dictionary #25) ghi được qua `edit --priority <n>`; discovery còn tính `priority` bằng `computeImpact` và `computePriority` mỗi lần có verdict, rồi ghi `{priority}` qua `editWork` trong một cửa ghi riêng ngay sau bản ghi discovery. Phép ghi nằm trong `try/catch` riêng để lỗi store/lock không chặn kết quả clear/unclear. `intent` (Data Dictionary #26) đã retired in place, không còn là trường discovery tự tính. Priority đổi khóa sắp-xếp của frontier cơ học, không tự đổi tập item lọt frontier (per str7-str8-priority-intent).
- **RUL60 (`submit` — cờ phân loại hiện hành).** `--tier` đã retired và bị từ chối với hướng dẫn dùng `--size` hoặc `--rigor`; `--size`/`--rigor`/`--kind`/`--risk` là các cờ ghi đè độc lập hiện hành. Khi không ghi đè, `submit` dùng phân loại cơ học; risk không được lấy từ size do bên gọi ghi đè. `domain` là trường riêng. Kỹ năng ĐỘC LẬP `fgos-submit-assist` (str51-llm-assist-classify) đã RÚT (tsk-6ar); Trong phiên tương tác sống, `/fgOS:submit` bước 4 gọi `fgos-clarifying` trên raw text trước khi item tồn tại: helper chỉ phân loại `domain`, có thể trả title/description đã viết lại hoặc câu hỏi làm rõ; không phán lại size/kind/risk. Bước 5 gọi `submit` với text/domain đã chốt; bước 6 chỉ báo kết quả. Chỗ phán lại chính thức là `discover` ở discovery, sau research; phần mô tả cờ tier cũ không phải hợp đồng CLI còn sống.
- **RUL61 (writer — danh tính người ghi, cá thể tách bạch khỏi vai, không bao giờ chặn verb).** Ba cửa ghi `work.move`/`work.edit`/`work.step` đều đóng dấu `writer{id,source}` (Data Dictionary #27) lên payload, không điều kiện — nguồn ưu tiên registry đối chiếu → biến môi trường → pid tổ tiên → nhãn `unresolved` (`id` vẫn là pid, không bao giờ rỗng). Registry CHỈ đối chiếu, không bao giờ tự cấp danh tính, và không bao giờ khớp theo thư mục làm việc hay pid của dòng đăng ký — giữ đúng bất biến "hai phiên khác nhau trong cùng worktree không bao giờ gộp làm một danh tính" mà khoá hoạt động cây chính (spec Runner) dựa vào. Một giá trị sai định dạng bị lọc và rơi xuống nguồn kế tiếp tại tầng phân giải, không đi qua validator nào — verb không bao giờ bị chặn vì danh tính không xác định được (per str46-io-contract).
- **RUL58 (Acceptance-clause gate — chặn ở cửa `delivered`, không phải cửa `done`).** Một item mang `acceptance` (Data Dictionary #24) với ít nhất một clause có `text` không rỗng KHÔNG thể tới `delivered` — qua CẢ HAI lối vào (`doing→delivered` thao tác tay, `awaiting-approval→delivered` duyệt đề xuất, RUL4 (chuyển trạng thái chỉ theo bảng cạnh tường minh, done terminal)) — nếu bất kỳ clause nào trong số đó thiếu `evidence` không rỗng; nỗ lực bị từ chối `precondition` (mã 2), nêu đích danh clause đầu tiên thiếu bằng chứng, item ở nguyên trạng, không sự kiện nào ghi thêm. Gate ĐỨNG Ở `delivered` chứ không phải `done` là có chủ đích: `delivered` là chỗ code thật sự vào cây chính, nên bằng chứng phải đủ TRƯỚC lúc đó — chờ tới `done` thì đã muộn ba chặng. Phép kiểm chạy TRƯỚC khi sự kiện được ghi, bên trong CÙNG phiên giữ khóa `events.lock`; cửa duyệt còn chạy sẵn cùng phép kiểm này như một bước tiền-kiểm trước mọi thao tác merge, thay vì chỉ bắt được sau khi merge đã xảy ra. Gate này CHỈ ĐỌC `item.acceptance`, không bao giờ tự ghi bằng chứng — bằng chứng được bổ sung qua `edit --acceptance` sẵn có (không có cửa ghi mới), rồi thử đóng lại: phép kiểm luôn đọc trạng thái TƯƠI, không có verdict lưu-đệm từ lần từ chối trước. Item vắng `acceptance`, hoặc mang mảng rỗng, hoàn toàn không bị gate này chạm tới — đóng y hệt hành vi trước tính năng này. Gate này mechanically chỉ kiểm SỰ HIỆN DIỆN của `evidence`, không bao giờ phán xét TÍNH ĐÚNG của nó — cùng ranh giới tin cậy mà chính CoS check của bee tự áp cho backlog PBI của nó, port sang work-item fgOS (per str73-done-flip-cos-check / 0f3b6eb0, 0e575f83).
- **RUL64 (`holder` — trục thứ ba TRỰC GIAO status × stage, opt-in per-domain, chỉ đổi qua verb `handoff`).** `work.holder` (per tsk-2t9c) là trường tùy chọn giống `stage`/`domain` — vắng mặt trên MỌI item hiện có, và vẫn hợp lệ vắng mặt trên domain nào không khai `roleGraph` trong `DOMAINS` registry. Domain CÓ khai `roleGraph` ràng buộc `holder` phải là một trong `roleGraph.roles`; domain KHÔNG khai thì `holder` phải vắng mặt tuyệt đối — ghi `holder` lên item của domain không có roleGraph bị từ chối `validation`. `holder` KHÔNG nằm trong `EDITABLE_FIELDS` (`store.mjs`) — cùng loại trừ `stage`/`status`/`domain` đã có, đổi `holder` CHỈ qua verb `fgos handoff`/`fgos handoff-return`, không bao giờ qua `edit`. `fgos handoff <id> --to <role> --reason <advise|assist|review|consult>` tra hợp lệ qua `roleGraph.edges[stage]` of domain (một cặp `{from, to, reason, mode}`); route ngoài graph bị từ chối kèm DANH SÁCH edge hợp lệ trong message — "chặn và dạy tại chỗ", không chỉ một `false`. Loại `async` ghi event `work.handoff` (đổi `holder`, checkpoint đầy đủ); loại `sync` ghi event `work.call-summary` (KHÔNG đổi `holder`, bản ghi gọn) — bất biến: `holder` chỉ đổi qua handoff async, không bao giờ qua call-summary. `fgos handoff-return <id>` đóng call async đang mở gần nhất, trả bóng về đúng người mở nó ("call = round-trip") — KHÔNG tra lại `roleGraph` (hoàn tất một call đã được duyệt hợp lệ lúc mở không cần xét hợp lệ lần hai); độ sâu call lồng (`callstackCap`, mặc định 3 trong `roleGraph`) suy ra thuần từ việc phát lại log (`callThreads[id]`, ngăn xếp LIFO trên các entry `handoff` chưa `returning`), không bao giờ một biến đếm lưu trữ — biến đếm có thể trôi khỏi log, một phép phát lại thì không. Cả hai event type gấp vào khoá LAZY `view.callThreads[id]` (mirror khuôn `view.discovery`/`view.outcomes` sẵn có) — một log không có event nào trong hai loại này phát lại y hệt trước tính năng, không `callThreads` key, không `holder` field (per tsk-2t9c).
- **RUL66 (`fgos resolve-park-reason` — xóa `reason`/`parkReason` tồn dư trên item kết thúc).** Trên item đã ở trạng thái kết thúc (`done` hoặc `wontfix`), trường `reason` hoặc `parkReason` từ một đợt đỗ cũ không còn là ngữ cảnh sống nhưng có thể gây hiểu lầm cho người đọc `fgos show`/`fgos list`. Verb `fgos resolve-park-reason <id> --note "<giải trình>"` xóa các trường này khỏi `item` (bỏ khóa `reason`/`parkReason` trên view phát lại) và lưu bản ghi giải trình vào `view.parkResolutions[id]` qua sự kiện `work.resolve-park-reason`. Chỉ áp dụng cho trạng thái kết thúc `done` hoặc `wontfix` (từ chối `validation` với mọi trạng thái khác) và bắt buộc `--note` không rỗng để đảm bảo tính giải trình audit-trail của nhật ký.
- **RUL65 (`workflows`/`resolveWorkflow` — hierarchy domain × N workflow, mechanism-first, `feature` là tham chiếu chứ không phải bản sao).** Theo tsk-2t9c: `DOMAINS.coding` có thêm `workflows` (map tên workflow → `{stages, stepMap, transitions}`), `defaultWorkflow` (`'feature'`), và `workflowFor` (map `kind` → tên workflow, RỖNG hôm nay — mọi kind fold về `defaultWorkflow`). `workflows.feature.{stages,stepMap,transitions}` KHÔNG phải bản sao của `domain.stages`/`stepMap`/`transitions` — cùng MỘT tham chiếu object (kiểm chứng bằng `===`, không chỉ deep-equal), nên không có nơi thứ hai để hai bản trôi lệch nhau. `resolveWorkflow(domain, kind)` (`workflow-stage-graphs.mjs`) là hàm phân giải: trả về `undefined` khi domain không khai `workflows` (mọi domain trừ `coding` hôm nay — cùng khuôn absent-key `roleGraphFor`/`classificationVocabulary` đã dùng), không bao giờ ném lỗi. **Cố ý CHƯA nối vào đường nóng** (`stage-fsm.mjs`, `frontier.mjs`, `intake/discovery.mjs`, `intake/plan.mjs`) — vì `workflows.feature` là CHÍNH các field domain-level đang dùng (tham chiếu giống hệt), nối dây hôm nay không đổi hành vi một byte, chỉ thêm rủi ro chỉnh sửa vào các module đã kiểm chứng kỹ mà không có lợi ích nào; nối dây thật sự chỉ cần thiết — và chỉ khi đó mới an toàn để làm — lúc workflow thứ hai (`bugfix`/`lightweight`, hoãn theo D7a) thật sự tồn tại. Bằng chứng gồng của graph đơn hiện có: 47% backlog thật (363/768 item) là `kind: bug`, và luật "chứng minh nguyên nhân trước khi sửa hành vi" khác bản chất `feature` nhưng đang chịu chung một graph.
```

## claim_9c1c886afbca77d8cb83284e29252c80

`docs/platform/work-state/spec.md#unheaded-block-94`
Unit SHA256: `dbace0a231a15099a8ff774d2c937cdbeaa8ea0eee650a1262c913f28cadc1ab`
Shown SHA256: `dbace0a231a15099a8ff774d2c937cdbeaa8ea0eee650a1262c913f28cadc1ab`

```text
- Tiêu đề unicode (tiếng Việt, CJK, emoji) đi qua toàn tuyến ghi-đọc-rebuild nguyên vẹn (test đầu-cuối).
- Kỳ vọng cũ dùng lại lần hai (double-apply) bị chặn ở `conflict`, nhật ký không phình (test đầu-cuối).
- Dòng cuối nhật ký đứt giữa chừng: phát hiện to và rõ, phần trước còn nguyên; đây là trường hợp DUY NHẤT được tha thứ khi đọc — hỏng giữa nhật ký là lỗi cứng.
- Nhiều tiến trình OS THẬT (fork) cùng gọi `appendEvent` trên một nhật ký đồng thời: mọi `seq` vẫn duy nhất, không trùng, không hở, tăng ngặt — `.fgos/events.lock` liên-tiến-trình tuần tự hóa chuỗi đọc-seq/append (per RUL10 (tiền đề có ngưỡng) bổ chú). Có test khóa fork nhiều tiến trình con thật, đồng bộ về một mốc khởi động chung để các đợt append thật sự chồng cửa sổ (mirror kỹ thuật spike ép-đua); một kiểm chứng vứt-đi cho thấy chính hình dạng đọc-rồi-append KHÔNG khóa va trùng nặng dưới cùng tải, nên test không rỗng-nghĩa.
- Hai tiến trình OS THẬT cùng gọi `addWork` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `validation` "already exists" thật (không crash/treo), nhật ký chỉ mang đúng MỘT sự kiện `work.add` cho id đó. Cùng kỹ thuật fork-đồng-bộ, cùng test khóa vứt-đi-nếu-thiếu-khóa (per RUL10 (tiền đề có ngưỡng) bổ chú 2, store-atomic-rmw) — chứng minh bằng cách tạm bỏ khóa (git stash bản vá) rồi chạy lại: cả 2/2 test race đỏ đúng như dự đoán (6/6 tiến trình đua cùng thắng thay vì 1/6), phục hồi bản vá thì cả hai xanh trở lại.
- Hai tiến trình OS THẬT cùng gọi `moveWork` với CÙNG `expectedStatus` trên CÙNG một id đồng thời: đúng một tiến trình thắng, phía thua nhận `conflict` CAS thật, nhật ký chỉ mang đúng MỘT sự kiện `work.move` khớp cạnh đó cho id đó (cùng kỹ thuật, cùng cell trên).
- Id trùng khi khai: từ chối, không sự kiện thừa.
- Cờ thiếu giá trị/rỗng ở `move` được phân loại `validation` (mã 4), không nhầm sang `precondition`/`conflict` — chốt từ review, có test khóa (phase-1-review-fixes).
- Nhật ký di sản (trước v2, thiếu tier/v) replay nguyên vẹn với default; nhật ký trộn cũ/mới cùng kết quả — test khóa bằng fixture sinh từ binary Phase 1 thật (`test/fixtures/phase1-events.jsonl`).
- View lệch-còn-tồn-tại (khác view mất): `rebuild` ghi đè toàn phần từ log, có test khóa đúng chế độ hỏng này; đọc không bao giờ tự sửa file view.
- Item được nhận rồi đóng ở hai thời điểm khác nhau (dự đoán lúc nhận, thực tế lúc đóng): cả hai nửa còn sống trong bản chiếu, không nửa nào bị mất — test khóa.
- Log không mang bản ghi outcome nào: bản chiếu không có key outcome (vắng mặt, không phải rỗng) — hành vi so-khớp bản chiếu cũ giữ nguyên (test tương thích ngược).
- Item `awaiting-human` không bao giờ vào tập việc-sẵn-sàng, và item có dep đang `awaiting-human` không được mở — cả hai có test khóa (không cần sửa bộ lọc frontier: bộ lọc `todo` sẵn có đã loại).
- Cạnh vào chờ thiếu câu hỏi / cạnh rời chờ thiếu câu trả lời bị chặn ở `validation` — cùng khuôn cạnh từ-chối `awaiting-approval→todo` thiếu lý do; câu hỏi/câu trả lời bị bỏ qua (không vào payload) trên mọi cạnh khác, hệt như `reason`.
- Log không mang sự kiện cổng nào: bản chiếu không có key bản-ghi-cổng (vắng mặt, không phải rỗng) — tương thích ngược, cùng khuôn bản ghi outcome.
- Item `awaiting-human` mà `parent` trỏ một id không giải được (gốc đã xóa/không tồn tại): `awaitingContext` cho item đó coi như không có gốc — không throw, không `changedSinceAsk`, cùng khuôn dung sai id-treo đã có cho `parent` ở nơi khác (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- Item `awaiting-human` được park TRƯỚC khi tính năng `awaitingContext` tồn tại (không mang G3 trong bản ghi cổng): `list` vẫn hiện `parent` hiện tại của nó bình thường, nhưng không có khóa `changedSinceAsk` — im lặng đúng nghĩa "không có mốc để so", không phải "đã so và không đổi" (RUL45 (awaitingContext — neo gốc cho cổng chờ-người, dẫn xuất đọc-thời-điểm)).
- `answer` một item rồi `ask` lại đúng item đó lần hai: G3 của lần `ask` sau ghi đè hoàn toàn ảnh chụp gốc của lần trước, không gộp hai ảnh cũ/mới.
- Hai lần `submit` cùng một mô tả (cùng title suy ra): id lần hai tự khác id lần đầu — thử lại với hậu tố dài hơn cho tới khi hết trùng, cả hai item cùng tồn tại, không lỗi "id trùng".
- `submit` với mô tả không khớp từ khóa phân loại nào: vẫn tạo item thành công, `tier`/`risk` về mặc định `standard`, `kind` về mặc định `task` — không lỗi, không chặn.
- `submit --deps <id-không-tồn-tại>`: từ chối `validation` (mã 4) qua ĐÚNG cửa kiểm `add` đã dùng, không sự kiện nào ghi — cùng khuôn `add` với dep lạ.
- `submit --deps <id1,id2>` hợp lệ: cả hai id được ghi vào `deps` của item mới, đi qua đúng kiểm chu trình sẵn có; `submit` không kèm `--deps`: `deps: []`, byte-identical hành vi trước khi cờ này tồn tại.
- Context-discovery verdict đủ rõ: item rời `discovery` vào stage `planning` (không thẳng `executing`) MANG THEO verify thật trong đúng một sự kiện — không có khoảng hở nào item rời chuỗi soi-rõ mà verify còn placeholder giả.
- Context-discovery verdict chưa đủ rõ: item rời `discovery` vào `exploring` để đào sâu cùng người, rồi mới `exploring → planning`. Hai đường này là toàn bộ lối ra của `discovery`; không có cạnh nào đi thẳng tới `executing`.
- Phán chia-việc trả verdict pass-through (item đơn giản, hoặc không có gì để chia): gốc chuyển thẳng `planning → executing`, giữ nguyên verify đã có từ lúc rời chuỗi soi-rõ — không gắn lại verify lần hai.
- Phán chia-việc trả verdict chia (n≥1 con): mỗi con sinh qua đúng một cửa ghi, mang `parent` trỏ về gốc, `deps` nội bộ theo đề xuất, và verify THẬT của riêng nó; gốc chuyển `planning → executing` ngay sau khi sinh đủ con nhưng KHÔNG lọt frontier cho tới khi mọi con ngã-ngũ (chặn qua lineage, không qua deps).
- Sinh con giữa chừng bị crash (một vài con đã ghi, gốc chưa kịp chuyển stage): lượt quét sau phát hiện gốc đã có con mang `parent` trỏ về nó qua view hiện hành, không sinh thêm con trùng — chỉ hoàn tất việc chuyển stage gốc còn dang dở (re-entrancy an toàn, không đẻ đôi con).
- Phán chia-việc trả verdict cần người quyết (tự báo mơ hồ) hoặc gốc mang risk `heavy`: gốc đậu `awaiting-human` mang đề xuất chia (danh sách con + deps đề xuất) làm câu hỏi — chưa ghi con nào vào queue; người trả lời xong, gốc về `todo` ở stage `planning`, lượt sau phán lại từ đầu.
- Verdict chia có bất kỳ con nào thiếu verify thật, hoặc không có verdict nào đọc hiểu được: verdict bị coi là không hợp lệ toàn bộ — gốc ở nguyên trạng thái/stage hiện tại, không con nào được ghi, không pass-through ngầm; lượt sau thử lại (fail-safe, không bao giờ throw).
- Lượt quét cơ học của vòng tự hành gặp một item ở stage soi-rõ/lập-kế-hoạch mà không có verdict nào được cung cấp: để item nguyên tại chỗ, KHÔNG tự phán hộ và không throw — chờ một phiên sống tới quyết (RUL48 (thử-lại-một-lần: đã rút cùng với phán-quan lồng bên trong)).
- Gốc có ≥1 hậu duệ dang dở (chưa `done`): gốc không bao giờ được runner dispatch dù chính gốc đang `todo` ở stage `executing` — bộ lọc frontier chặn qua chuỗi `parent`, không qua `deps`; khi hậu duệ cuối cùng đóng, gốc tự nhiên lọt frontier ở lượt quét kế tiếp mà không cần thao tác tay nào, rồi tự chứng minh bằng verify của chính nó.
- Một con bị `blocked`/đỗ giữa chừng không sinh trạng thái "bộ khẩn" mới: nó đi qua đúng cơ chế `blocked`/friction sẵn có như mọi item; gốc đơn giản vẫn bị chặn dispatch cho tới khi con đó thật sự `done`.
- Item đơn giản đi qua lượt quét soi-rõ rồi lượt quét chia-việc trong CÙNG một lượt chạy `--once`: cả hai ngã-ngũ (clarify-pass rồi pass-through) hoàn tất trước khi vòng dispatch thi công của lượt đó bắt đầu — không cần đợi lượt sau.
- Context-discovery ra verdict chưa đủ rõ nhiều lần liên tiếp trên cùng item (người trả lời rồi vẫn chưa đủ): mỗi lần soi một bản ghi discovery riêng, tất cả còn sống — không lần nào bị mất; vòng lặp không có trần cố định (con người luôn là bên gate mỗi lượt lặp).
- Item còn đỗ trên bí danh di sản `decompose`: vẫn đi tiếp được qua `decompose → executing` như trước, và tra ra đúng skill mà `planning` tra ra — bí danh không bao giờ làm một item mắc kẹt. Nhưng KHÔNG item mới nào tới được đó: phép tra "stage nào thỏa bước Chia-việc" luôn trả `planning`.
- Item tạo qua `add` không mang field `stage`: đọc ra `executing` (mặc định lazy), xuất hiện trong `ready` ngay như hôm nay — hành vi `add`/legacy không đổi một byte.
- Nhật ký di sản thật đã có sẵn một ngã-ngũ đóng (`→done`) từ trước khi khái niệm phiên bản schema tồn tại: replay KHÔNG tự sinh bản ghi settlement cho nó — bản chiếu lịch sử giữ nguyên byte-for-byte (test khóa bằng fixture nhật ký Phase 1 thật).
- Item đóng mà chưa từng chạy, chưa từng thất bại, chưa từng qua ngã-ngũ nào khác vẫn nhận đúng một bản ghi học tối thiểu — không rỗng-im-lặng, không lỗi.
- Soạn bài học lúc đóng gặp dữ liệu bất thường: transition đóng vẫn thành công (item vẫn thành `done`), chỉ bản ghi học của lần đó bị bỏ qua — chưa từng làm hỏng một lần đóng item nào.
- `take` không truyền `--id`: cầm đúng đầu frontier, mặc định `role=human`, ghi `headAtTake` và nửa dự đoán — chứng minh qua CLI thật. `take --id` một item đã bị cầm rơi thẳng xuống CAS của `move`, báo `conflict` thật (mã 3), không phải một thông điệp validation trùng lặp.
- `return` từ chối sạch khi working tree bẩn, hoặc khi HEAD chưa tiến so `headAtTake` (kể cả tree sạch nhưng zero tiến bộ thật) — cả hai `validation`, item giữ nguyên `doing`, không sự kiện nào ghi thêm.
- `return` verify xanh: `doing → awaiting-approval` + nửa thực tế, KHÔNG sinh settlement (settlement thuộc cạnh `→done`). `return` verify đỏ: `doing → blocked` (lý do `verify-fail`) + nửa thực tế + một bản ghi friction lớp `verification` — mirror đúng đường đỗ của runner.
- `return` trên một item claim bởi runner (`claimRole: 'runner'`, không `headAtTake`) bị từ chối `validation` — cửa pull không đụng vào claim của runner.
- Một `fgos-runner --once` chạy song song khi một người đang cầm item qua `take`: gặt-lại lúc khởi động của runner KHÔNG BAO GIỜ giẫm claim đó (claim người cầm vô thời hạn) — chứng minh bằng e2e qua binary thật, chạy runner song song trước khi người `return` (xem spec Runner "Gặt-lại lúc khởi động").
- Cạnh `awaiting-approval→blocked` thiếu `reason` bị từ chối `validation`, cùng khuôn `awaiting-approval→todo` — test khóa (per pr-lifecycle).
- `return` verify xanh ghi `headAtReturn` lên đúng sự kiện `doing→awaiting-approval`; fold đọc lại được qua rebuild (mẫu `headAtTake`), vắng mặt cho một đề xuất của runner (không qua `return`) — test khóa (per pr-lifecycle).
- Reject/park mang `reason`: giá trị fold lên `item.reason`, đọc lại được qua rebuild (mẫu `claimRole`/`headAtTake`); một lần fold sau GHI ĐÈ lần trước (latest-wins, không cộng thêm) — test khóa cả hai chiều (per worker-execution STR33 / 396d9d9e).
- `take` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing`, ghi `branchHeadAtTake` (không `headAtTake`) — chứng minh qua CLI thật; `take` trên một item `blocked` KHÔNG mang nhánh sống vẫn xung đột như trước (không đường mới nào mở toang `blocked→doing`).
- `return` nguồn-nhánh (item mang `branchHeadAtTake`): đo trên nhánh KHÔNG đụng working tree host repo — verify chạy trong worktree tạm detached tại SHA nhánh, dọn trong `finally` dù thành công hay thất bại; verify xanh + có commit mới → `awaiting-approval` mang `branchHeadAtReturn`, KHÔNG BAO GIỜ mang `headAtReturn` — test khóa cả hai chiều (mutual exclusion) (per human-rounds / 5a6900b2, xem spec Runner RUL30 (headAtReturn — đối xứng headAtTake, nguồn diff của một đề xuất pull-door)).
- `return` nguồn-nhánh khi nhánh KHÔNG có commit mới kể từ `branchHeadAtTake`: từ chối rõ lý do, item giữ `doing`, không sự kiện nào ghi thêm, tip nhánh không đổi — chứng minh bằng test thật.
- `fold` của `branchHeadAtTake`/`branchHeadAtReturn` qua rebuild: chỉ fold trên đúng cạnh của nó (`blocked→doing`/`doing→awaiting-approval`), không bao giờ lẫn với `headAtTake`/`headAtReturn` của cùng item hay của item khác — test khóa (write-side allowlist trong `store.mjs` + read-side fold trong `replay.mjs` đều được kiểm, đây là lỗ CRITICAL mà bee-validating từng gắn cờ trước khi cell dựng thật).
- `pick` không truyền `id`: cầm đúng đầu frontier, role CỐ ĐỊNH `session` (không đọc `--role`, cờ đó không tồn tại trên `pick`), dựng một nhánh + worktree THẬT (không detached) cho claim đó — chứng minh qua CLI thật.
- `pick <id>` trên một item đã `doing`: rơi thẳng CAS như `take`, báo `conflict` (mã 3), không double-claim.
- `pick` trên một item `blocked` mang nhánh `fgw/<id>` sống: claim qua `blocked→doing` (HỆT đường tái claim của `take`), rồi TÁI DÙNG worktree/nhánh sẵn có thay vì dựng bản sao.
- `createWorktree` ném lỗi SAU KHI claim của `pick` đã ghi thành công: lỗi lộ nguyên vẹn ra người gọi, claim KHÔNG bị hoàn tác/che giấu — chứng minh bằng một xung đột namespace nhánh git THẬT, không phải mock.
- `init` trong một repo git có 0 commit: `data.gitHeadless === true`, `init` vẫn thành công (không throw, không đổi mã thoát) — chứng minh qua CLI thật.
- `init` trong một repo git có ≥1 commit, hoặc ngoài một repo git hoàn toàn: không mang trường `gitHeadless` — hành vi/hình dạng output y hệt trước khi kiểm tra này tồn tại; lỗi đọc HEAD không bao giờ làm `init` thất bại (fail-safe, cùng khuôn với kiểm coexistence-manifest liền kề).
- Item mang `domain` lạ (không khớp sổ đăng ký) tới điểm đọc nóng (bộ lọc frontier, vòng tự hành, bảng chuyển-stage): rơi về `coding` kèm một cảnh báo, không crash vòng tự hành — test khóa.
- Item vắng `domain` (100% item hôm nay): mọi hành vi dispatch/chuyển-stage y hệt trước khi tính năng domain tồn tại — test khóa qua toàn bộ suite hiện có, không sửa một assertion nào (retrofit base-workflow-model).
- Đóng một item bằng cách nhảy cóc qua bước tổng hợp: không có cạnh nào để nhảy. `done` chỉ tới được từ `cleanup`, `cleanup` chỉ tới được từ `retrospective` — chuỗi tuần tự tự nó chặn, không cần một gate riêng gắn ở cửa `done` như trước.
- `fgos compound <id>` gọi trên một item KHÔNG ở `retrospective`: từ chối `validation` (mã 4), không sự kiện nào ghi thêm. Gọi đúng lúc item ở `retrospective`: ghi nhãn lên bản ghi outcome, KHÔNG chuyển stage nào (không còn stage nào để chuyển).
- `move --to delivered` (hoặc `approve`) trên một item mang `acceptance` có ít nhất một clause `text` không rỗng nhưng `evidence` rỗng/vắng mặt: từ chối `precondition` (mã 2), nêu đích danh clause đó, item ở nguyên trạng thái/stage hiện tại, không sự kiện nào ghi thêm (RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done), per str73-done-flip-cos-check / 0f3b6eb0).
- Cùng item trên, sau khi `edit --acceptance '<json đã điền evidence>'` rồi thử lại: đi qua — RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) luôn đọc trạng thái tươi, không có verdict lưu-đệm từ lần từ chối trước.
- Item mang `acceptance` mà MỌI clause đều có `evidence` không rỗng: qua `delivered` bằng cả hai lối vào, y hệt hành vi trước khi RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) tồn tại.
- Item KHÔNG mang `acceptance` (vắng mặt hoặc mảng rỗng): RUL58 (acceptance-clause gate — chặn ở cửa delivered, không phải cửa done) không chạm tới — hành vi y hệt trước khi luật này tồn tại (per str73-done-flip-cos-check / 0e575f83).
- `add`/`submit`/`edit --acceptance` với giá trị JSON hỏng dạng (không parse được, không phải mảng, một clause thiếu `text` hoặc `text` rỗng): từ chối `validation` (mã 4), không sự kiện nào ghi thêm — cùng khuôn `--deps`/`--refs` hỏng dạng.
```

## claim_c14d9c927130c2b12217acdf72d69b49

`docs/platform/work-state/spec.md#unheaded-block-95`
Unit SHA256: `5ad9c97f20aa0e6f61669617556fca877509f5f250d714cd0ce1527588631ed1`
Shown SHA256: `5ad9c97f20aa0e6f61669617556fca877509f5f250d714cd0ce1527588631ed1`

```text
- Bản ghi thực tế (outcome) chưa có trường "thời lượng chạy" — nếu cần, đây là một mở rộng schema cộng thêm mới, chưa quyết (nêu lúc validate slice 1 của phase-3-compound-learning).
- Cổng có-phân-loại (typed gates: need-review / need-approval) — vẫn cố ý gộp về một `awaiting-human` chung; thêm nhãn loại chỉ khi có consumer thật cần (, deferred). Riêng nhu cầu "cần làm rõ trước khi thi công" đã giải qua chiều `stage` (`discovery`/`exploring`/`planning`/`executing`) thay vì một loại cổng mới — xem "Giai đoạn Soi-rõ" và "Giai đoạn Lập-kế-hoạch".
- Timeout / nhắc-nhở / đánh-thức khi người vắng lâu — cố ý không làm; đậu vô thời hạn (deferred). Riêng việc CLAIM một item đang `doing` bị bỏ quên (worktree không còn ai chỉnh sửa) đã có một cửa hẹp hơn: `pick`/`take` tự kiểm tra hoạt động file/worktree thật của claim cũ ngay trong đường CAS-conflict sẵn có, và tự động reclaim (reattach, không phá hủy) khi bằng chứng đủ kết luận — không phải timeout/nhắc-nhở chủ động, chỉ kích hoạt khi một session khác chủ động thử claim lại (docs/history/session-claim-liveness/CONTEXT.md).
- Phân quyền / nhiều người / giao việc: ai được trả lời cổng nào — chưa mô hình hóa (deferred).
- Orchestrator service tầng fleet (registry/heartbeat/push assignment/lease, giao thức+auth cho worker từ xa) — không thuộc cửa pull take/return đã dựng, đắp sau trên cùng nhật ký sự kiện chỉ khi cần fleet worker (deferred, per stage-decompose).
- Rollup view theo bộ (tổng hợp trạng thái mọi hậu duệ của một gốc trong một màn hình) — STR24, chưa làm (deferred).
- Trong một project mà bee đang nghỉ (phase terminal), guard hiện tại của bee chặn ghi trực tiếp vào `.fgos/` (cổng idle-intake theo-phase, allowlist tĩnh không biết territory manifest) VÀ vào worktree tmpdir (containment phi-phase, không quan tâm phase) — hai cơ chế độc lập, không nhắm riêng fgos; luồng qua verb CLI `fgos <verb>` (Bash) không bị chặn bởi cả hai. Gap thuộc cây bee, không sửa trong feature này; friction đã file (`.bee/backlog.jsonl`, severity P2) làm địa chỉ flip khi bee sửa (per install-coexistence / 8788e9bb; canary pin sự thật này — `docs/coexistence.md` Known Gaps, `docs/history/install-coexistence/reports/canary-run.md`).
- Ngữ cảnh soi của context-discovery (xem "Giai đoạn Soi-rõ" trên) chỉ mang cặp hỏi-đáp MỚI NHẤT của một item — bản ghi cổng gộp-mới-nhất, không giữ một lịch sử đầy đủ mọi vòng hỏi-đáp trước đó; nếu một vòng làm-rõ nhiều bước cần nhìn lại toàn bộ chuỗi hỏi-đáp, đó là mở rộng sau (per discovery-context STR30 / cfae0120, chấp nhận cho CoS hiện tại — accepted trade-off, không phải bug).
- Domain thứ hai thật SẢN XUẤT (vd marketing, chạy trên vòng thi công thật `runner/dispatch.mjs`, không chỉ minh họa) — sổ đăng ký đã dựng, `coding` đã retrofit, và nay có tới BA domain fixture (`synthetic`/`triage`/`fixture-marketing`) chạy hết cửa CLI (`add`/`submit --domain`) thật; nhưng cả ba đều là fixture dùng-một-lần. Một domain mang giá trị sản xuất thật vẫn là backlog STR18 tiếp tục (per base-workflow-model / 2ae492d8).
- **Phạm vi tài liệu này chưa phủ hết bề mặt verb.** Spec mô tả đầy đủ chiều vòng đời (`stage` + `status`) và các verb đi trên nó, nhưng CHƯA có mục riêng cho một số verb đang sống: `merge`, `show`, `schedule`, `gate-approve`, `gate-bypass`. Đây là nợ tài liệu của các tính năng đó, không phải khoảng hở của mô hình vòng đời — ghi nhận ở đây thay vì để `coverage` khai khống (xem frontmatter: `coverage: partial`).
- `repair` (ghi-đè-cả-file) KHÔNG lấy `.fgos/events.lock` — chỉ chạy khi không có tiến trình fgos nào đang sống; một `appendEvent` chen vào giữa lúc repair đọc và ghi-đè sẽ bị nuốt. Ghi nhận yêu cầu, không cưỡng chế (per fgos-multi-session-checkout Epic 3 / STR35; xem entry point `repair`).
- Lối tổng hợp (nay ở status `retrospective`) đã đóng vòng đầu-cuối: `compound --doc-type` ghi `docType` thật (RUL51 (verb compound — nay là cửa gắn nhãn, không còn là cửa chuyển stage)/52), `--doc-path` ghi linkage nguồn↔tài-liệu (RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)), kỹ năng `fgos-coding-compounding` phân loại quadrant và soạn tài liệu người-dùng-cuối, một tài liệu how-to thật đầu tiên đã được sinh có trích dẫn bằng chứng từ capture thật, và một chỉ mục đọc-theo-tag máy-đọc-được (`fgos docs-index` → manifest; area `enduser-docs-index`) đã liệt kê tài liệu đó kèm linkage ngược (per bước-3 compound-learn-enduser-docs). Còn mở, có chủ ý HOÃN sang slice sau: (a) **gộp-sống** — hợp nhất capture thành tài liệu prose sống (dựng lại từ nguồn qua linkage RUL53 (con trỏ tài liệu docPath — trường linkage cộng-thêm trên outcome)/manifest, không mất chi tiết/cấu trúc) — chưa làm; (b) **backfill** nội dung di sản (critical-patterns.md, docs/decisions/) vào bốn quadrant — chưa làm; (c) bề rộng sản xuất tài liệu — mới một tài liệu/một quadrant (how-to) được chứng minh, chưa phủ cả bốn; (d) nghi vấn Diataxis-đủ-hay-không (CONTEXT) để lại cho slice gộp-sống; (e) kỹ năng `fgos-scribing` (đồng bộ BA-spec ở chặng tổng hợp) HOÃN có chủ ý — chỉ dựng khi một bước spec-sync thật được nối (Agent's Discretion, CONTEXT).
```

## claim_0066f7f6c05d2c20d59e173e7ea9cff8

`docs/platform/work-state/spec.md#unheaded-block-96`
Unit SHA256: `d9e8b7000d47817bb9f18c512831b2264db4460c56330dc05898a60d1e8de24d`
Shown SHA256: `d9e8b7000d47817bb9f18c512831b2264db4460c56330dc05898a60d1e8de24d`

```text
**Đã đóng:** dư lượng CAS verb-tương-tác-vs-verb-tương-tác (per fgos-multi-session-checkout Epic 3 / STR35) — từng liệt ở đây, nay đã sửa (xem RUL10 (tiền đề có ngưỡng) bổ chú 2 ở trên và `docs/history/store-atomic-rmw/`).
```

## claim_bce12a8847507e4be87c96dcded365ea

`docs/platform/work-state/spec.md#unheaded-block-97`
Unit SHA256: `b0a0db080dad061ca93e63826e562c4710807db8e6f2c8ca50dc291fc0b69e09`
Shown SHA256: `b0a0db080dad061ca93e63826e562c4710807db8e6f2c8ca50dc291fc0b69e09`

```text
Not applicable — không có màn hình.
```

## claim_679bf517a1831f6c2a5dd74c478ed811

`docs/platform/work-state/spec.md#unheaded-block-99`
Unit SHA256: `43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4`
Shown SHA256: `43c88a88d0eb57f524b0b2768bb6132b7136f7c04066dbea712d00c731c3d9a4`

```text
- [README.md](README.md)
- [contracts/cli-io-contract.md](contracts/cli-io-contract.md)
- [architecture/implementation-pointers.md](architecture/implementation-pointers.md)
- [decisions/retired-decision-history.md](decisions/retired-decision-history.md)
- [history/multi-role-harness-distill-record.md](history/multi-role-harness-distill-record.md)
- [docs/specs/work-state.md](../../specs/work-state.md)
- [docs/io-contract.md](../../io-contract.md)
```

