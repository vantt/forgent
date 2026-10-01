# Bản đồ layer và authority của fgOS (nhìn từ trên xuống), đối chiếu track request-to-run

```txt
Document type: Analysis report (discussion lead)
Snapshot: 2026-10-01 10:20 (Asia/Saigon), main @ e36f21c92
Nguồn: duyệt code thật (đếm dòng, import, entry point) + docs/platform/component-boundary.md
Liên quan: plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md (§7b lộ trình)
Status: phân tích; 5 điều chỉnh §4.1 owner duyệt 2026-10-01 10:20 — đã ghi vào synthesis §7d
```

## 1. Hình dạng hệ thống hôm nay (trên → dưới)

| Layer | Thành phần (code thật) | Quy mô | Authority (quyết cái gì) |
|---|---|---|---|
| **L0 Bề mặt kích hoạt** | Người trong session Claude Code (prompt tự do; 58 skill `/fgOS:*` trong `plugins/fgOS/skills`; skill kit `ak:*`); CLI `fgos` 73 verb (`bin/fgos.mjs`); herdr gateway REST/MCP/dashboard (`herdr-plugin`); daemon `fgos-runner --watch`; hook harness (`.claude/hooks`, PreToolUse ép `dispatch decide`) | `bin/fgos.mjs` 5.155 dòng; herdr-plugin 12,5k dòng Rust | ai/cái gì khởi động một việc |
| **L1 Host và định tuyến lệnh** | Rust host (`fgctl`, release manifest → `components.legacyNode.entry` = `bin/fgos.mjs`); kernel `packages/host-runtime/rust` (`operation_provider_router`, `authority_gate`, `invocation_service`, provider external-process); `src/cli/command-registry.mjs` | host-runtime 8,3k dòng Rust; catalog native hiện chỉ 3 operation **đọc** (`distribution.build.show`, `work.gate-bypass.show`, `observe.metrics`) | operation fgOS nào do component nào (Rust native hay Node) xử lý — **không** phải chọn agent |
| **L2 Doctrine/điều phối bằng prose** | `core/skills` (12), `domains/coding/skills` (11), `core/skills/_shared/*` (capability-matching Q0–Q2, executor-dispatch-fallback, catalog), `fgos-routing`, `fgos-coding-driving`, `fgos-code-change`, `fgos-panel` | prose; Lead (LLM) thi hành | hiểu yêu cầu, phân rã, chọn capability/pattern, quyết inline hay dispatch — **authority nằm trong prose, không trong code** |
| **L3 Work** | `src/state` (work, store, replay, stage-fsm, `workflow-stage-graphs`, frontier…), `src/verbs/state`, `src/intake`, merge (`src/runner/merge.mjs` + `src/verbs/merge`), worktree/claim/main-checkout-lock, Work runner `src/runner/loop.mjs`, fan-out; `domains/*/workflows/*.yaml`, `registry.yaml`; Rust `work-state` (đọc) | state 12,7k + intake 2,1k + merge 3,9k + runner lõi ~5k dòng Node; Rust 1,3k | bản ghi yêu cầu, status/board, lifecycle, **và cả** tuần tự stage của workflow domain |
| **L4 Coordination** | `src/verbs/coordination`, `src/runner/coordination` (session-engine 4.778 dòng), `src/runner/definitions` (FlowDefinition), team-cognition/deliberation; 13 YAML `core/coordination-protocols`; Rust `coordination-state` (đọc) | 6,1k + 14,6k + 2k + 0,9k dòng | phiên cộng tác: vai, pha, visibility, authorize, disposition, close; bind executor (`binding.mjs`) |
| **L5 Dispatch và thực thi** | `src/runner/dispatch` (decide/mechanism; plan/resolve/assignment-policy = chọn executor+tier; `executeAssignment` = cửa chạy, 4 caller; transport/adapter/provider-adapter; confinement; provider-capacity; execution-contract; `dispatch-runs` legacy), `src/verbs/dispatch` | 32k + 0,8k dòng | ai làm, model nào, chạy ở đâu, cách ly ra sao, ghi kết quả |
| **L6 Executor** (ngoài fgOS) | CLI claude/codex/agy/pi; pane herdr; bwrap | — | làm việc thật |
| **L7 Lưu trữ** | `.fgos/events.jsonl` + `state.json` (Work); `.fgos/assignments/*/runs` (RunResult); `.fgos/coordination/sessions`; `.fgos/dispatch-runs` (legacy); `.fgos/observe` | — | sự thật (L3 platform law: truth ở JSONL) |
| **Ngang** | Config runner (`.fgos/config.json`, global); setup/doctor/distribution (`src/setup` 9,3k + Rust distribution 4,9k); **Observe** (Rust 5,1k, đọc L7); knowledge/doc registry | — | khẩu vị, cài đặt, đo |

