# Reading Map (sản phẩm)

- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md
- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)
- `docs/architecture-map.md` — bản chuẩn kiến trúc (v0.2, record 0010): 5 tầng + 2 lớp phủ, sổ component + sổ contract (C1–C9), nghi thức thẻ-căn-cước-trước-code
- `docs/work-item-lifecycle-vision.md` — tầm nhìn nền tảng: chu trình sống của work-item (mixed-autonomy, base-workflow + domain-extension); khung cho các PBI P14-P18
- `docs/specs/` — state layer: area spec + system-overview + bản đồ này
- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy
- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records)
- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; spec: docs/specs/work-state.md
- `src/state/` — lõi work-state: events (nhật ký), work (schema — STATUSES + STAGES), fsm (bảng chuyển status + CAS), stage (bảng chuyển stage + CAS, chiều vĩ mô song song fsm), replay (fold), frontier (truy vấn sẵn-sàng — lọc cả status lẫn stage), store (chủ ghi duy nhất + readRawEvents), envelope (phong bì output C1, `wrapEnvelope`)
- `src/intake/classify.mjs` — logic thuần của `fgos submit`: deriveTitle, classify (tier/kind/risk cơ học), generateId (slug+hash chống trùng)
- `src/intake/discovery.mjs` — context-discovery của stage clarify: `judgeDiscovery` (gọi model, fail-safe) + `resolveDiscovery` (đọc-phán-ghi, dùng chung bởi verb `discover` và vòng tự hành)
- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop); config: `.fgos-runner.json`; spec: docs/specs/runner.md
- `test/` — node:test suite (`npm test`, 241 test): smoke + state + cli + runner + e2e (rebuild-determinism, runner-loop)
- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored
- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)
