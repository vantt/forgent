# Reading Map

- `docs/platform-foundations.md` — văn bản gốc 8 luật nền platform (L1–L8); spec: docs/specs/platform-foundations.md
- `docs/reference-learning-system.md` — thiết kế hệ thống học từ reference sources (lifecycle, schema, taxonomy)
- `docs/distillery/` — learning area đang chạy: `sources/*.md` (feature index từng nguồn), `porting-log.md` (nguồn sự thật porting), `comparison-matrix.md`, `intake.md`, `deep-dives/`
- `docs/naming.md` — brainstorm định vị & đặt tên (Forgent/fgOS)
- `docs/backlog.md` — product backlog (PBI rows, scribing-owned)
- `docs/history/` — hồ sơ per-feature + `learnings/critical-patterns.md`
- `docs/specs/` — state layer: area spec + system-overview + bản đồ này
- `bin/fgos.mjs` — CLI một cửa của work-state; chạy `node bin/fgos.mjs <verb>`; spec: docs/specs/work-state.md
- `src/state/` — lõi work-state: events (nhật ký), work (schema), fsm (bảng chuyển + CAS), replay (fold), store (chủ ghi duy nhất)
- `test/` — node:test suite (`npm test`, 71 test): smoke + state + cli + e2e rebuild-determinism
- `.fgos/events.jsonl` — nhật ký sự kiện work-state (truth, committed); `.fgos/state.json` là view gitignored
- `.agents/skills/distill/` — skill portable vận hành vòng học (init/add/delta/seal/check); bản cài mirror: `.claude/skills/distill/`
- `plans/reports/` — báo cáo phiên làm việc (physics: log, append-only)
- `upstreams/` — checkout 5 nguồn tham chiếu: beads, beegog, marketing-cockpit, repository-harness, symphony
- `.bee/` — runtime state của bee (harness phát triển, không phải sản phẩm)
- `AGENTS.md`, `CLAUDE.md` — doctrine layer nạp mọi phiên agent
