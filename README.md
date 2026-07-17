# Forgent

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

## Install

```bash
npm install -g github:vantt/forgent
```

Then initialize your project:

```bash
fgos init
```

## Documentation

- [`docs/architecture-map.md`](docs/architecture-map.md) — bản chuẩn kiến trúc: 5 tầng + 2 lớp phủ + 2 sổ đăng ký (component, contract C1–C9)
- [`docs/reference-learning-system.md`](docs/reference-learning-system.md) — thiết kế hệ thống học từ reference sources (lifecycle, schema, taxonomy)
- [`docs/distillery/intake.md`](docs/distillery/intake.md) — hàng đợi nguồn học mới chờ triage
- [`docs/distillery/sources/beegog.md`](docs/distillery/sources/beegog.md) — feature index: beegog (bee)
- [`docs/distillery/sources/repository-harness.md`](docs/distillery/sources/repository-harness.md) — feature index: repository-harness
- [`docs/distillery/comparison-matrix.md`](docs/distillery/comparison-matrix.md) — so sánh tính năng giữa các nguồn
- [`docs/distillery/porting-log.md`](docs/distillery/porting-log.md) — trạng thái porting (nguồn sự thật duy nhất)
- [`docs/naming.md`](docs/naming.md) — brainstorm định vị & đặt tên (Forgent/fgOS)
- [`bin/fgos.mjs`](bin/fgos.mjs) + [`docs/history/phase-1-state-layer/`](docs/history/phase-1-state-layer/) — state layer: CLI `fgos`, event log + FSM + rebuild-view (Phase 1)
- [`bin/fgos-runner.mjs`](bin/fgos-runner.mjs) + [`docs/routing-handoff-contract.md`](docs/routing-handoff-contract.md) — routing runner: frontier → dispatch → goal-check loop + agent↔agent handoff contract (Phase 2)
- [`.agents/skills/distill/`](.agents/skills/distill/SKILL.md) — skill portable vận hành vòng học (init/add/delta/seal/check, Node zero-dep)