## 2. Chỗ authority chồng chéo hoặc rò (đã kiểm trong code)

| # | Vấn đề | Bằng chứng | Hệ quả |
|---|---|---|---|
| A1 | **"Ai làm, model nào" rải trên 3 layer + config**: L2 (doctrine Q0–Q2, skill truyền `--executor`), L4 (`binding.mjs`, `minTier` trong YAML), L5 (`assignment-policy`, `resolve`, redirect) | synthesis §2 F3–F8, §6 bảng 5 mức | đổi khẩu vị phải sửa nhiều nơi; đổi người lặng lẽ (G6) |
| A2 | **"Tuần tự các bước" có 3 sequencer**: L3 (stage FSM + `loop.mjs`), L4 (pha/DAG của session engine), L2 (skill dẫn vòng lặp bằng prose: `fgos-coding-driving`, `fgos-code-change`) | `src/state/stage-fsm.mjs`, `loop.mjs`; `session-engine.mjs`, `dag-scheduler.mjs`; SKILL.md | nghi lễ, Lead đứng giữa các vòng (synthesis Q0) |
| A3 | **Nhiều cửa chạy** ở L5: `executeAssignment` (4 caller), `execute` thường → `dispatch-runs`, `execute --contract`, Agent tool in-process qua hook | synthesis F9, F29 | lần chạy vô hình với Observe (G1) |
| A4 | **Dispatch (L5) đọc thẳng workflow/stage của Work (L3)** — trái ranh giới đã ghi ("Dispatch… strictly forbids … direct workflow/stage/skill lookups in core", `docs/platform/component-boundary.md` §4) | 4 file dispatch import `src/state/workflow-stage-graphs.mjs`: `assignment-runner.mjs:57`, `operation-choice.mjs:20`, `cli.mjs:21`, `assignment.mjs:51`; `config.mjs`, `cli.mjs` import state Work | L5 không tách được khỏi Work; `bind()`/primitive mới sẽ thừa hưởng phụ thuộc này nếu không cắt |
| A5 | **Herdr hai vai**: bề mặt (L0 gateway/dashboard) và transport thực thi (L5/L6 pane) | `herdr-plugin`; invocation `*-herdr-*` | ranh giới không rõ khi đổi read-only/confinement |
| A6 | **Hai bộ định tuyến ở L1**: kernel Rust (operation → component) và Node command-registry; migration writer `planned` | `node-to-rust-migration.md` §4 | không chặn track; nhưng primitive mới là **writer** → khi sang Rust phải đi qua kernel này |
| A7 | **Nhiều store, không một writer/entity rõ** ở L7: assignments, sessions, dispatch-runs, events; test rò vào store thật | synthesis F13; prompt việc lẻ | số liệu nền nhiễu; Observe đọc 3 nguồn |

## 3. Lộ trình hiện tại nhìn theo layer

