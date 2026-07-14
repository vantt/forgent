---
feature: repo-divorce
status: Ready for Review
lane: high-risk
sources: [CONTEXT.md, approach.md, plan.md]
updated: 2026-07-14
---

# Implement Plan: Repo Divorce

## Review Status

Gate 1: approved (CONTEXT D1–D4 + A1–A4). Gate 2: **pending — tài liệu này là đối tượng duyệt.** Gate 3: chưa (chỉ sau khi diễn tập trên bản sao xanh toàn phần).

## Goal / Success

Artifacts bee và forgent tách tuyệt đối: forgent thành git repo sạch tại `./repo` (mọi commit tương lai không dính xưởng), xưởng giữ trọn máy build + trí nhớ build trong git riêng. Thành công = 5 acceptance của P11, đo bằng lệnh thật: suite 234/234 trong `./repo` · một cell bee smoke trọn vòng ghi vào `./repo` · `fgos ready` + `fgos-runner --dry-run` đúng chỗ mới · doctrine tách đôi · onboard check xưởng ok. KHÔNG hành vi sản phẩm nào đổi.

## Current State

Một thư mục trộn: cây sản phẩm (`src/ test/ bin/ .fgos/`...) ngang hàng máy bee (`.bee/ .claude/`...) trong một `.git` chung; 47 file `.bee/` + `plans/` + `docs/history/` nằm trong lịch sử; AGENTS.md/CLAUDE.md gánh chung hai bên. Chi tiết: báo cáo consult 260714-1649.

## Scope

**In:** script di trú có checkpoint + dry-run; tách doctrine; move cây + `.git`; commit untrack; git init xưởng; sửa `.bee/config.json` commands; proof suite; dọn GitNexus. **Out:** coexistence P10, export P12, sửa bee upstream, re-review candidates, mọi đổi hành vi sản phẩm.

## Proposed Approach

Script-hóa + diễn-tập-trước: xem `approach.md`. Không lệnh tay, không đụng đồ thật trước khi bản sao xanh.

## Technical Design (authored từ artifacts)

**Script `scripts/repo-divorce.mjs`** (zero-dep, tài sản xưởng): các bước đánh số, mỗi bước có precheck + postcheck, dừng ngay khi lệch; `--dry-run` in kế hoạch đầy đủ (danh sách move sinh từ `git ls-files` đối chiếu bảng D2 — mọi file tracked phải được phân loại tường minh, file không phân loại được = DỪNG hỏi người); `--execute [--root <path>]` để cùng một script chạy được trên bản sao lẫn đồ thật. Trình tự (SỬA sau feasibility probe — move-một-phần bị chứng minh để lại dòng D): (1) move NGUYÊN KHỐI workspace + `.git` vào `repo/` — chỉ vậy status mới sạch; (2) swap doctrine + reading-map từ staged; (3) `rm --cached` phần xưởng + `.gitignore` + MỘT commit untrack — **điểm-không-quay-lại, gõ xác nhận**; (4) BƯỚC TÁCH: move thư mục xưởng từ trong `repo/` ngược lên gốc ở mức FILESYSTEM theo bản đồ D2 (kèm đồ ignored xưởng — .bee/state.json, logs, upstreams; đồ ignored sản phẩm như .gitnexus ở lại repo/) + postcheck hook paths resolve từ gốc; (5) `git init` xưởng + `.gitignore` chứa `repo/` + commit khởi tạo; (6) vá `.bee/config.json` commands bằng text-edit nhắm đích (file hiện không strict-JSON — trailing comma, đã file friction). Mọi lệnh git mang `-C <path>` tường minh (bài học worktree-cwd).

**Doctrine staged:** AGENTS.md/CLAUDE.md xưởng = khối bee + luật xưởng + luật A2 ("phiên dev mở tại gốc xưởng") + bảng cắt D2 làm bản đồ; AGENTS.md/CLAUDE.md `./repo` = thuần forgent (trỏ specs, không một chữ bee). Soạn sẵn ở Phase A, swap ở bước 2 — nội dung duyệt được trước khi chạy.

**An toàn:** trước bước 3 mọi thứ lùi được bằng move ngược (test thật trên bản sao: chạy tới giữa, lùi, so cây). Diễn tập = chạy `--execute` trên bản sao `cp -a` của toàn workspace trong /tmp, rồi chạy TOÀN BỘ proof suite trên bản sao — thuộc validating, là điều kiện chặn của Gate 3.

## Affected Files

Phase A (file mới, chưa mutate): `scripts/repo-divorce.mjs`, 4 doctrine staged, 2 reading-map staged. Phase C (mutate theo script): toàn workspace theo bảng D2 + `.bee/config.json` (chỉ `commands`). Chiếu lại từ cells sau Gate 2.

## Implementation Steps

Cells tạo sau Gate 2, dự kiến: (1) script + dry-run proof; (2) doctrine + reading-map staged; (3) [sau validating-rehearsal] execute thật + commands + proof suite + dọn GitNexus. Diễn tập trên bản sao KHÔNG phải cell — nó là bằng chứng validating trước Gate 3.

## Validation Plan

**Validating slice A đã chạy (2026-07-14) — bằng chứng: `reports/validation-slice-a.md`.** Panel 4 lăng kính: feasibility bắt 3 BLOCKER bằng probe mkdtemp (move-một-phần để lại dòng D; bảng D2 không phủ product roots; scripts/ vô gia cư) — cả ba vá TRƯỚC khi có dòng code nào; trình tự execute chốt 6 bước theo đúng probe TEST B; iteration-2 confirm 4/4 resolved, action cell 1 viết lại thành một khối sạch. **Rehearsal bản sao /tmp vẫn là điều kiện chặn của slice C** (chưa chạy — cần script tồn tại trước): bản sao chạy --execute → 234/234 trong repo bản sao, untrack đúng, doctrine tách, onboard ok, chạy-nửa-rồi-lùi sạch.

## Risks & Mitigation

Risk map: `approach.md`. Đỉnh: move nguyên khối (HIGH, data-loss-shaped — diễn tập + checkpoint), untrack nhầm file sản phẩm (danh sách sinh từ ls-files + phân loại bắt buộc + postcheck), doctrine swap làm phiên bee sau mù luật (onboard check + A2 thành văn).

## Rollback Plan (authored)

Trước commit untrack (điểm-không-quay-lại): move ngược cây + `.git` về gốc, xóa file staged — script có lệnh `--rollback` cho chính các bước đã checkpoint. Sau commit untrack: không "lùi" — nhưng cũng không mất gì: mọi file vẫn trên đĩa, lịch sử nguyên vẹn; muốn hồi tracking chỉ là `git revert` commit untrack + move ngược (thao tác tay, có ghi trong README script). Git xưởng mới (bước 4) vô hại — xóa `.git` xưởng là hết. Bản sao /tmp giữ nguyên tới khi đồ thật xanh — là ảnh phục hồi cuối cùng.

## Open Questions

- Chuỗi verify mới nguyên văn (đường distill từ xưởng) — chốt bằng chạy thật tại validating.
- Hành xử của `reviews status` với 2 candidate sau commit untrack — quan sát trên bản sao, ghi vào plan trước Gate 3.
