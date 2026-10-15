# Runner section liveness scan

A19/P1, run before carriage at `edffd7c6b9cfb0461eec9e0fef65c9b4a2487acc`; source blob `ddfa78cc7183cf1f7db8ee64d2339653a0aa0023`. 495 units, 167 direct sections (including preamble). No subject is declared retired. Current-by-default, current-decision and historical/decision carriage are evidence-based protection classes, not truth verdicts. The 11 live decision records 0047, 0052 and 0055–0063 are current-decision; other decisions with live rule/path evidence remain truth eligible. directReferenceCount is file-level; ruleReferences and cited paths are section-local.

The committed [scan script](step9-liveness-scan.mjs) records lexical source/anchor citations, per-section RUL consumers and extant/missing implementation paths in [full scan](step9-liveness.json). No hit is not proof of no consumer. Identified false current-state sentences are corrected under A41 in the candidate carriers; dated/superseded history stays verbatim. The existing draw plus bounded correction re-review meets A41, with no further draw; full truth is owed at promotion. Independent regenerated liveness review remains pending.

| Heading | Lines | Class | RUL consumer hits | Extant / missing cited paths |
|---|---|---|---:|---|
| Preamble | 1–8 | current-by-default | 0 | 0 / 0 |
| Spec: Runner (vòng tự hành) | 9–10 | current-by-default | 0 | 0 / 0 |
| Dispatch runtime inspection | 11–12 | current-by-default | 0 | 0 / 0 |
| Guard reconciliation | 13–55 | current-by-default | 0 | 0 / 0 |
| Entry Points & Triggers | 56–70 | current-by-default | 0 | 0 / 0 |
| Data Dictionary | 71–88 | current-by-default | 19 | 1 / 0 |
| Hợp đồng rigor → tier (Phase 2, 2026-10-01) | 89–100 | current-by-default | 0 | 0 / 0 |
| Behaviors & Operations | 101–102 | current-by-default | 0 | 0 / 0 |
| Kiểm tra tiền-điều-kiện lúc khởi động (repo root + HEAD phải resolve được) | 103–109 | current-by-default | 0 | 0 / 0 |
| Một vòng --once (hạnh phúc) | 110–116 | current-by-default | 14 | 0 / 0 |
| Vòng cầm-giao bền (`--watch`) — str7-str8-priority-intent | 117–124 | current-by-default | 12 | 0 / 0 |
| Giao việc theo mẻ, song song có giới hạn, giữ quyền-sở-hữu-gốc | 125–131 | current-by-default | 3 | 0 / 0 |
| Cây nhánh tích hợp — con nhập vào nhánh của gốc, chỉ gốc nhập vào cây chính | 132–137 | current-by-default | 5 | 0 / 0 |
| Trôi tích hợp & đồng bộ lại tại gốc→cây chính (integration drift) | 138–143 | current-by-default | 0 | 0 / 0 |
| Đồng bộ lại một việc đỗ (catch-up) | 144–151 | current-by-default | 1 | 0 / 0 |
| Phát hiện trôi sau nhập nhánh (postLand drift & notify consumer) | 152–157 | current-by-default | 0 | 1 / 0 |
| Quét nghiên-cứu trước dispatch (discovery dispatch) | 158–199 | current-by-default | 16 | 0 / 0 |
| Quét chia-việc trước dispatch (plan sweep) | 200–243 | current-by-default | 16 | 0 / 0 |
| Gặt-lại lúc khởi động (reap — phục hồi sau crash) | 244–252 | current-by-default | 0 | 1 / 0 |
| Chấm trượt / lỗi giữa vòng | 253–260 | current-by-default | 3 | 0 / 0 |
| Ghi lại output của trợ lý sau mỗi lượt dispatch (persist log) | 261–281 | current-by-default | 1 | 0 / 0 |
| Xem live output worker khi đang chạy (live tee, STR39) | 282–309 | current-by-default | 0 | 0 / 0 |
| Ai ngã-ngũ — role trên settlement (Phase 3 S3-closeout) | 310–327 | current-by-default | 0 | 0 / 0 |
| Cổng duyệt PR nội bộ (approval gate) — review/approve/reject | 328–451 | current-by-default | 8 | 1 / 0 |
| Cổng duyệt qua GitHub (GitHub transport, tuỳ chọn) — review/approve --github | 452–547 | current-by-default | 7 | 0 / 0 |
| Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve) | 548–635 | current-by-default | 0 | 0 / 1 |
| Iron Law — phân loại rủi ro của một candidate fix (self-improve loop STR13 Slice 2/3) | 636–710 | current-by-default | 8 | 0 / 0 |
| Tín hiệu compounding qua check (entropy-trend + seal-digest) | 711–751 | current-by-default | 0 | 1 / 0 |
| Phiên checkout đa-phiên — session start / end / list / gc | 752–825 | current-by-default | 0 | 0 / 0 |
| Bảo vệ approve khỏi lồng phiên (session-nesting guard, Epic 2) | 826–877 | current-by-default | 0 | 1 / 0 |
| Khóa hoạt động cây chính — chặn commit trần khi phiên khác đang hoạt động (STR65) | 878–907 | current-by-default | 0 | 0 / 0 |
| Vòng làm việc có hướng dẫn qua tầng skill trích xuất (entry skill + phase skills, P50) | 908–928 | current-by-default | 23 | 0 / 0 |
| Báo việc-phát-hiện từ trợ lý (worker→runner discovery report) | 929–940 | current-by-default | 0 | 0 / 0 |
| Actors & Access | 941–951 | current-by-default | 0 | 0 / 0 |
| Business Rules | 952–1122 | current-by-default | 482 | 32 / 5 |
| Edge Cases Settled | 1123–1174 | current-by-default | 11 | 0 / 0 |
| Open Gaps | 1175–1206 | current-by-default | 58 | 1 / 0 |
| Visuals | 1207–1210 | current-by-default | 0 | 0 / 0 |
| Pointers (implementation) | 1211–1264 | current-by-default | 78 | 48 / 5 |
| Từ vựng dispatch hiện hành | 1265–1268 | current-by-default | 0 | 1 / 0 |
| Bảng đối chiếu từ vựng dispatch | 1269–1296 | current-by-default | 0 | 3 / 0 |
| ExecutorProfile / Invocation — target vocabulary (Phase 06, executor-policy-dispatch-seams; identity/supports made real config, Phase C, executor-profile-schema-migration) | 1297–1361 | current-by-default | 0 | 4 / 2 |
| CoordinationSession (Lịch sử — đã thu hồi per P4; thay bằng CollaborationPattern & Workflow runner) | 1362–1415 | historical-or-decision-carriage | 0 | 0 / 1 |
| Dispatch operability implementation slice (2026-09-16) | 1416–1608 | current-by-default | 0 | 15 / 10 |
| Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) | 1609–1613 | current-by-default | 0 | 0 / 0 |
| 0005 — Runner & cô lập worker | 1614–1615 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 1616–1627 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 1628–1646 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 1647–1657 | historical-or-decision-carriage | 0 | 0 / 0 |
| 0008 — Routing theo audience của từng interface | 1658–1659 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 1660–1666 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 1667–1676 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 1677–1685 | historical-or-decision-carriage | 0 | 0 / 0 |
| 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập) | 1686–1687 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 1688–1721 | current-decision | 0 | 1 / 0 |
| Quyết định | 1722–1735 | current-decision | 0 | 0 / 0 |
| Vì sao không khóa-trong-cây (symlink như session.mjs) | 1736–1748 | current-decision | 0 | 0 / 0 |
| Vì sao không cô-lập-cây đầy đủ (bootstrap-copy + union-merge, kiểu beegog/symphony) | 1749–1761 | current-decision | 0 | 0 / 0 |
| Vì sao chặn-cây | 1762–1780 | current-decision | 0 | 0 / 0 |
| Hệ quả | 1781–1794 | current-decision | 0 | 0 / 0 |
| 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence | 1795–1796 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 1797–1823 | current-decision | 0 | 2 / 0 |
| Quyết định | 1824–1847 | current-decision | 0 | 3 / 0 |
| Vì sao không app-level lock-wrap trong `approve` | 1848–1853 | current-decision | 0 | 0 / 0 |
| Vì sao không epoch-fence-merge-gate | 1854–1860 | current-decision | 0 | 0 / 0 |
| Hệ quả | 1861–1878 | current-decision | 0 | 0 / 0 |
| 0022 — Khảo sát choke-point fgOS (quyết định lặp/lệch xuyên CLI/runner/skill) | 1879–1880 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 1881–1890 | current-decision | 0 | 0 / 0 |
| Candidates | 1891–1892 | current-decision | 0 | 0 / 0 |
| Xác nhận THẬT (choke-point có bằng chứng cụ thể) | 1893–1894 | current-decision | 0 | 0 / 0 |
| 1. `take` vs `pick` — 2 định nghĩa khác nhau cho "item này claim được không" | 1895–1945 | current-decision | 0 | 3 / 0 |
| 2. Kiểm tra working-tree sạch — 2 định nghĩa độc lập cho `return` và `approve` | 1946–1968 | current-decision | 0 | 2 / 0 |
| 3. `createWorktree` — 6 call site, mỗi nơi tự xử lý baseRef/cleanup riêng | 1969–1990 | current-decision | 0 | 4 / 0 |
| Đã kiểm tra, KHÔNG phải choke-point (loại khỏi danh sách, có bằng chứng) | 1991–2014 | current-decision | 0 | 6 / 0 |
| Ghi chú liên quan — không phải finding mới của item này | 2015–2031 | current-decision | 0 | 1 / 1 |
| Ranked priority | 2032–2044 | current-decision | 0 | 0 / 0 |
| No fixes applied | 2045–2052 | current-decision | 0 | 0 / 0 |
| 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng | 2053–2054 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 2055–2075 | current-decision | 0 | 1 / 0 |
| Quyết định | 2076–2086 | current-decision | 0 | 0 / 0 |
| Hệ quả | 2087–2094 | current-decision | 0 | 0 / 0 |
| 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md | 2095–2096 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 2097–2114 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 2115–2124 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 2125–2134 | historical-or-decision-carriage | 0 | 0 / 0 |
| Làm rõ phạm vi "ai" ship faster (bổ sung 2026-08-05) | 2135–2166 | historical-or-decision-carriage | 0 | 0 / 0 |
| 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity | 2167–2173 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 2174–2185 | current-decision | 0 | 0 / 0 |
| Đơn vị vận hành (vocabulary, chốt dùng xuyên suốt từ đây) | 2186–2241 | current-decision | 0 | 1 / 0 |
| Quy tắc chọn cơ chế dispatch (áp dụng y hệt cho subTask lẫn capacity) | 2242–2278 | current-decision | 0 | 0 / 0 |
| Lớp còn thiếu — LLM đủ thông minh để tự nhận ra khi nào dùng nhánh nào (Đã hoàn thành 4/5 pha; Pha 5 hoãn/YAGNI) | 2279–2288 | current-decision | 0 | 1 / 0 |
| Quan hệ với việc đã khoá — không mâu thuẫn, chỉ hẹp hơn | 2289–2301 | current-decision | 0 | 0 / 0 |
| Ranh giới quan sát được (observability) — tránh ngộ nhận | 2302–2315 | current-decision | 0 | 0 / 0 |
| Việc chưa quyết, để lại cho item build lớp quyết định thật (Đã hoàn tất qua `dispatch.mjs decide` & Pha 1-4; Pha 5 hoãn) | 2316–2321 | current-decision | 0 | 1 / 0 |
| Kế hoạch triển khai (5 pha, đã file thành work item, deps thật) | 2322–2331 | current-decision | 0 | 0 / 0 |
| Tham chiếu | 2332–2340 | current-decision | 0 | 0 / 0 |
| 0028 — Đổi tên pinned term `orchestrator` thành `launcher` | 2341–2342 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 2343–2361 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 2362–2383 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 2384–2402 | historical-or-decision-carriage | 0 | 0 / 1 |
| 0029 — Sửa ba mệnh đề từ vựng dispatch của `0026`: bỏ `rootTask`/`subTask`, `capacity` là năng lực có tên, T1 hai giá trị | 2403–2404 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 2405–2415 | current-decision | 0 | 0 / 0 |
| Quyết định | 2416–2417 | current-decision | 0 | 0 / 0 |
| — bỏ `rootTask`/`subTask` khỏi từ vựng dispatch | 2418–2434 | current-decision | 0 | 0 / 0 |
| — `capacity` = một năng lực có tên (behavior-promise / functional-helper) | 2435–2452 | current-decision | 0 | 0 / 0 |
| — T1 (vai trò bên gọi) hai giá trị: `launcher`/`driver`; `orchestrator` = tầng hợp thành T0 | 2453–2472 | current-decision | 0 | 0 / 0 |
| Hệ quả | 2473–2491 | current-decision | 0 | 1 / 1 |
| Tham chiếu | 2492–2504 | current-decision | 0 | 0 / 2 |
| 0030 — Thêm bậc ưu tiên #2 "Release con người" vào thứ tự ưu tiên sản phẩm | 2505–2506 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 2507–2535 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 2536–2561 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 2562–2576 | historical-or-decision-carriage | 0 | 0 / 0 |
| 0031 — Bỏ guard cấm từ `orchestrator` sau khi `0029` đã gán nghĩa mới | 2577–2578 | historical-or-decision-carriage | 0 | 0 / 0 |
| Bối cảnh | 2579–2607 | historical-or-decision-carriage | 0 | 0 / 0 |
| Quyết định | 2608–2641 | historical-or-decision-carriage | 0 | 0 / 2 |
| Từ vựng sau record này | 2642–2650 | historical-or-decision-carriage | 0 | 0 / 0 |
| Hệ quả | 2651–2672 | historical-or-decision-carriage | 0 | 0 / 3 |
| Tham chiếu | 2673–2678 | historical-or-decision-carriage | 0 | 0 / 3 |
| 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức `warn`, agent gõ lệnh thay người | 2679–2680 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 2681–2711 | current-decision | 0 | 1 / 0 |
| Quyết định | 2712–2759 | current-decision | 0 | 1 / 0 |
| Vì sao `supersedes:` trống | 2760–2769 | current-decision | 14 | 1 / 0 |
| Hệ quả | 2770–2784 | current-decision | 15 | 1 / 0 |
| Tham chiếu | 2785–2794 | current-decision | 0 | 0 / 1 |
| 0033 — Capacity cli-spawn-shaped thắng hasLiveTaskAccess, thu hẹp 0026 rule 2 | 2795–2796 | current-decision | 0 | 0 / 0 |
| Quyết định | 2797–2807 | current-decision | 0 | 0 / 0 |
| Người quyết | 2808–2816 | current-decision | 0 | 0 / 0 |
| Lý do 0026 rule 2 không áp dụng ở đây | 2817–2829 | current-decision | 0 | 0 / 0 |
| Cơ chế phân biệt (không phải heuristic mới) | 2830–2845 | current-decision | 0 | 1 / 0 |
| Bằng chứng đã kiểm | 2846–2864 | current-decision | 0 | 1 / 0 |
| Việc chưa quyết, để lại | 2865–2877 | current-decision | 0 | 0 / 0 |
| Tham chiếu | 2878–2883 | current-decision | 0 | 0 / 0 |
| 0034 — Đổi tên `capacity`/`capacities` thành `executor`/`executors`, chốt tách `capability` | 2884–2885 | current-decision | 0 | 0 / 0 |
| Quyết định | 2886–2903 | current-decision | 0 | 1 / 0 |
| Chính thức hóa việc tách `capability`/`capacity` mà `0029` để ngỏ | 2904–2916 | current-decision | 0 | 0 / 0 |
| Phạm vi đổi tên | 2917–2938 | current-decision | 0 | 3 / 1 |
| Một collision đã xử lý khi thực thi | 2939–2951 | current-decision | 0 | 0 / 0 |
| Tham chiếu | 2952–2960 | current-decision | 0 | 0 / 0 |
| Capability-aware dispatch activation (tsk-46f) | 2961–2962 | current-decision | 0 | 0 / 0 |
| Quyết định | 2963–2968 | current-decision | 0 | 1 / 0 |
| Agent-coordination foundation — shared capability catalog & planning-awareness cluster (docs/history/agent-coordination-foundation/plan.md) | 2969–2970 | current-decision | 0 | 0 / 0 |
| Quyết định | 2971–2981 | current-decision | 0 | 6 / 0 |
| 0035 — Ranh giới tin cậy của cổng mutation-gate: caller trong-tiến-trình cùng lớp tin cậy với user, không phải kẻ tấn công | 2982–2983 | current-decision | 0 | 0 / 0 |
| Quyết định | 2984–3013 | current-decision | 0 | 2 / 0 |
| Confinement Authority — một cửa kiểm soát giam giữ runtime (executeThroughConfinement) | 3014–3023 | current-decision | 0 | 2 / 0 |
| Đổi sang atomic CAS commit tree cho Merge Gate (D-ADR0042 (atomic CAS commit tree cho Merge Gate)) | 3024–3032 | current-decision | 0 | 0 / 0 |
| 0043 — Vocabulary: bound-invocation-supervisor vs detached-run-supervisor | 3033–3034 | current-decision | 0 | 0 / 0 |
| Bối cảnh | 3035–3054 | current-decision | 0 | 1 / 0 |
| Quyết định | 3055–3073 | current-decision | 0 | 0 / 0 |
| Hệ quả | 3074–3087 | current-decision | 0 | 0 / 0 |
| 0046 — Gom thang tier/rigor: 2 thang + 1 bảng, xoá mọi lớp chồng | 3088–3100 | current-decision | 0 | 0 / 0 |
| 0047 — P1 Lõi thực thi: Unit, một bind(), một cửa chạy fgos run, 3 Pattern cộng tác, đóng 4 mối authority L5 [§1 ĐÃ BỊ THAY MỘT PHẦN bởi 0061] | 3101–3113 | current-decision | 0 | 5 / 0 |
| 0048 — P2 Plan chạy được: Unit cho mọi đường vào, driver mỏng fgos-run, bỏ DemandFacts/matcher | 3114–3124 | current-decision | 0 | 2 / 1 |
| 0049 — P3b Work không còn stage: Work chỉ còn bản ghi/lifecycle, Workflow runner là sequencer duy nhất, đóng A4 | 3125–3135 | current-decision | 0 | 0 / 1 |
| 0050 — P6 Nối thật: herdr là transport mặc định, posture một đường, fallback quota qua pane mới | 3136–3157 | current-decision | 0 | 1 / 0 |
| 0051 — Cổng ghi file đi theo chuỗi fallback; quyền git của invocation giữ lại cho Work loop | 3158–3167 | current-decision | 0 | 0 / 0 |
| 0052 — Worker không bao giờ có quyền git: runner commit trên mọi đường (thay mục 2 của 0051) [ĐÃ BỊ THAY MỘT PHẦN bởi 0060] | 3168–3180 | current-decision | 0 | 0 / 0 |
| 0053 — Một cơ chế truyền kết quả: đường dẫn report trong contextRefs, phân giải một lần | 3181–3192 | current-decision | 0 | 0 / 0 |
| 0055 — Panel: khác họ provider giữa các ghế là ưu tiên mềm, `bind()` rải ghế theo thứ tự `prefer`; `reviewed` vẫn cứng | 3193–3206 | current-decision | 0 | 0 / 0 |
| 0056 — `--seats`: chuyên biệt hoá ghế panel bằng lens khi khởi động, không thêm workflow YAML hay registry | 3207–3221 | current-decision | 0 | 1 / 0 |
| 0057 — `--seats @name`: persona có tên theo ba tầng tra cứu, ghim nội dung lúc start, gắn đúng một ghế | 3222–3238 | current-decision | 8 | 1 / 0 |
| 0058 — Provider failure fails over inside Execution Core: another account of the same provider first, then the next candidate | 3239–3254 | current-decision | 0 | 0 / 0 |
| 0059 — A domain persona pack is a folder; what a seat can name, what it pinned and who ran it are each stated by one read | 3255–3269 | current-decision | 0 | 0 / 0 |
| 0060 — Runner commit theo `writes` của Unit: một matcher, preflight index, resume chỉ commit, brief ghi file nói rõ phạm vi (thay mục 1-2 của 0052) | 3270–3285 | current-decision | 1 | 1 / 0 |
| 0061 — Unit ad-hoc được `prefer`/`persona` mềm; one-liner `fgos run "<prompt>"`; `workflow start --units`/`--effort`; unit ghi nối nhánh (thay một phần mục 1 của 0047) | 3286–3299 | current-decision | 1 | 0 / 0 |
| 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work (thay phần purpose door của RUL68 (2 tầng dispatch) và phần "mỗi cửa một lane posture" của RUL77 (posture belongs to the capability)) | 3300–3319 | current-decision | 0 | 3 / 0 |
| 0063 — Work chỉ là bên dùng: dispatch nhận input generic (thay phần đầu vào còn lại của RUL73 (dispatch does not know Work).2) | 3320–3336 | current-decision | 1 | 1 / 0 |
