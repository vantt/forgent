---
artifact_contract: bee-plan/v1
artifact_readiness: implementation-ready
mode: standard
---

# Plan: Phase 1 State Layer

Mode: `standard` — 2 risk flags: data model (schema work item + event log mới), weak proof (repo chưa có test/build nào).
Why this is the least workflow that protects the work: story-sized (schema + store + FSM + CLI + rebuild), nhưng greenfield không đụng hành vi có sẵn, không hard-gate flag — tiny/small không đủ vì có gray area kỹ thuật cần validating; high-risk là thừa nghi thức.

## Requirements (from CONTEXT.md)

- D1: quản work-state của chính forgent; không thiết kế cho distillery ở Phase 1.
- D2: song song bee, không interop; ngoại lệ duy nhất: ghi lệnh test/verify mới vào `.bee/config.json` `commands`.
- D3: truth = event log append-only committed (durability D2); file state = view D4 dựng lại từ replay; một cửa ghi; CAS expected-status.
- D4: một loại work item, một FSM, deps phẳng; epic = item thường; không entity cấp-câu-chuyện.
- Ràng chung: R1–R10 (`docs/specs/platform-foundations.md`), đặc biệt R3 (event log ≡ changeset), R4 (CLI audience = consumer không-chắc-là-agent → exit-code theo phạm trù), R5 (không danh sách tay), R6 (schema đủ trả lời 6 câu).

## Discovery

L1 — precedent đã có sẵn, không cần so sánh mới (deep-dive state đã là vòng L2/L3 của territory này):

- Zero-dep Node CLI + JSONL pattern: `.bee/bin/` (single dispatcher + lib/) — pattern nhà đang chạy.
- Flat item + JSONL-truth: `docs/distillery/sources/beads.md` (`bd ready`, JSONL-truth + cache-view).
- Chống double-apply changeset: `symphony:changeset-content-sha-immutability` (ghi chú cho validating, chưa chắc cần Phase 1).
- Nền lý thuyết: `docs/distillery/deep-dives/state.md`.

## Approach

**Đường đi (per D1–D4):** một package Node zero-dep ngay repo root — `src/state/` (lib) + `bin/fgos.mjs` (CLI một cửa) + `test/` (node:test). Dữ liệu: `.fgos/events.jsonl` = truth committed (per D3, ≡ changeset per R3); `.fgos/state.json` = view D4, gitignored, dựng lại bằng replay từ zero. Mọi mutation: append event + update view trong cùng một thao tác CLI; transition có precondition + CAS expected-status; terminal state chỉ vào được qua một verb duy nhất (single-door).

**Tên (chốt tại Gate 2, decision 55ad2f9f):** CLI = **`fgos`**, entity = **`work`**; data dir `.fgos/`.

**Schema work (tối thiểu, đủ 6 câu R6):** `id`, `title`, `kind` (loại việc), `status` (FSM), `deps[]`, `risk`, `refs[]` (đọc gì trước / contract chạm), `verify` (proof gì thì xong), `learn` (link bài học — optional, chỗ cắm Phase 3). FSM tối thiểu: `todo → doing → done` + `blocked` (hai chiều với todo/doing); `done` là terminal single-door.

**Rejected alternatives:**
- SQLite-as-store ngay — vi phạm R3 thứ tự (db chỉ là view, và chưa có ngưỡng friction); đường nâng cấp đã ghi trong luật.
- Hai cấp feature/cell — bị D4 loại.
- Tách package/workspace riêng — YAGNI khi repo chưa có code nào khác.

**Risk map:**

| Component | Risk | Reason | Proof needed |
|---|---|---|---|
| Append event + update view "cùng transaction" trên filesystem | MEDIUM | crash giữa 2 lần ghi → view lệch truth | validating: chốt thứ tự ghi (event trước, view sau) + `fg rebuild` là đường phục hồi; test giả lập view lệch |
| CAS expected-status trên file | LOW | single-writer hiện tại (per L3 tiền đề) | test: transition với expected-status sai bị từ chối, exit code riêng |
| Replay determinism | MEDIUM | view phải giống hệt sau rebuild từ zero | test: mutate n bước → xóa view → rebuild → deep-equal |
| Exit-code theo phạm trù (R4) | LOW | greenfield, tự đặt bảng mã | bảng exit-code trong plan cell, test assert từng phạm trù |

## Shape

| Phase | What Changes | Why Now | Demo | Unlocks |
|---|---|---|---|---|
| A. Init | package.json + node:test chạy được từ clone sạch; commands ghi vào `.bee/config.json` | repo chưa build/test được — hạ tầng trước (init lane) | `npm test` xanh từ scratch | mọi cell sau có verify thật |
| B. Substrate | `src/state/`: event log append + item schema + FSM transition có precondition + CAS + replay | lõi của D3/D4, thuần lib, test được không cần CLI | unit test: transition/precondition/CAS/replay pass | C |
| C. Single door | `bin/fgos.mjs`: verbs add/move/decision/list/rebuild, exit-code theo phạm trù | luật một-cửa chỉ có nghĩa khi cửa tồn tại | tạo work → move → xóa `.fgos/state.json` → `fgos rebuild` → giống hệt | F2 claim + Phase 2 routing |

## Test matrix

Một lượt qua 12 dimension, giữ dimension cắn được: transition sai precondition (từ chối, không ghi event) · CAS mismatch (từ chối, exit code riêng) · replay determinism (rebuild ≡ view đang có) · log dở dang/corrupt dòng cuối (phát hiện, báo rõ, không nuốt) · log rỗng / `.fg/` chưa init · deps trỏ id không tồn tại (từ chối lúc add) · dep tự trỏ mình · double-apply cùng event (ghi chú symphony content-sha — validating quyết có cần Phase 1) · unicode/ký tự lạ trong title · exit code đúng phạm trù cho mọi nhánh lỗi trên.

## Out of scope

- Lệnh frontier/`ready` và mọi routing — Phase 2 (backlog P2); Phase 1 chỉ *lưu* deps.
- Recovery matrix, anti-loop — Phase 2 (per CONTEXT Terms/Single-door).
- SQLite view, distillery consumer (P4), thay bee (P5), multi-writer (ngưỡng L3).
- Không đụng `.bee/` ngoài `config.json` `commands` (per D2).

## Current slice

Slice duy nhất = toàn bộ Phase 1 (A→B→C). Entry: repo không có runtime code. Exit: `npm test` xanh từ clone sạch, demo mốc C chạy bằng test tự động (tạo work → move → xóa view → rebuild → giống hệt). Files bounded: `package.json`, `.gitignore`, `bin/fgos.mjs`, `src/state/**`, `test/**`, `README.md` (một dòng trỏ), `.bee/config.json` (chỉ `commands`). Verify tổng: `npm test`.

## Cells

- `phase-1-state-layer-1` — A: init package + node:test + commands ghi nhận
- `phase-1-state-layer-2` — B: event log JSONL + schema work + validation (deps: 1)
- `phase-1-state-layer-3` — B: FSM + precondition + CAS + replay (deps: 2)
- `phase-1-state-layer-4` — C: CLI `fgos` một cửa + exit-code phạm trù (deps: 3)
- `phase-1-state-layer-5` — C: e2e rebuild-determinism + corrupt-log + README trỏ (deps: 4)
