---
title: "Observe component — chuyển trọn sang Rust (fgos metrics + fgos friction)"
status: pending
priority: P1
created: 2026-09-29
revised: 2026-09-29 (v3 — Observe trọn gói, làn song song)
blockedBy: []
blocks: []
---

# Plan v3: Observe component — chuyển trọn sang Rust

Nguồn: [measurement audit](../reports/measurement-audit-260929-1454-harness-scorecard.md) · [deep comparison](../reports/deep-comparison-260929-1446-harness-simplicity-herdr-cook-plan-vs-fgos.md)

## Outcome

Kết thúc plan, component **Observe** được **chuyển trọn sang Rust**, không còn việc sót. Mọi tầng khác đều **dùng** Observe:
- **Tầng nền** (Coordination, Dispatch/Run, RunResult): cung cấp observation và friction.
- **Work Item** (lớp ý định ở trên): chỉ là một source tuỳ chọn và là một bên ghi hoặc resolve friction.

Case là đơn vị đo chính. Có thể bắt đầu đo case thật ngay từ M1.

## Nguyên tắc: single path

| Năng lực | Đường duy nhất |
|---|---|
| Chạy lệnh | shim `fgos` (stage ngay từ M1) |
| Ghi / resolve friction | một writer Rust `fgos_observe::friction`. Component Rust gọi lib; component Node, skill và ngôn ngữ khác gọi `fgos friction record/resolve`. Node tìm host theo env → release manifest → fault `friction-write-failed` (best-effort, không đổi kết quả chính) |
| Lưu store Observe | tracked, shard theo writer `.fgos/observe/<store>/<writerId>.jsonl`, một store lock (pid + startTime) |
| Đọc / xếp hạng friction | `fgos friction` |
| Migration friction cũ | chạy lười bên trong writer mỗi lần mở, import phần mới hơn cursor `(src, seq)` ghi trong record `migration` |
| Suy ra `failure.origin` | chỉ trong source `run-result` |
| Đo lường | `fgos metrics`. Lệnh cũ bị xoá trong đúng phase có lệnh thay thế: `faults`, `dispatch-report` ở F4; `evolve` ở F5; `check` ở F7 |

## Kiến trúc

```text
                        ┌──────────── Observe (Platform support, Rust) ─────────┐
 Coordination ─impl───► │ trait ObservationSource                               │
 RunResult ───impl───► │ store .fgos/observe/: cases, friction, snapshots       │
 Work (tuỳ chọn) impl─► │ friction: record / resolve / unsettled / rank / migrate│
 Transcripts, git,    ─► │ scorecard, case journal                               │
 invocation-faults      │ CLI: fgos metrics …   fgos friction …                  │
 Node components ── fgos friction record/resolve (qua FGOS_HOST_BIN) ──►        │
 Rust components ── lib fgos_observe::friction ────────────────────────►        │
                        └────────────────────────────────────────────────────────┘
 Observe không phụ thuộc component nào; composition root (apps/fgos) nối các source vào.
```

Crate:
- `packages/observe/rust` (`fgos-observe`);
- source nằm ở crate của owner: `packages/run-result/rust` (mới), `packages/coordination-state/rust` (mới), `packages/work-state/rust` (mở rộng).

Để Node gọi được host: recursion guard chỉ còn cho `legacy-cli`, host đặt `FGOS_HOST_BIN` cho process Node con, và entry không qua host (`fgos-runner`, npm bin, `node bin/fgos.mjs`) resolve host qua release manifest. Client luôn truyền `--dir <main checkout root>`. Hệ quả đã chấp nhận: `npm test` build host trước khi chạy (trừ khi đã có `FGOS_HOST_BIN`), với `CARGO_TARGET_DIR` riêng cho mỗi checkout.

## Phases

