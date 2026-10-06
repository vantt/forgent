---
title: "fgos convention component (Plan B)"
description: "Component Rust lõi `convention` sinh và kiểm tên/vị trí report, plan, journal; Node chỉ có client mỏng qua invokeHost."
status: pending
priority: P2
effort: 5d
branch: main
tags: [convention, rust-host, naming, doctor, pre-commit]
created: 2026-10-06
---

# fgos convention component (Plan B)

Plan status: Proposed — not authorized for execution

## Mục tiêu

Hành động H2 của [synthesis](../reports/harness-investigation-261006-synthesis.md) (§7 hàng H2, §8 mục 5; vấn đề V5, V6, V16, V18). Một nguồn duy nhất, bằng Rust, cho quy ước tên và vị trí của report, plan, journal: `fgos convention name|path|check` trả phong bì `fgos.v1`. Cửa sinh tên thay cho việc agent và brief tự đặt tên; `check` ở pre-commit và doctor bắt file sai quy ước, với mọi ngôn ngữ.

Ngoài phạm vi: H1/H3/H5 (Plan A), H4 (thí nghiệm), H6 (plan `260925-documentation-authority-unification`), cấp phát id (hoãn, xem [phase 00](phase-00-spec.md) §Deferred), mọi file của AgentKit/ClaudeKit/rtk.

## Prior art (đã kiểm lại ngày 2026-10-06, trừ chỗ ghi "kế thừa")

Có sẵn, sẽ dùng lại:
- Mẫu component Rust native: `packages/observe/{contracts,rust}`, crate `fgos-observe` phụ thuộc `fgos-host-runtime` (`packages/observe/rust/Cargo.toml:7`). **Lưu ý:** không package nào có thư mục `src/` hay `tests/` ở cấp package; test nằm ở `rust/tests/` (`ls packages/*/`). Anh đã chọn bố cục thực tế (Q10 đóng): `packages/convention/{contracts,rust/{src,tests}}`, client Node ở `src/convention/`. Báo cáo tổng hợp ghi sai `{contracts,rust,src,tests}` do em đọc nhầm kết quả `ls`.
- Đường lắp một verb native (đã trace): `CATALOG` (`packages/host-runtime/rust/src/catalog.rs:17`), `COMPOSITION_PROVIDERS` + `register_provider` (`apps/fgos/src/main.rs:54-60`, `:123-140`), `project_cli_invocation` (`apps/fgos/src/cli_projector.rs:10`), annotation `packages/host-runtime/contracts/command-route-annotations.json`, sổ `COMMAND_REGISTRY` (`src/cli/command-registry.mjs:63-88`, mục `nativeOnly: true`), sinh `command-routes.json` bằng `scripts/export-command-selectors.mjs` (doctor `command-routes-drift`, `src/setup/registrations.mjs:4755`), test `test/rust-host/command-routes.test.mjs`.
- Client Node mỏng: `invokeHost`/`resolveHostBin` (`src/util/host-bin.mjs:18,72`), mẫu `src/observe/friction-client.mjs`. Điểm không chép: friction-client tự giữ lại bảng kiểm hợp lệ (`PUBLISHED_LAYERS`, dòng 12) ở Node; client convention không được làm vậy.
- Doctor: `registerCheck` (`src/setup/registrations.mjs`), mẫu suy giảm khi host cũ `checkObserveRunCoverage` (`:5753`, trả `degraded: true` khi `host-version-mismatch`). Danh sách check ở `docs/specs/distribution.md:70` phải cập nhật cùng thay đổi.
- Test tự build host: `ensureHostBin` (`scripts/run-tests.mjs:37`) build `target/debug/fgos`, nên test không phụ thuộc release đang kích hoạt.
- `src/runner/paths.mjs`: chỉ phân giải gốc lưu trữ (`resolveRepoRoot`, `resolveFgosDir`, `resolveLogsDir`, `resolveSkillRoot`...), không đặt tên report. Không trùng nghĩa với `convention`; giữ nguyên. Số "78 lời gọi đi vòng" là **kế thừa** từ synthesis, em chưa đếm lại.