| Plan | Layer chính | Authority được gom về một chủ | Chồng chéo đóng được |
|---|---|---|---|
| T | L5 (+ config) | "model mạnh tới đâu" | phần tier của A1 |
| P1 Lõi thực thi | **L5** (+ config, L7 RunResult) | "ai làm" + "chạy qua cửa nào" | phần còn lại của A1; A3; G6 |
| P2 Plan chạy được | **L2 → dữ liệu** | "phân rã thành Unit" chuyển từ prose sang hợp đồng dữ liệu | phần L2 của A1 và A2 |
| P3 Workflow tách khỏi Work | **L3** | "tuần tự bước + cổng người" | A2 (L3 + L2), **A4** (cắt dispatch khỏi workflow Work) |
| P4 Dạng thảo luận + thu hồi engine | **L4** | xoá layer L4 như một runtime riêng | phần L4 của A1, A2 |
| P5 Thuật ngữ | ngang | — | — |

Nhận xét: lộ trình **đã gần đúng thứ tự từ dưới lên theo authority** (L5 trước, rồi L2/L3, rồi bỏ L4). Hai lỗ: **A4 không nằm trong plan nào một cách tường minh**; **A5, A7** chưa có chủ.

## 4. Câu hỏi của owner và đề xuất

### 4.1 Ổn định từng layer trước, hay đi theo kế hoạch?

**Không làm "ổn định từng layer" theo nghĩa đánh bóng từng layer từ dưới lên.** Lý do: thiết kế đã chốt **bỏ** L4 như một runtime riêng và **chuyển** một phần L2 thành dữ liệu; ổn định chúng trước là đầu tư vào thứ sẽ xoá (đúng bài học §7c synthesis: xây cộng dồn không xoá).

**Nhưng nên đổi định nghĩa "xong" của mỗi plan theo layer:** mỗi plan phải **đóng một mối authority** — sau plan đó, layer chính của nó có **đúng một chủ** cho mối quan tâm đó, ranh giới được ghi vào `docs/platform/component-boundary.md`, và có guard test chặn rò ngược. Như vậy vừa giữ thứ tự theo năng lực (ship K3 sớm), vừa có tính chắc chắn của từng layer.

Điều chỉnh cụ thể đề xuất:
1. **A4 vào P1**: lõi thực thi mới (`bind()`, primitive) **không import** `workflow-stage-graphs`/state Work; guard test (kiến trúc một chiều) chặn L5 → L3. Phần dispatch cũ còn import thì P3 cắt nốt khi stage rời Work.
2. **Thêm tiêu chí xong cho mọi plan**: "một chủ cho mối authority X" + cập nhật component-boundary + guard test.
3. **A5 (herdr hai vai)** đưa vào phase read-only của P1 (gộp X): quyết herdr pane là transport có confinement hay không.
4. **A7** do hai việc lẻ + P1 (RunResult một nơi, xoá `dispatch-runs`) đóng.
5. **A6** ghi ràng buộc: primitive/`bind()` thiết kế theo hợp đồng operation (request/outcome contract, authority policy) giống kernel Rust, để sau này chuyển sang kernel không phải thiết kế lại.

### 4.2 Viết plan trước rồi quay lại góc nhìn này, hay bàn luôn?

**Bàn luôn — nhưng chỉ đến mức điều chỉnh plan tổng, không đào sâu từng layer.** Lý do:
- Góc nhìn này đã cho ra điều chỉnh thật (A4, tiêu chí "đóng một mối authority", A5/A6 vào P1). Viết plan P1 trước rồi mới nhìn lại → làm lại plan.
- "Tham chiếu thật" mà owner muốn có được chính là bản đồ này (dựng từ code), không cần chờ plan.
- Phần đào sâu từng layer (call graph đầy đủ, mọi cạnh import) đúng chỗ là bước scout khi lập chi tiết từng plan con, không cần làm hết bây giờ.

## 5. Không đổi ranh giới component (chưa)

`No component-boundary change` ở thời điểm phân tích — đây là bản đồ hiện trạng. Mỗi plan con sẽ cập nhật `docs/platform/component-boundary.md` khi nó đổi authority (đề xuất 4.1 điểm 2).

## 6. Câu hỏi còn mở

- Owner duyệt 5 điều chỉnh ở §4.1?
- Herdr pane làm transport cho vai read-only: giữ (cần confinement) hay bỏ cho reviewer? (thuộc phase read-only của P1)