| # | Phase | Làn | Effort | Phụ thuộc |
|---|---|---|---|---|
| F1 | [Crate Observe + route native + Node gọi host + khung cho các làn](phase-01-f1-observe-crate-native-routing.md) | — (nút thắt) | 1d | — |
| F3 | [`metrics case` + stage lên shim](phase-02-f3-metrics-case-and-stage.md) | A1 | 1d | F1 |
| F2 | [Source tầng nền trong crate owner](phase-03-f2-owner-observation-sources.md) | A2 | 1d | F1 |
| F5 | [Friction: writer Rust duy nhất; xoá `evolve`](phase-05-f5-friction-in-observe.md) | B | 2d | F1 |
| F4 | [`metrics harness` + `faults`; xoá `faults`, `dispatch-report`](phase-04-f4-metrics-harness-scorecard.md) | A | 1d | F2, F3 |
| F6 | [Work source, baseline, runbook](phase-06-f6-work-source-baseline-runbook.md) | A | 1d | F4, F5 |
| F7 | [`metrics runs/outcomes/entropy/snapshot`; xoá `check`](phase-07-f7-remaining-metrics-delete-check.md) | A | 1.5d | F6 |
| F8 | [Contract, fixture, decision record, doctor check](phase-08-f8-contracts-fixtures-decisions.md) | C | 1d | F4, F5 |

## Làm song song

```text
Ngày    0        1        2        3        4        5        6
A1           [F1]──[F3+stage]─┐
A2               ─[F2]────────┴─[F4]──[F6────]─[F7────────]─┐
B                ─[F5─────────────]──┘                      │
C                                  └[F8]────────────────────┤ (song song F6/F7)
                                                           done ≈ 5,5 ngày (thay vì 9,5 ngày tuần tự)
```

| Mốc | Sau | Dùng được gì | Ngày (song song) |
|---|---|---|---|
| **M1: bắt đầu ghi case** | F1 + F3 | `fgos metrics case …` qua shim | ~2 |
| **M2: scorecard tầng nền** | + F2 + F4 | `fgos metrics harness` (runs, session, token, can thiệp tay, commit, faults), tính lùi cho các case đã ghi từ M1 | ~3 |
| **M3: friction độc lập** | + F5 | `fgos friction …`; Work ghi và resolve qua CLI | ~3 (làn B) |
| **M4: Observe trọn gói** | + F6 + F7 + F8 | Work source, baseline, lệnh `metrics` đầy đủ, `check` bị xoá, contract và fixture khoá lại | ~5,5 |

**Sở hữu file theo làn** (được F1 dựng sẵn khung để các làn không đụng nhau):

| Làn | Sở hữu |
|---|---|
| A1 (F3) | `observe/src/case_journal.rs`, `observe/src/metrics_cli/case.rs`, `src/state/fgos-file-registry.mjs` (key `OBSERVE_DIR`) |
| A2 (F2) | `packages/run-result/**`, `packages/coordination-state/**`, `observe/src/sources/**`, `apps/fgos/src/wiring/metrics_sources.rs` |
| A (F4, F6, F7) | `observe/src/scorecard.rs`, `observe/src/metrics_cli/**`, `packages/work-state/rust/src/work_source.rs`, `src/report/entropy.mjs` (F7 xoá; F5 bỏ phần friction trước, tuần tự vì F7 → F6 → F5) |
| B (F5) | `observe/src/friction*.rs`, `observe/src/friction_cli.rs`, `packages/work-state/rust/src/legacy_friction.rs`, `apps/fgos/src/wiring/friction_sources.rs`, `src/observe/friction-client.mjs`, Work core (`store.mjs`, `replay.mjs`, `loop.mjs`, `approve.mjs`, `sync-root.mjs`, `review.mjs`, `cleanup-harness.mjs`, `retrospective-doors.mjs`), `test/e2e/self-improve-loop.test.mjs` |
| C (F8) | `packages/*/contracts/**`, `test/fixtures/observe/**`, `scripts/regenerate-observe-fixtures.mjs`, docs ranh giới, `src/setup/registrations.mjs` |

