# Consult: tool-registry capability vocabulary (feature: fgOS tool-registry port, tsk-1dj)

**Bottom Line:** Ngoài `impact-analysis` (gitnexus/c3) đã biết, repository-harness tự liệt kê thêm 5 tên capability trong `TOOL_REGISTRY.md` (`deploy-verification · coverage · security-scan · performance-benchmark · documentation-lookup`) và US-072 xác nhận thêm `browser-e2e`/`build-verification`/`platform-smoke` là capability thật đã dùng trong CLI smoke test. **symphony là nguồn DUY NHẤT khác thật sự đăng ký một capability + provider theo đúng cơ chế này** (`design-review` ← Impeccable) — không nguồn nào khác trong 11 source implement lại tool-registry. Phát hiện quan trọng nhất cho thiết kế: **beegog phân biệt "quyết định chung" (commit, `.bee/config.json`) khỏi "sự thật về máy này" (KHÔNG BAO GIỜ commit, `.bee/doctor-attest.json`)** — điều mà thiết kế `fgos tool` đã đề xuất trong `deep-dives/tool-registry.md` CHƯA xử lý đúng: fold `tool.check` (status/checked_at) vào `view` qua event-log CHUNG sẽ khiến "GitNexus present trên máy A" bị commit thành sự thật cho cả team — cần sửa trước khi tsk-1dj triển khai.

## Chất liệu theo domain

### tooling (hit — walked full section, 11 sources)
- **repository-harness:tool-registry-capability** — capability vocab khuyến nghị: `impact-analysis · deploy-verification · coverage · security-scan · performance-benchmark · documentation-lookup` (đã biết, nhắc lại vì đây là NGUỒN GỐC danh sách).
- **symphony:optional-provider-degrade-ladder** — capability `design-review` (Impeccable), 3 nấc, cấm thêm `.impeccable`/`.codex`/`.agents` vào repo — provider THẬT DUY NHẤT khác gitnexus/c3 mà một source tự đăng ký qua đúng cơ chế harness.
- **compound-engineering-plugin:bundled-skill-scripts** — không đăng ký capability theo registry, chỉ `command -v` optional detect (rẻ hơn, không machine-readable qua `query tools`).
- **beads:capability-gated-storage-interface** — capability ở tầng Go interface (VersionControl/HistoryViewer/RemoteStore/SyncStore/FederationStore), KHÔNG cùng cơ chế registry (compile-time, không phải runtime probe) — không thêm vào vocab, chỉ là biến thể triết lý.

