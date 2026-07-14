# Reading Map (sản phẩm)

- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md
- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)
- `docs/specs/` — state layer: area spec + system-overview + bản đồ này
- `docs/routing-handoff-contract.md` — hợp đồng handoff agent↔agent + ranh giới tin cậy
- `docs/decisions/` — hồ sơ quyết định dài hạn cho người ngoài (decision records)
- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; spec: docs/specs/work-state.md
- `src/state/` — lõi work-state: events (nhật ký), work (schema), fsm (bảng chuyển + CAS), replay (fold), frontier (truy vấn sẵn-sàng), store (chủ ghi duy nhất + readRawEvents)
- `src/runner/` + `bin/fgos-runner.mjs` — vòng tự hành (loop/dispatch/worktree/recovery/anti-loop); config: `.fgos-runner.json`; spec: docs/specs/runner.md
- `test/` — node:test suite (`npm test`, 234 test): smoke + state + cli + runner + e2e (rebuild-determinism, runner-loop)
- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored
- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent (bản sản phẩm — thuần forgent)
