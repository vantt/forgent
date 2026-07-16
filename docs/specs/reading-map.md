# Reading Map (sản phẩm)

- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md
- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)
- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record 0010): 5 tầng + 2 lớp phủ, sổ component + sổ contract (C1–C9), nghi thức thẻ-căn-cước-trước-code
- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI P14-P18
- `docs/specs/` — state layer: area spec + system-overview + bản đồ này
- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy
- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records)
- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; gồm verb `take`/`return` — cửa pull giao–nhận việc cho tác nhân ngoài runner; spec: docs/specs/work-state.md
- `src/state/` — lõi work-state: events (nhật ký), work (schema — STATUSES + STAGES + field `parent` lineage), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm; cạnh `clarify→decompose→executing`), replay (fold), frontier (truy vấn sẵn-sàng — lọc theo status, stage, VÀ lineage qua `parent`), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output C1, `wrapEnvelope`)
- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (slug+hash chống trùng)
- `src/intake/discovery.mjs` — context-discovery của stage clarify: `judgeDiscovery` (gọi model, fail-safe) + `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành); verdict đủ rõ chuyển item sang stage `decompose`
- `src/intake/decompose.mjs` — phán chia-việc của stage decompose: `judgeDecompose` (gọi model, fail-safe) + `resolveDecompose` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành khi item ở stage `decompose`); sinh con qua lineage `parent`, không qua `deps`
- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop); loop chạy quét làm-rõ rồi quét chia-việc trước mọi dispatch thi công; gặt-lại bỏ qua claim của cửa pull (`claimActor` human/session); `goal-check.mjs` — hàm goal-check dùng chung giữa vòng tự hành và verb `return`; config: `.fgos-runner.json`; spec: docs/specs/runner.md
- `src/report/entropy.mjs` — tín hiệu entropy-trend + đếm compounding (thuần, đọc trên view work-state), surfaced qua `fgos check`; spec: docs/specs/runner.md
- `test/` — node:test suite (`npm test`, 466 test): smoke + state + cli + runner + report + e2e (rebuild-determinism, runner-loop — gồm kịch bản cửa pull S2-pull); benchmark ngoài suite (F4) tại `docs/history/phase-3-compound-learning/reports/f4-benchmark.md`
- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored
- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)