Thiếu (lý do có plan này):
- Không văn bản nào của fgOS định nghĩa tên report/journal: `git log -S'YYMMDD'` chỉ ra commit của distillery/AgentKit; `core/skills`, `domains/**` không có quy tắc tên report (chỉ có `agent-report.md` cố định trong runDir, thuộc Execution, ngoài phạm vi).
- Đo hôm nay (script Node, không qua rtk): `plans/reports` 163/241 file `.md` khớp `{type}-{YYMMDD-HHMM}-{slug}.md`, 103 giá trị `type` khác nhau, 119 file khớp nhưng có đuôi `-report.md`; thư mục plan 18/19 khớp `{YYMMDD-HHMM}-{slug}`; 28 report nằm trong `plans/<plan>/reports/`.
- Hai thư mục journal: `plans/journals/` (10 file, kiểu `YYYY-MM-DD-slug`, commit gần nhất `6f043ee9d` hôm nay) và `docs/journals/` (5 file, kiểu `YYMMDD-HHMM-slug`, commit gần nhất `79261896e` 2026-08-11).
- Bốn bản thuật toán ngày dân sự trong Rust: `cli_presenter.rs:22` `format_iso8601`, `store_lock.rs:58` `format_iso_now`, `scorecard.rs` `parse_iso_secs`, `time.rs` `midnight_millis`. Convention cần định dạng giờ, không được thêm bản thứ năm.
- Nhánh subcommand trong `main.rs:158-160` mã cứng `if selector == "metrics" ... else friction`; verb native thứ ba có subcommand sẽ rơi nhầm vào nhánh friction.
- `invokeHost` chỉ nhận ra host cũ khi stderr có cả `unknown` và `subcommand` (`host-bin.mjs:91`); host cũ gặp verb `convention` sẽ in `unknown verb "convention"` (`main.rs:108-113`), tức lỗi thường, không phải mismatch.
- Nguồn ngoài (môi trường, không sửa): hook ak/ck chèn khối `## Naming` (ví dụ `planner-261006-1412-{slug}-report.md`), `ak plan create` sinh tên thư mục plan, `.agentkit/config.yaml:30-35` (mặc định đã comment). `convention` phải chấp nhận tên thư mục do `ak plan create` sinh, không thay nó.

## Phụ thuộc vào Plan A

Plan A (single-door mechanisms; thư mục chưa có lúc 14:16 ngày 2026-10-06, đường dẫn **UNVERIFIED**) sở hữu:
1. Vòng phát triển: kích hoạt kiểu dev hoặc quy trình stage lại, và check doctor báo release đang kích hoạt cũ hơn HEAD. Máy này kích hoạt release dán chặt digest có bản sao Node (synthesis H1(c)); verb native mới chỉ chạy được qua `fgos` sau khi build và kích hoạt lại. Plan B không làm lại việc này. Phase 03-05 test bằng `target/debug/fgos` nên không bị chặn; chỉ bước kiểm tay trên cửa `fgos` thật cần Plan A.
2. Phase sửa `AGENTS.md` đầu tiên. [Phase 06](phase-06-agents-line.md) chạy **sau** phase đó.
3. Chặn rác ở gốc repo trong `.githooks/pre-commit`. [Phase 05](phase-05-enforcement.md) sửa cùng file, chạy **sau** khi thay đổi đó của Plan A đã merge.
4. Có thể thêm check doctor vào `src/setup/registrations.mjs` và dòng ở `docs/specs/distribution.md:70`: phase 05 rebase lên sau, không sửa song song.

## Phases

| # | Phase | Phụ thuộc | Trạng thái |
|---|---|---|---|
| 00 | [Spec vùng `convention` (không code)](phase-00-spec.md) | — | pending |
| 01 | [Gộp thuật toán ngày dân sự vào host-runtime](phase-01-shared-civil-time.md) | 00 duyệt | pending |
| 02 | [Crate `fgos-convention` + dữ liệu hợp đồng + golden test](phase-02-convention-crate.md) | 01 | pending |
| 03 | [Lắp route native + command-routes + test tương thích](phase-03-route-wiring.md) | 02 | pending |
| 04 | [Client Node mỏng qua invokeHost](phase-04-node-client.md) | 03 | pending |
| 05 | [`check` ở pre-commit và `fgos doctor`; gộp thư mục journal](phase-05-enforcement.md) | 04; Plan A pre-commit + doctor | pending |
| 06 | [Một dòng trong `AGENTS.md`](phase-06-agents-line.md) | 03; phase AGENTS.md của Plan A | pending |
| 07 | [Docs, CHANGELOG, ghi chú di chuyển caller](phase-07-docs-changelog.md) | 05, 06 | pending |

Mọi phase từ 01 trở đi bị chặn đến khi anh duyệt spec ở phase 00. Thứ tự tuần tự 01→05; 06 chạy song song với 04/05 được (khác file).

## Sở hữu file (không hai phase song song cùng sửa một file)

