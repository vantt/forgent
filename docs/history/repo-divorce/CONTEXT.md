# Repo Divorce (bee ↔ forgent) — Context

**Feature slug:** repo-divorce
**Date:** 2026-07-14
**Exploring session:** complete
**Scope:** Standard
**Domain types:** ORGANIZE (cấu trúc file/git/doctrine), READ (tách đôi AGENTS/CLAUDE)

## Feature Boundary

Ly khai TẦNG TĨNH: artifacts của bee (xưởng) và forgent (sản phẩm) tách tuyệt đối — cây sản phẩm + `.git` xuống `./repo`, xưởng giữ toàn bộ máy build + hồ sơ build và có git riêng. Dừng ở: KHÔNG đổi hành vi sản phẩm nào (mọi test xanh nguyên trạng), KHÔNG rewrite lịch sử, KHÔNG làm tầng động/coexistence (P10 backlog), KHÔNG sửa bee upstream.

## Locked Decisions

These are fixed. Planning must implement them exactly — cited, never reinterpreted.
Changing one requires the user, a new D-ID or an explicit supersession note, never a silent edit.

| ID | Decision | Rationale (only if it changes implementation) |
|----|----------|-----------------------------------------------|
| D1 | **Lịch sử git: thực dụng.** `.git` hiện tại đi theo cây sản phẩm xuống `./repo` (move cùng nhau — layout khớp index, không rename); phần xưởng ra khỏi tracking bằng MỘT commit `git rm --cached` + `.gitignore` trong `./repo`. KHÔNG filter-repo, không rewrite lịch sử — mọi commit cũ nguyên vẹn; HEAD tiến đúng MỘT commit untrack (điểm-không-quay-lại của di trú). | Quá khứ còn dấu bee = bản ghi trung thực, chấp nhận; 2 review candidate đang mở giữ nguyên giá trị head; rủi ro gần không. |
| D2 | **Đường cắt tài liệu** *(bổ sung 2026-07-14 sau scope-guardian, không đổi hàng đã khóa: `scripts/` — công cụ xưởng, gồm script di trú + test của nó — Ở LẠI XƯỞNG)*: xuống `./repo`: `docs/specs/` (kèm reading-map bản-sản-phẩm), `docs/platform-foundations.md`, `docs/backlog.md`, `docs/routing-handoff-contract.md`, `docs/decisions/`. Ở lại xưởng: `docs/history/`, `plans/`, `docs/distillery/`, `docs/reference-learning-system.md`, `docs/naming.md`, `upstreams/`, `.bee/ .claude/ .agents/ .codex/`. | Nguyên tắc: tài liệu mô tả/định hình sản phẩm theo sản phẩm; chất liệu + hồ sơ build ở xưởng. Pointers của specs là path tương đối → tự đúng khi đi cùng cây. |
| D3 | **`docs/history/` ở XƯỞNG** (không xuống repo) **+ export chưng cất khi cần:** sử ký cho người ngoài sinh dưới dạng decision-records/changelog vào `docs/decisions/` của sản phẩm (backlog riêng, không thuộc feature này). | bee mọc lại `docs/history/` tại root nó chạy (convention nướng cứng, không config được) — move xuống là não tách đôi hoặc phải sửa bee; decisions.jsonl vốn ở xưởng nên truy vết trọn chuỗi chỉ có một chỗ; câu 6 trong repo do tầng spec trả lời. |
| D4 | **Xưởng có git repo nhẹ riêng:** sau khi `.git` cũ xuống `./repo`, `git init` tại gốc + commit khởi tạo; `./repo` để untracked/ignored trong git xưởng (hai repo lồng nhau không nuốt nhau); chưa cần remote. | decisions.jsonl + docs/history mang mức bền D2, plans/reports mức D3 (nén được nhưng vẫn cần git-retention) theo thang L7 — plain folder phá lớp bền của chính chúng. |

### Agent's Discretion

- Thứ tự bước di trú, nội dung `.gitignore` hai bên, cách tách khối AGENTS.md/CLAUDE.md (giữ managed markers của bee ở xưởng; bản `./repo` chỉ nói về forgent) — miễn tuân D1–D4 và mọi bước phá hủy tiềm ẩn có bước kiểm trước/sau.
- Sửa `.bee/config.json` `commands` sang chạy trong `./repo` (ngoại lệ `.bee/` hợp lệ theo tiền lệ D2 phase-1).

## Pinned Assumptions (có nhãn)