**File dùng chung:** `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `command-routes.json` (file sinh: regenerate bằng `scripts/export-command-selectors.mjs`, không sửa tay; mỗi làn chỉ xoá verb của riêng mình); `test/rust-host/vectors/envelope/version.json` (regenerate khi rebase); `test/test-ownership.mjs`; `packages/work-state/rust/src/lib.rs` (chỉ khai báo `mod`); `CHANGELOG.md`; `docs/specs/observe.md` (mỗi làn một mục). `catalog.rs` và `packages/work-state/rust/Cargo.toml` do F1 sửa xong một lần, các làn không đụng.

**Quy ước tích hợp:**
- Mỗi làn chạy trong worktree riêng, **merge vào `main` tuần tự**, và làn sau rebase trước khi merge.
- Commit ngay sau khi verify xanh (memory: commit ngay trong shared checkout).
- Làn B đụng Work core (blast radius lớn), nên chạy gitnexus `impact` trước; nếu ra HIGH hoặc CRITICAL thì dừng lại báo anh.
- Dòng CHANGELOG do từng làn thêm vào mục của mình khi merge.

## Không thuộc plan này (plan tiếp theo)

| Plan tiếp theo | Nội dung | Vì sao tách |
|---|---|---|
| **RunResult status/usage** | Đổi nghĩa `status` (reviewer bác thì là `done` + `verdict: fail`); thêm `usage` từ adapter | Thuộc owner RunResult. Đụng 53 chỗ trong 6 file lõi của dispatch và coordination (`assignment-runner`, `run-result`, `settlement`, `herdr-reconcile`, `legality-facts`, `session-engine`). Làm đổi số liệu #4, nên cần baseline M4 có trước. Là ca đầu tiên **dùng Observe để đo tác động** |
| **Producer friction tầng nền** | Dispatch tự ghi `run:` (execFailed / no-evidence), coordination tự ghi `session:` (kẹt / vượt maxRounds), và owner tự resolve | Việc của component khác dùng Observe; nên quyết dựa trên số liệu từ M2–M4 |

## Acceptance

- **M1:** `fgos metrics case open t1 --harness plain` và `close` chạy qua shim; `fgctl status` cho thấy digest mới.
- **M2:**
  - `metrics harness --since 2026-09-01` có phân bố run khớp với audit (1.028 run) và số session khớp (±).
  - `faults`, `dispatch-report` báo unknown verb.
- **M3:**
  - `friction rank` sau migration có cùng tập id với mốc `evolve`, ngoại trừ các id `wontfix` (được liệt kê).
  - Không còn `addFriction`; `work.friction` chỉ còn ở `legacy_friction.rs`, `SIDE_LOG_ONLY_EVENT_TYPES` và `scripts/measure-verify-cost.mjs`.
  - Ghi friction lỗi (không có host) không đổi kết quả của `approve`/`loop`; lỗi nằm trong `invocation-faults`.
  - Không file Node nào ghi vào `.fgos/observe/`; Work không còn đọc friction (chỉ ghi và resolve).
  - Gọi `fgos friction record` từ shell (giả lập component ngôn ngữ khác) chạy được.
- **M4:**
  - Mục `work` trong scorecard có #1 (tới `delivered`) và #2.
  - `metrics runs/outcomes/entropy/snapshot` đạt parity với `check` cũ (entropy chỉ lệch phần friction đã giải thích).
  - `check` báo unknown verb.
  - Contract và fixture regenerate không có diff; hai doctor check pass.
  - Có baseline JSON và runbook.
- **Ranh giới:** `fgos-observe` không phụ thuộc crate owner nào (kiểm bằng `cargo metadata`).
- `cargo test --workspace`, `npm test`, `test/rust-host/command-routes.test.mjs` xanh.
- Docs: `docs/specs/observe.md`, component-boundary và authority map, dòng Observe trong `node-to-rust-migration.md`, `CHANGELOG.md`.

## Rủi ro chính

- **Stage sớm ở M1 làm hỏng activation.** Ghi lại `fgctl status` trước; nếu hỏng thì `fgctl repair`. Build từ `main` sạch. Stage chạy từ `main`, không từ worktree của làn.
- **Xung đột merge ở file dùng chung.** F1 dựng khung trước; mỗi làn chỉ xoá verb của riêng mình; merge tuần tự và rebase trước khi merge.
- **Work core trong làn B.** Chạy impact analysis trước; `backward-compat.test` được cập nhật có chủ đích.
- **Node test phụ thuộc Rust build.** Build debug incremental trong `run-tests.mjs`; thiếu cargo thì báo lỗi rõ ràng.
- **Token bị gán nhầm case.** Mỗi project chỉ có một case mở (check và append trong store lock); transcript match chính xác theo thư mục project và `cwd`.
- **Ghi friction thất bại.** Friction là kênh phụ: lỗi thành `friction-write-failed` trong `invocation-faults`, doctor `observe-host-resolvable` cảnh báo sớm.
- **Payload cũ vẫn ghi `work.friction` sau khi migrate.** Migration theo cursor `(src, seq)`, nên lần mở sau sẽ bắt được; re-stage ngay khi merge F5.

## Validation Log

### Session 1 — 2026-09-29 (plan v1)

Các quyết định vẫn giữ nguyên:
- hỏi/trả lời = `work.move` sang/rời `awaiting-human`;
- ship = `delivered`;
- cờ `nativeOnly` trong registry Node;
- case đầu tiên chạy trong forgentX;
- `status` của RunResult là execution-only;
- mỗi owner có crate riêng.

Quyết định đã bị thay: "bỏ `friction settle`". Nay port có `resolve` do owner của subject gọi, và không có lệnh CLI settle.

### Session 2 — 2026-09-29 (plan v2)

Quyết định của anh:
1. Gộp vào một component **Observe**.
2. Work là lớp ý định ở trên; Observe đo tầng nền; case là đơn vị đo chính.
3. Chuyển 752 friction cũ và bỏ `work.friction`.
4. Chưa thêm producer tầng nền trong giai đoạn 1.
5. **Single path**: mỗi năng lực chỉ có một đường. Hệ quả:
   - stage lên shim ngay từ M1;
   - migration là một fix đã đăng ký, chạy qua `runFixes` (đã bị thay ở Session 3: migration chạy lười trong writer Rust);
   - verb cũ bị xoá trong đúng phase có lệnh thay thế (G4 riêng bị bỏ);
   - `failure.origin` chỉ được suy ra ở source `run-result`, nên G2 chỉ còn `status` và `usage`.

Bằng chứng kỹ thuật: `legacy_exec.rs:35,245` (recursion guard), nên writer friction đặt ở Node.

### Session 2b — Verification sau khi viết lại
- Claims checked: 30 (22 đường dẫn file, 3 symbol `moveWork`/`moveStage`/`addFriction`, 4 verb cũ, cơ chế setup, vị trí skill)
- Verified: 28 | Failed: 2 (đã sửa) | Unverified: 2 (`CLAUDE_CONFIG_DIR`, dedupe theo `message.id`: giữ làm rủi ro trong F2)
- Failed 1: không có `core/skills/check`. Skill nằm ở `plugins/fgOS/skills/check/SKILL.md` (viết tay). Đã sửa G3.
- Failed 2: không có khái niệm "bước setup". Cơ chế thật là `registerCheck`/`registerFix` cộng `runFixes`. Đã sửa F5 và plan.
- `ak plan` đòi tên file `phase-NN-*`: đã đổi tên (F1→01, F3→02, F2→03, F4→04, F5→05, F6→06, G1→07, G2→08, G3→09) và cập nhật link.

### Whole-Plan Consistency Sweep (v2)
- Đã quét: `target/release`, `G4`, `chạy tay`, `failure.origin`, `phase-0[0-5]` cũ, `mdview`, `work.ask`, `operation_prefix`, `core/skills/check`, `fgos setup` (nghĩa là đường riêng). Không còn chỗ cũ ngoài Validation Log.
- Không còn mâu thuẫn chưa giải quyết.

### Session 3 — 2026-09-29
- Anh chốt: writer friction dùng chung, nên **chuyển sang Rust luôn**. Mọi component, dù viết bằng Node hay Rust, đều ghi được friction.
- Thiết kế:
  - một cài đặt duy nhất `fgos_observe::friction`;
  - component Rust gọi lib, component Node, skill và ngôn ngữ khác gọi `fgos friction record/resolve`;
  - recursion guard chỉ còn cho `legacy-cli`;
  - `FGOS_HOST_BIN` cộng `src/util/host-bin.mjs`;
  - `npm test` build host;
  - migration chạy lười trong writer (thay cho fix `registerFix` đã đề xuất ở Session 2b).
- Đã kiểm: `package.json` `test` = `node scripts/run-tests.mjs`, hiện không build Rust; `test/rust-host/harness.mjs:138` chỉ dùng binary khi có `FGOS_HARNESS_ENTRY`. Vì vậy cần bước build mới trong `run-tests.mjs` (F1).
- Không còn writer Node nào; bỏ luật "writer đi theo Work".

### Session 4 — 2026-09-29 (plan v3)
- Anh chốt: Observe **chuyển trọn** trong plan này. G1 thành **F8** (contract, fixture, decision, doctor); phần Observe của G3 thành **F7** (`metrics runs/outcomes/entropy/snapshot`, xoá `check`).
- G2 (RunResult status/usage) và phần producer friction tầng nền được tách thành **plan tiếp theo**. Lý do: 53 chỗ trong 6 file lõi của dispatch/coordination phụ thuộc `status === 'failed'` hoặc `'no-evidence'` (đã grep); làm đổi số liệu #4 nên cần baseline M4 có trước.
- **Tính song song:** F1 là nút thắt duy nhất và dựng sẵn khung file cho từng làn (crate rỗng, `metrics_cli/`, `friction_cli.rs`, `wiring/*_sources.rs`, entry route và registry, các mục spec). Sau đó 3 làn chạy song song: A1 (F3), A2 (F2), B (F5); rồi A (F4 → F6 → F7) và C (F8) song song với F6/F7. Tổng ≈ 4,5 ngày song song, thay vì 8 ngày tuần tự.
- File dùng chung được liệt kê trong mục "Làm song song"; quy ước là merge tuần tự, rebase trước khi merge.

#### Verification (Session 4)
- Dependency frontmatter: F2[F1], F3[F1], F4[F2,F3], F5[F1], F6[F4,F5], F7[F6], F8[F4,F5]. Không có vòng phụ thuộc. Critical path F1 → F3 → F4 → F6 → F7 = 1+1+1+0,5+1 = 4,5 ngày.
- Đã quét: `G1|G2|G3|giai đoạn 2|provider.rs (như chỗ sửa trực tiếp)|apps/fgos/src/main.rs (như chỗ nối source)`. Không còn chỗ cũ.
- Whole-plan consistency sweep: không còn mâu thuẫn.

### Session 5 — 2026-09-29
**Trigger:** chạy `/ak:plan validate` sau red-team để chốt các điểm em tự quyết khi áp red-team.
**Questions asked:** 5 (4 + 1 câu làm rõ). Bỏ bước kiểm lại code vì Red Team Review đã có bằng chứng.

#### Questions & Answers
1. **[Risk]** Ghi friction thất bại (không có host, lock timeout, spawn fail) sau khi state đã đổi thì xử lý thế nào?
   - Options: Best-effort + invocation-faults | Ném lỗi như plan cũ
   - **Answer:** Best-effort + invocation-faults
   - **Rationale:** ở mọi chỗ gọi, state đã đổi rồi; ném lỗi làm `approve` mất kết quả có cấu trúc và loop bỏ qua breaker.
2. **[Architecture]** Bỏ `learning.frictions` trong event đóng item và mục `frictions` trong output `list`/`show`?
   - Options: Bỏ hẳn, ghi decision | Giữ, lấy qua host khi đóng item
   - **Custom input:** "khoan, sao lại dính chặt vào work-item rồi?"
   - Em làm rõ: Observe không phụ thuộc Work (`work:` chỉ là một subject kind); câu hỏi là gỡ các chỗ Work đang đọc friction. Chỗ dính thật là cột `status` của item trong `friction list/show` ở F6.
3. **[Architecture]** Gỡ dính friction ↔ Work thế nào?
   - Options: Work ngừng đọc friction + bỏ cột status F6 | Như trên, và Work cũng không tự resolve | Chỉ bỏ cột status F6
   - **Answer:** Work ngừng đọc friction + bỏ cột status F6
   - **Rationale:** Observe không biết về state của Work; Work chỉ ghi và resolve.
4. **[Tradeoff]** Migration friction cũ: import theo cursor mỗi lần mở store, hay chỉ chạy một lần?
   - Options: Cursor (src, seq) | Một lần + doctor cảnh báo
   - **Answer:** Cursor (src, seq)
   - **Rationale:** không mất `work.friction` do payload cũ ghi sau lần migrate đầu (shim M1, project khác).
5. **[Scope]** F5 xử lý mục friction trong `check`/entropy thế nào (F7 luôn chạy sau F5)?
   - Options: F5 sửa thẳng entropy.mjs | Giữ cờ tạm n/a
   - **Answer:** F5 sửa thẳng entropy.mjs
   - **Rationale:** lo ngại xung đột làn ở red-team là sai, vì F7 → F6 → F5 luôn tuần tự; cờ tạm là một đường tạm, trái với single path.

#### Confirmed Decisions
- Ghi friction là kênh phụ best-effort; lỗi thành `friction-write-failed` trong invocation-faults.
- **Work không đọc friction**: bỏ `learning.frictions`, mục `frictions` trong `list`/`show`/`item-trace`, gợi ý trong `show`; Work chỉ ghi và resolve.
- Friction CLI của Observe không join state của Work (bỏ cột status ở F6).
- Migration theo cursor `(src, seq)`.
- F5 sửa thẳng `entropy.mjs`; bỏ cờ tạm.
- Giữ ghi caller thật `{pid, sessionId}` khi resolve (em quyết: chỉ 2 field, dùng để audit).

#### Impact on Phases
- F5: thêm luật "Work không đọc friction", bỏ gợi ý trong `show`, bỏ cờ tạm, sửa thẳng `entropy.mjs`; thêm success criterion grep.
- F6: bỏ cột status; không sửa `friction_cli.rs`.
- F8: thêm decision gỡ dính.
- plan.md: Acceptance M3, bảng làn (`entropy.mjs`).

### Whole-Plan Consistency Sweep (Session 5)
- Đã đọc lại: plan.md, phase-01 … phase-08.
- Delta đã kiểm (4): cờ tạm `n/a` của entropy; cột `status` trong friction list/show; gợi ý `show` → `friction show`; `friction_cli.rs` trong F6.
- Chỗ cũ đã sửa: 5 (F5 ×3, F6 ×2). Mục Red Team Review giữ nguyên vì là lịch sử của phiên trước.
- Mâu thuẫn chưa giải quyết: 0.

## Red Team Review

### Session — 2026-09-29
**Findings:** 15 (15 accepted, 0 rejected). 4 reviewer (Security Adversary, Failure Mode Analyst, Assumption Destroyer, Scope & Complexity Critic), gộp từ 35 finding thô.
**Severity breakdown:** 5 Critical, 8 High, 2 Medium
**Quyết định của anh:** áp dụng hết; store Observe tracked, shard theo writer; entry không qua host resolve host theo env → release manifest → fault; phần mất khi xoá `check`/`evolve` chuyển vào `metrics outcomes`, còn self-improve thành `friction rank` + `fgos submit`.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Host đọc bỏ stdin ở route native (`main.rs:113-120`), nên `--detail-stdin` nhận rỗng | Critical | Accept | F1 |
| 2 | Thiếu `FGOS_HOST_BIN` ở `fgos-runner` / npm bin / `node bin/fgos.mjs` / CI related, nên ghi friction ném lỗi | Critical | Accept (anh chốt: env → manifest → fault) | F1, F5, F8, plan |
| 3 | Ghi friction lỗi làm hỏng `approve`/`loop` sau khi state đã đổi; resolve spawn host trong events lock | Critical | Accept | F5, F8 |
| 4 | Bỏ fold làm `learning.frictions` thành `{}` vĩnh viễn; `list`/`show` mất mục `frictions` | Critical | Accept (bỏ có chủ đích, ghi decision) | F5, F8 |
| 5 | `.fgos/observe/` không bị gitignore, thành một file tracked dùng chung, trái với mô hình shard | Critical | Accept (anh chốt: tracked, shard theo writer) | F1, F3, F5, F8, plan |
| 6 | Marker migration không làm được trên file append-only, crash thì import trùng, event từ bản cũ sau marker bị mất | High | Accept | F5, F8, plan |
| 7 | Root dò ngược rơi vào `.fgos` của worktree; host lệch version | High | Accept | F1, F5 |
| 8 | Cargo build trong `npm test`: worktree không có `target/`, làn song song ghi đè nhau, Windows, CI | High | Accept | F1 |
| 9 | Lock chưa đặc tả (không thu hồi khi holder chết); `case open` race | High | Accept | F1, F3, F5 |
| 10 | Match transcript theo prefix kéo cả project khác | High | Accept | F2, F4 |
| 11 | Chỉ số không khớp dữ liệu thật: verdict `findings`, `durationMs`/`adapter`/`role` thiếu, 85% session `active`, F6/F7 phải re-fold | High | Accept | F2, F4, F6, F7, plan (effort) |
| 12 | `command-routes.json` là file sinh; `CATALOG` len test; vector `version.json`; chỗ đặt trait; bảng file dùng chung | High | Accept | F1, plan |
| 13 | Xoá `check`/`evolve` làm mất settlement / learning / nag / `--submit` | High | Accept (anh chốt: `metrics outcomes` + rank→submit) | F5, F7, F8 |
| 14 | Danh sách consumer sai: 44 hit `addFriction`, `SIDE_LOG_ONLY`, test harness, `test-ownership`, `iron-law`, `FINAL_STATUSES`, path skill, path làn | Medium | Accept | F4, F5, F7, plan |
| 15 | `friction resolve` không xác thực | Medium | Accept (sửa lại: giữ CLI, ghi caller thật để audit) | F5 |

Effort chỉnh lại: F5 1,5d → 2d, F6 0,5d → 1d, F7 1d → 1,5d. Critical path F1 → F3 → F4 → F6 → F7 = 1+1+1+1+1,5 = 5,5 ngày.

### Whole-Plan Consistency Sweep
- Đã đọc lại: plan.md, phase-01 … phase-08.
- Delta đã kiểm (9): store shard theo writer (`friction.jsonl`/`cases.jsonl`/`snapshots.jsonl` → `<store>/<writerId>.jsonl`); marker → cursor `(src, seq)`; friction best-effort (bỏ "không nuốt lỗi"); resolve host env → manifest; `--dir` bắt buộc; `version` không còn byte-identical; path `work-state/src` → `work-state/rust/src`, `core/skills/fgos-coding-implement` → `domains/coding/skills/...`; `entropy.mjs` chỉ F7 sửa/xoá; effort và critical path (4,5 → 5,5 ngày; tuần tự 8 → 9,5).
- Chỗ cũ đã sửa: 3 (F5 success criterion "không import lại", F7 path snapshot, F8 tên fixture). Các mục Validation Log cũ giữ nguyên vì là lịch sử.
- Mâu thuẫn chưa giải quyết: 0.