| File | Phase |
|---|---|
| `docs/platform/convention/spec.md` (mới) | 00 (tạo), 07 (cập nhật trạng thái) |
| `docs/specs/reading-map.md`, `docs/specs/system-overview.md`, `docs/platform/component-boundary.md` | 00 (dòng "proposed"), 07 (dòng "implemented") |
| `packages/host-runtime/rust/src/civil_time.rs` (mới), `lib.rs`; `apps/fgos/src/cli_presenter.rs`; `packages/observe/rust/src/{store_lock,scorecard,time}.rs` | 01 |
| `packages/convention/**` (mới), `Cargo.toml` (workspace) | 02 |
| `catalog.rs`, `apps/fgos/{Cargo.toml,src/main.rs,src/cli_projector.rs}`, `command-route-annotations.json`, `command-routes.json`, `src/cli/command-registry.mjs`, `test/rust-host/command-routes.test.mjs` | 03 |
| `src/convention/convention-client.mjs` (mới), `src/util/host-bin.mjs`, `test/convention/**` (mới) | 04 |
| `.githooks/pre-commit`, `src/setup/registrations.mjs`, `docs/specs/distribution.md`, `docs/journals/**` → đích chọn ở spec | 05 |
| `AGENTS.md` | 06 |
| `CHANGELOG.md` | 07 |

## Tiêu chí chấp nhận (đo được)

1. `fgos convention name --type report --slug harness-audit --at 2026-10-06T14:15:00+07:00 --json` trả `data.name == "report-261006-1415-harness-audit.md"` đúng từng byte (cũng chạy được trong `cargo test`, đồng hồ ghim).
2. `fgos convention path --type report --slug x --at 2026-10-06T14:15:00+07:00 --json` trả `plans/reports/report-261006-1415-x.md`; thêm `--plan 261006-1415-fgos-convention-component` trả `plans/261006-1415-fgos-convention-component/reports/report-261006-1415-x.md`.
3. `fgos convention check --json` trên các path dưới đây trả mỗi path một vi phạm có mã lỗi đã đặt tên trong spec: `plans/reports/harness-audit-261006.md` (sai thứ tự slug-ngày), `plans/reports/report-261006-x.md` (thiếu HHMM), `plans/reports/report-261399-2561-x.md` (ngày/giờ không hợp lệ), `plans/report-261006-1415-x.md` (sai vị trí); và trả không vi phạm cho `plans/reports/report-261006-1415-x.md`, `plans/261006-1415-fgos-convention-component/plan.md`.
4. `cargo test -p fgos-convention` xanh, đọc golden case từ `packages/convention/contracts/` (không chép case vào code), ít nhất mỗi kind × mỗi operation một case thành công và mỗi mã lỗi một case thất bại.
5. `command-routes.json` có selector `convention` với `route_kind: native`, `owner_path: packages/convention/rust`; `node scripts/export-command-selectors.mjs --check` thoát 0; `node --test test/rust-host/command-routes.test.mjs` xanh.
6. `rtk proxy rg -n 'selector == "metrics"' apps/fgos/src/main.rs` ra 0 dòng (nhánh mã cứng đã gộp thành bảng).
7. `rtk proxy rg -c 'Hinnant|civil' --glob '*.rs' packages apps` chỉ còn khớp trong `packages/host-runtime/rust/src/civil_time.rs` (target/ loại trừ).
8. Check doctor id `convention-conformance` có trong `src/setup/registrations.mjs` và trong `docs/specs/distribution.md:70`; `node bin/fgos.mjs doctor` liệt kê nó; với host cũ nó trả `degraded`, không `failed`.
9. Không có cài đặt Node thứ hai: `rtk proxy rg -n 'RegExp|\\d\{6\}|YYMMDD' src/convention .githooks/pre-commit` ra 0 dòng; client không chứa danh sách kind/type/dir.
10. `AGENTS.md` có đúng một dòng nhắc `fgos convention` (`rtk proxy rg -c 'fgos convention' AGENTS.md` = 1).
11. `CHANGELOG.md` `## [Unreleased]` có một dòng cho `fgos convention`.
12. Cả bộ test xanh khi chạy ngoài biến phiên: `env -u CLAUDE_CODE_SESSION_ID npm test`.

## Rollback tổng

Mỗi phase là một commit (hoặc chuỗi commit) riêng, revert độc lập theo thứ tự ngược. Phase 05 revert trước nếu pre-commit chặn nhầm. Phase 01 là refactor thuần, revert không ảnh hưởng phase khác trừ 02 (02 dùng helper của 01).

## Câu hỏi mở