- **A1 — Tên thư mục sản phẩm là `./repo`** — theo đề xuất gốc của user; đổi tên là việc một-dòng lúc planning nếu user muốn.
- **A2 — Phiên Claude Code mở tại GỐC XƯỞNG** (hook bee walk-up theo cwd); ghi thành một dòng luật trong AGENTS.md xưởng khi tách đôi.
- **A4 — `./repo` = CHÍNH forgent-thành-repo-sạch, KHÔNG có sandbox dogfood riêng** (đóng câu §5.2 của consult): e2e đã tự dựng repo tạm cho test, dogfood thật chạy ngay trong ./repo — sandbox riêng là YAGNI.
- **A3 — GitNexus:** index cũ theo root hiện tại; sau ly khai gỡ/di chuyển block GitNexus trong CLAUDE.md và re-analyze trong `./repo` (bước dọn, không phải quyết định).

## Terms

| Term | Meaning in this feature |
|------|-------------------------|
| Xưởng (workshop) | Gốc hiện tại sau ly khai: bee + harness + hồ sơ build + git riêng mới; nơi mọi phiên dev mở. |
| Sản phẩm (`./repo`) | Git repo forgent sạch: code + test + `.fgos/` + docs sản phẩm; `.git` là `.git` hiện tại chuyển xuống. |
| Commit untrack | MỘT commit trong `./repo` gỡ tracking phần xưởng (`git rm --cached`) — ranh giới tương lai-sạch của D1. |
| Export chưng cất | Sử ký cho người ngoài sinh vào `docs/decisions/` sản phẩm từ hồ sơ xưởng — backlog, ngoài scope feature này. |

## Specific Ideas And References

- Chẩn đoán 3 lớp entanglement + bảng ranh giới + phác thảo 6 bước: `plans/reports/architecture-consult-260714-1649-bee-forgent-repo-divorce-report.md`.
- Trả lời collision + các điểm phải giữ (fgos cwd-relative không cần sửa code; verify literal mới; reading-map tách đôi; review candidates giữ head): `plans/reports/from-phase2-session-to-divorce-planner-260714-1652-collision-assessment-report.md`.
- Quyết định nền liên quan: 774b73ef (claude-code-only khi dev), 99a8a7fc (tầng động là việc riêng P10), f3a16887 (thang T0–T2 — smoke sau ly khai dùng T0 + canary T1c).

## Existing Code Context

### Reusable Assets

- Toàn bộ code sản phẩm đã cwd-relative (`.fgos/` theo cwd, repoRoot qua `git rev-parse` trên cwd) — di trú KHÔNG cần sửa `src/`/`bin/` (bằng chứng: validation-s3 + e2e chạy trong repo tạm).
- Builder repo-tạm của e2e (`test/e2e/*.test.mjs`) — mẫu cho smoke sau di trú.

### Established Patterns

- bee onboarding/install idempotent (`up_to_date`) — sau ly khai chạy lại onboard check tại xưởng phải vẫn ok.
- Critical patterns: verify chạy nguyên văn (mọi lệnh mới `cd repo && ...` phải được chạy thật lúc validating); glob quote.

### Integration Points

- `.bee/config.json` `commands` → `test: cd repo && npm test`, `verify: cd repo && npm test && node <path distill từ xưởng> check` (chuỗi chính xác chốt ở planning, chạy thật ở validating).
- 2 review candidates đang mở (phase-1-review-fixes, phase-2-routing) — giữ giá trị nhờ D1; ghi chú trong plan để reviewer tương lai biết delta untrack.
- `docs/specs/reading-map.md` tách đôi: bản sản phẩm (xuống repo, chỉ path sản phẩm) + bản đồ xưởng mới ở gốc.

## Canonical References

- 2 báo cáo consult/collision nêu trên (chất liệu đầy đủ nhất)
- `docs/platform-foundations.md` L7 (durability — lý do D4), L8 (doctrine placement — tách AGENTS/CLAUDE)
- `docs/specs/system-overview.md` + `runner.md` (hiện trạng sản phẩm phải nguyên vẹn sau di trú)

## Outstanding Questions

### Resolve Before Planning

(none)

### Deferred To Planning

- [ ] Chuỗi lệnh verify chính xác sau di trú (đường distill từ xưởng) — chạy nguyên văn tại validating.
- [ ] Danh sách file mồ côi/edge (LICENSE, .gitignore hiện tại, .gitnexus, .fgos-runner.json đã rõ theo sản phẩm) — planning liệt kê đầy đủ từ `git ls-files`, không đoán.
- [ ] Thứ tự bước + điểm-không-quay-lại của di trú (trước commit untrack mọi thứ revert được bằng move ngược).

## Deferred Ideas

- Export chưng cất sử ký vào `docs/decisions/` sản phẩm (per D3) — backlog mới.
- Tầng động/coexistence P10 (đã có hàng backlog).
- Sửa bee upstream cho phép config đường docs/history — chỉ khi nào thật cần.

## Handoff Note

CONTEXT.md is the source of truth. Decision IDs are stable. Planning reads locked
decisions, code context, canonical references, and deferred-to-planning questions.
Validating and reviewing use locked decisions for coverage and UAT.