### quality-gates (hit — walked full section, 10/11 sources có domain này; beads không có)
- **repository-harness (US-072 story, không phải matrix entry)** — xác nhận `coverage`, `browser-e2e`, `build-verification`, `platform-smoke` là capability name THẬT đã dùng ("CLI smoke shows the intended provider state for design-validation, browser-e2e, coverage, and local build/test capabilities"). Đây KHÔNG có trong `sources/repository-harness.md` matrix entry — phải đọc thẳng story doc (`upstreams/repository-harness/docs/stories/US-072-*.md`) mới thấy; ghi rõ ở đây để không lạc lần sau.
- Các entry còn lại của quality-gates (bee's `verification-evidence-discipline`, beegog's `semantic-judge-verdict-loop`, compound-engineering-plugin's `verification-evidence-gate`, superpowers's `two-verdict-review-severity-contract`, marketing-cockpit's `rigor-scaled-evaluation`...) đều là **cơ chế gate nội bộ** (proof-before-close, judge verdict, review severity) — KHÔNG phải capability đăng ký qua tool-registry. Liên quan chủ đề (quality) nhưng khác trục (nội bộ vs external-tool-optional) — không thêm vào vocab.

### integration-contract (maybe — keyword sweep, không walk full section)
- **marketing-cockpit:agent-agnostic-adapter-spec** — "capability" ở đây là trục KHÁC: mỗi platform-adapter phải implement 4 capability bắt buộc (skill loading, agent-def→config, knowledge injection, status protocol) + 6 optional-có-fallback (memory/scheduled/event-trigger/state/observability/skill-composition). Đây là "framework-adapter capability", không phải "external tool project đăng ký" — cùng TỪ, khác MÔ HÌNH. Không lẫn vào vocab impact-analysis-style.
- **herdr:capability probe** (`KIMI_MIN_VERSION`, `enforce_agent_version`) — version-gate hẹp cho MỘT agent runtime cụ thể, không phải registry đa-provider.

### orchestration (maybe — keyword sweep)
- **beegog:read-only-analyst-fanout** — "capability LÀ tường" nghĩa là ranh giới TOOL-PERMISSION của một agent TYPE (pin vào Explore/read-only), không phải presence-check của một external tool. Trục thứ ba của từ "capability" trong distillery — đáng note để không nhầm khi tsk-1dj viết doc, nhưng không phải ứng viên vocab.

### config-packaging (maybe — keyword sweep, PHÁT HIỆN QUAN TRỌNG)
- **beegog:machine-local-config-overlay** — `.bee/config.local.json` (never tracked) đè `.bee/config.json` (tracked); cùng họ với `.bee/doctor-attest.json` — "trạng thái attestation/capability theo từng checkout, không bao giờ được thừa hưởng từ clone của người khác." **Đây trực tiếp mâu thuẫn với thiết kế fold `tool.check` vào event-log chung đã đề xuất trong `deep-dives/tool-registry.md`** — xem Trade-offs bên dưới.

### safety (maybe — keyword sweep)
- **bee:read-only-agent-type-boundary** — "hard tool-capability boundary rather than a soft behavioral instruction" — cùng gene với orchestration entry ở trên (capability = permission surface, không phải registry). Không ứng viên vocab mới.

### harness (maybe — keyword sweep)
- **superpowers:action-to-tool-mapping** — tài liệu hoá capability gap CỦA CHÍNH RUNTIME (Pi không có subagent/todo tool, Antigravity không có todo tool, Codex cần `multi_agent=true`) — gần với ý "absent capability = clean skip" nhưng ở tầng RUNTIME-adapter, không phải project-registers-external-tool. Đáng tham khảo cho câu văn skill-prose (nói rõ agent nào thiếu gì) nhưng không phải nguồn vocab mới.

### Domain còn lại (miss — không tìm thấy entry chạm chủ đề capability-registry sau keyword sweep)
skills, hooks, routing, context-memory, planning, workflow, docs-style, repo-layout, self-improvement, ux, testing-evals.

## Trade-offs đáng cân nhắc

1. **Vocab mở hay đóng?** repository-harness cố ý để `--capability` free-text (chỉ ép kebab-case) — không code-change để thêm capability mới. Symphony và US-072 CHỨNG MINH điều này hoạt động: 2 dự án khác nhau tự thêm `design-review`/`coverage`/`browser-e2e` mà không đụng code registry. → fgOS nên copy y hệt: không hardcode enum capability trong `fgos tool register`, chỉ validate kebab-case.
2. **Presence data KHÔNG nên đi qua event-log chung.** Đây là sửa lại đề xuất trước: `tool.register`/`tool.remove` (quyết định "project này dùng gitnexus cho impact-analysis") là quyết định TEAM, hợp lý để commit vào `.fgos/events.jsonl`. Nhưng `tool.check` (status/checked_at — "gitnexus CÓ MẶT trên máy X không") là sự thật CỤC BỘ — nếu fold vào view chung qua event-log, dev A chạy `tool check` thấy present sẽ khiến dev B (không cài GitNexus) đọc view thấy `status: present` sai. beegog giải bằng file overlay never-tracked riêng (`doctor-attest.json`). fgOS tương ứng: `tool.register`/`tool.remove` fold vào `view.tools` (qua event-log, như đã thiết kế) nhưng `tool.check`'s kết quả (`status`, `checkedAt`) nên ghi vào 1 file **cục bộ, gitignored** (vd `.fgos/tool-status.local.json`), KHÔNG phải sự kiện trong `events.jsonl`. `fgos tool query` đọc `view.tools` (đăng ký) rồi overlay `tool-status.local.json` (sự thật máy này) để trả full record — giữ đúng "core consults capabilities" nhưng không làm ô nhiễm event-log chia sẻ bằng sự thật một máy.
3. **"Capability" là từ đa nghĩa trong chính distillery** — ít nhất 4 mô hình khác nhau dùng chung từ: (a) tool-registry (harness/symphony, cái đang port), (b) platform-adapter contract (marketing-cockpit), (c) agent tool-permission boundary (beegog/bee), (d) storage-backend interface (beads). Khi viết doc cho tsk-4ad (config+docs task), nên nói rõ fgOS's `fgos tool` chỉ là mô hình (a) — tránh người đọc sau lẫn với adapter-spec đã có trong marketing-cockpit hay permission boundary của agent type.

## Candidate liên quan (porting-log)

| Row | Score hiện tại | Ghi chú từ consult này |
|---|---|---|
| `tool-registry-capability` (porting-log.md:34) | R2 E2 F2 | Đã có; giữ nguyên đề xuất nâng R2→R3 từ deep-dive trước — consult này KHÔNG thêm candidate mới (không tìm thấy 1 dự án thứ 3 nào implement lại tool-registry ngoài harness+symphony), chỉ làm giàu chi tiết thiết kế (trade-off #2 ở trên) cho row này. |

Không đề xuất candidate row mới — phát hiện chính (machine-local vs shared split) là một CHI TIẾT THIẾT KẾ của cùng 1 candidate đã có, không phải một feature độc lập đáng port riêng.

## Coverage ledger

| Domain | Kết quả |
|---|---|
| tooling | consulted (7 entries: repository-harness×1 matrix + US-072 story, symphony×1, compound-engineering-plugin×1, beads×1, + 3 đối chiếu không liên quan bị loại) |
| quality-gates | consulted (2 entries liên quan: US-072 story capability names; các entry còn lại — bee/beegog/CE/superpowers/marketing-cockpit — ruled out, cùng chủ đề "quality" nhưng khác trục cơ chế nội bộ vs external-tool) |
| integration-contract | consulted (2 entries: marketing-cockpit adapter-spec, herdr capability-probe — cả hai ruled out khỏi vocab vì khác mô hình) |
| orchestration | consulted (1 entry: beegog read-only-fanout — ruled out khỏi vocab, khác mô hình) |
| config-packaging | consulted (1 entry: beegog machine-local-config-overlay — **giữ lại, ảnh hưởng thiết kế trực tiếp**, xem Trade-off #2) |
| safety | consulted (1 entry: bee read-only-agent-type-boundary — ruled out khỏi vocab, khác mô hình) |
| harness | consulted (1 entry: superpowers action-to-tool-mapping — ruled out khỏi vocab, tham khảo cho prose only) |
| skills | ruled out — không entry nào chạm "registrable external tool capability" sau keyword sweep |
| hooks | ruled out — cùng lý do |
| routing | ruled out — cùng lý do |
| context-memory | ruled out — cùng lý do |
| planning | ruled out — cùng lý do (entries ở planning là về plan-checker/feasibility-verdict, không phải tool capability) |
| workflow | ruled out — cùng lý do |
| docs-style | ruled out — cùng lý do |
| repo-layout | ruled out — cùng lý do |
| self-improvement | ruled out — cùng lý do |
| ux | ruled out — cùng lý do |
| testing-evals | ruled out — cùng lý do |

## Ngoài lưới

- US-072 story doc (`upstreams/repository-harness/docs/stories/US-072-*.md`) chứa capability vocab THẬT (`browser-e2e`, `build-verification`, `platform-smoke`) mà **không nằm trong `sources/repository-harness.md` matrix/index** — index hiện chỉ trích `TOOL_REGISTRY.md`'s 6 tên khuyến nghị. Đây là khoảng THIN của chính source index (không phải lỗi walk của consult này) — nếu muốn đầy đủ, `tooling` domain của `repository-harness.md` nên backfill thêm dòng trích US-072's vocab; để dành, không tự sửa index trong 1 phiên consult (đúng luật "consult read-only trên learning area").
- `learn-harness-engineering.md` (337B, gần rỗng) không được walk riêng — quá nhỏ để có nội dung capability, xác nhận bằng kích thước file, không đọc lại.
- Không có intake row nào đang chờ triage liên quan chủ đề này (kiểm `intake.md` không thấy dòng nào nhắc tool/capability/registry).
- Deep-dive `docs/distillery/deep-dives/tool-registry.md` (tự viết phiên trước, based_on 4 source cursor) — CHƯA stale (không source nào trong 4 cursor đó bị scan lại từ lúc viết), nhưng thiết kế của nó cần patch theo Trade-off #2 ở trên trước khi tsk-1dj implement — đây là việc CỦA NGƯỜI quyết định áp dụng, consult chỉ báo.