Xem [phase 00 §Câu hỏi mở](phase-00-spec.md#câu-hỏi-mở-mỗi-câu-unproven-cho-tới-khi-spec-trả-lời) (Q1-Q12). Q10 (bố cục thư mục) đã quyết. Q6-Q9 (journal, `type`, slug có dấu, múi giờ) đã có **mặc định do lead nhận ngày 2026-10-06**, ghi ở Phase 00; anh đổi được bất cứ lúc nào trước khi spec được duyệt.

## Ghi chú: tài liệu cũ đang di trú

Plan `260925-documentation-authority-unification` đã chạy dở trên một branch riêng (đã đóng pha kiểm kê, tạm dừng chờ Observe, chưa merge; branch có 59 commit chưa merge vào main, còn main đã đi trước branch 399 commit (tính từ 2026-09-29)). Mọi sửa đổi của plan này lên tài liệu cũ (`docs/specs/reading-map.md`, `docs/specs/system-overview.md`, `docs/specs/distribution.md:70`) là **ngoại lệ cần ghi nhận** khi plan đó được nối lại. Spec mới đặt ở `docs/platform/convention/spec.md` để không thêm nợ di trú.

## Executor brief (`ak:cook`)

Phiên thi hành dùng `/ak:cook <đường dẫn file phase>` (một phase mỗi phiên). Đọc theo thứ tự: file này (§ mục tiêu, phụ thuộc, tiêu chí chấp nhận, Red Team Review), file phase, **mục "Hiệu chỉnh sau red-team" ở cuối file phase (nó thắng nội dung cũ)**, rồi báo cáo tổng hợp `plans/reports/harness-investigation-261006-synthesis.md` khi cần ngữ cảnh.

Quy tắc chung của mọi phiên:
- Không bao giờ truyền `--yagni`: anh yêu cầu làm đủ phạm vi đã nêu. Mỗi phase cần anh cho phép tường minh trước khi bắt đầu (phase nào đã ghi cổng riêng thì giữ cổng đó).
- Làm trong một worktree riêng của phase (có `node_modules` và `target/` trước khi chạy test); `pwd` và `git branch --show-current` trước lệnh git; không ghi vào main checkout, nơi phiên khác đang làm việc. Commit bằng đường dẫn tường minh (`git commit -- <paths>`), conventional, không nhắc AI, không nhãn phase hay mã phát hiện trong comment hoặc tên test, và commit ngay khi xanh.
- Chạy test với `env -u CLAUDE_CODE_SESSION_ID`; chạy ở foreground có timeout, không tự chạy lệnh nền rồi chờ. Đếm bằng script hoặc `rtk proxy`, không dùng `grep | wc` qua hook `rtk` (từng cho 130 thay vì 3320).
- Chạy impact analysis (GitNexus) cho từng symbol sẽ sửa trước khi sửa; chỉ số đang chậm commit nên đối chiếu thêm bằng grep thô.
- `ak:cook` bắt buộc code-reviewer và finalize; kết quả review không thay cho kiểm độc lập của người điều phối. Điểm dừng báo anh: một giả định trong phase hoá ra sai, một hiệu chỉnh mâu thuẫn với mã thật, cần sửa ngoài danh sách file, hoặc một bước không đảo ngược được (xoá file, đổi hook).
- `ak-*`, `ck-*`, hook và rules của AgentKit/ClaudeKit và `rtk` là của người khác: dùng như công cụ, không đề xuất sửa.
- Model của phiên: gợi ý, chưa đo. Phase cơ khí chạy được với bậc `sonnet` hoặc tương đương; phase đánh dấu `--advice` nên chạy với model mạnh nhất có sẵn. `--advice` bật giám sát `kongming` (theo skill: Fable 5 trên Claude subscription). Chỉ Claude, Codex và Cursor có trong bảng định tuyến của `--advice`; chạy `ak:cook` trên host khác là chưa kiểm chứng.

Chế độ theo phase (mặc định `--interactive`; `--auto` chỉ cho phase cơ khí):

| Phase | Cờ gợi ý | Lý do |
|---|---|---|
| 00 | `--advice`, không có mã | Spec là quyết định; duyệt spec là cổng cho mọi phase mã |
| 01 | `--tdd` | Gộp hàm ngày, chứng minh giống hệt bằng test |
| 02 | `--tdd` | Crate mới có golden test |
| 03 | `--tdd` | Nối route, vector, 13 nơi dùng `COMMAND_REGISTRY` |
| 04 | `--tdd` | Client Node nhỏ, chỉ `conventionCheck` |
| 05 | `--advice`, **không `--auto`** | Hook và doctor cưỡng chế; chỉ cảnh báo; chạy sau Plan A phase 04 và 05 |
| 06 | `--advice`, **không `--auto`** | Một dòng `AGENTS.md`, chạy sau dấu hiệu hoàn tất của Plan A phase 06 |
| 07 | `--auto --no-test` | Tài liệu và changelog |

## Red Team Review

### Session 2026-10-06 (`ak plan validate` qua; bốn reviewer: Failure Mode, Assumption, Scope & Complexity, Security)
**Số finding thô:** 34 (từ 4 reviewer), gộp trùng còn 22. **Chấp nhận:** 22, **từ chối:** 0. Các điểm lead tự đo lại: chuỗi import của `host-bin.mjs` là 29 module và hook chỉ import 2 (tám test chép đúng bộ bốn file), doctor không đọc `.degraded`, 0 trên 28 báo cáo trong thư mục plan khớp mẫu và 360 file bằng chứng nằm trong thư mục con, bảy bản thuật toán ngày, presenter chỉ có thoát 0 hoặc 1.

| # | Finding | Mức | Quyết định | Áp dụng vào |
|---|---|---|---|---|
| 1 | Hook nạp 29 module: vỡ 8 test chép hook; lỗi nạp chặn mọi commit | Critical | Accept | Phase 05 |
| 2 | Thư mục báo cáo đã có file không thể khớp mẫu (0/28; 360 file bằng chứng) | Critical | Accept (giới hạn phạm vi, chỉ cảnh báo, mốc cutoff) | Phase 00, 05 |
| 3 | Mã thoát `4` của `check` không tồn tại; `invokeHost` bỏ stdout | High | Accept (`Completed` kèm violations, thoát 0) | Phase 00, 03, 04 |
| 4 | Heuristic stderr "unknown subcommand" bị tên file điều khiển, tắt chốt chặn | High | Accept (tín hiệu có cấu trúc) | Phase 04 |
| 5 | Tên do công cụ ngoài sinh (`-report`, `GH-n`, journal `YYYY-MM-DD`) bị từ chối | High | Accept (chấp nhận làm biến thể, bỏ cấm `-report`) | Phase 00 |
| 6 | Gộp thư mục journal: phạm vi không yêu cầu, xung đột kit ngoài | High | Accept (bỏ) | Phase 00, 05 |
| 7 | Doctor bỏ cờ `degraded` | High | Accept | Phase 05 |
| 8 | Doctor áp quy ước nội bộ lên mọi project; so nhầm cây ở worktree | High | Accept | Phase 05 |
| 9 | Cưỡng chế bật khi stage lại, không phải khi merge; thử thật chạy hook của main | High | Accept | Phase 05 |
| 10 | Đổi tên (`R`) và tên không ASCII lọt qua; không dùng `-z` | High | Accept | Phase 05 |
| 11 | Mọi lỗi `invokeHost` chưa ánh xạ; không timeout; trên máy này không bao giờ chặn | High | Accept | Phase 04, 05 |
| 12 | Đường dẫn staged vào argv không có `--` | Medium | Accept | Phase 00, 05 |
| 13 | Chốt chặn của Plan B không giới hạn cho repo nguồn fgOS | Medium | Accept | Phase 05 |
| 14 | Bảy bản thuật toán ngày; tiêu chí 7 mù | High | Accept | Phase 01, plan.md |
| 15 | Plan B sửa `docs/specs/reading-map.md` mà anh giao cho plan 260925 | Medium | Accept (bỏ) | Phase 00, 07 |
| 16 | Test danh sách id doctor, bảng how-to, `setup-doctor-registry.md` bị bỏ sót | Medium | Accept | Phase 05 |
| 17 | Vector `version.json` và 13 nơi dùng `COMMAND_REGISTRY` bị bỏ sót | Medium | Accept | Phase 03 |
| 18 | `conventionName`/`conventionPath` không có nơi gọi | Medium | Accept (chỉ `conventionCheck`) | Phase 04 |
| 19 | Số "78 báo cáo cũ" sai nên check `degraded` vĩnh viễn | Medium | Accept (mốc cutoff) | Phase 00, 05 |
| 20 | Dòng AGENTS.md thiếu neo L8; điều kiện `M AGENTS.md` lỗi thời | Medium | Accept | Phase 06 |
| 21 | `name`/`path` không trạng thái: song song ghi đè nhau | Medium | Accept (luật slug khác nhau, không thêm mã) | Phase 06 |
| 22 | Trích dẫn số dòng đã trôi | Medium | Accept (trích theo ký hiệu) | Phase 00 |

**Tiêu chí chấp nhận cần đọc theo hiệu chỉnh:** tiêu chí 3 (mã thoát), 7 (tìm hằng số thuật toán), 8 (quan sát qua `fgos doctor --json`) đã đổi như các mục Hiệu chỉnh nêu.
