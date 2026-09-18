// P05.2 shared, frozen case brief -- imported BYTE-IDENTICAL by both the
// R6 single-agent-baseline driver and the R7 live-framework-proof driver,
// so "both modes read the SAME frozen objective/context ... no separate
// briefing, no hint that carries information from one mode to the other"
// (case-lock.md "Budgets") is a structural guarantee, not a promise kept by
// hand-copying a string twice. Every line below is transcribed verbatim
// from proofs/P05.2/case-lock.md (frozen, committed 7910fc22) -- this file
// never adds, drops, or rephrases anything from that lock.

export const CASE_BRIEF = `FROZEN EXTERNAL CASE (verbatim from proofs/P05.2/case-lock.md, project: mdview @ 84a6710ad2970d2702e6ff2814314fe39f9392b8, "chore: bump version to 0.7.5")

=== Objective (verbatim as confirmed with the maintainer) ===

Vietnamese (original): "Đánh giá việc thêm một MÀN HÌNH EDITOR MỚI, tách biệt (không sửa trực tiếp trên màn hình view hiện tại) để chỉnh sửa markdown và ghi thay đổi ngược lại file .md gốc, có đơn giản không về mặt kiến trúc, và xác định rủi ro/vấn đề lớn nhất."

English: Assess whether adding a NEW, separate editor screen (never inline editing on the existing view screen) to mdview -- one that edits markdown and writes the change back to the source .md file -- is architecturally simple, and identify the single largest risk/blocker.

Explicit constraint carried into the objective itself (maintainer's own words): the editor must be its own screen, never inline editing grafted onto the current read-only view route. Any candidate answer that proposes inline editing on the existing view screen has NOT answered the locked objective and must be flagged as such, never silently accepted as if it satisfied the question.

=== Context snapshot (frozen, quoted verbatim from mdview @ 84a6710a) ===

[Current product positioning -- PRD.md §3.2, Non-goals]
- Không phải static site generator (không build output ra HTML tĩnh).
- Không phải authoring tool hay WYSIWYG editor.
- Không phải tool để deploy/host public (chỉ dùng locally hoặc trong private network).
- Không cần authentication (để đơn giản; security tùy người dùng tự xử lý ở network level).
- Không sync hay backup files.
- Desktop app không phải app đứng riêng có registry riêng -- chỉ là cửa sổ/tray native nhìn vào cùng một daemon (§7.5); vẫn read-only, không phải editor.

[Deployment topology -- PRD.md §7.1]
MDView chạy như một server (daemon) duy nhất; browser tab và cửa sổ desktop chỉ là client nhìn vào nó. Bất biến bắt buộc: không bao giờ có 2 daemon cùng ghi một registry SQLite.
- Web (phần lớn thời gian): agent gọi mdview_view_file -> daemon trả url -> user click -> xem trong browser. Desktop không cần bật.
- Desktop (thỉnh thoảng): App đọc ~/.mdview/daemon.lock: có daemon sống -> cửa sổ chỉ attach (webview -> :7700); chưa có -> app tự spawn daemon rồi mới hiện cửa sổ.
Hệ quả DRY: chỉ một web UI -- xem qua browser hay qua Tauri webview đều cùng một code path render; live reload / registry / MCP share tự động vì cùng một daemon.

[URL namespace -- PRD.md §7.2, current routes]
/                                 -> Project list
/p/{project-id}/                  -> Project home + file tree
/p/{project-id}/{path/to/file.md} -> Render file
/p/{project-id}/_search           -> Search trong project
/api/projects                     -> REST API (cho UI)
/api/projects/{id}/files          -> File list
/settings                         -> Trang cấu hình hệ thống (FR-22b)
/api/config                       -> GET/PUT cấu hình (cho Settings UI)
/api/status                       -> Health check
/ws                               -> WebSocket endpoint (live reload)

[Code organization -- PRD.md §7.4, Clean Architecture / Ports & Adapters]
Workspace Rust (một core, nhiều adapter):
mdview-core/    (lib)  DOMAIN + APPLICATION: registry, indexer, link resolver, search, render (comrak). Định nghĩa PORTS (trait): FileStore, Watcher, Clock, ProjectRepository. KHÔNG phụ thuộc Axum / Tauri / SQLite.
mdview/         (bin)  Adapter CLI + daemon: HTTP/WS (Axum), MCP server, clap CLI.
mdview-desktop/ (bin)  Adapter Tauri: cửa sổ native + tray, attach/spawn daemon.
adapters/              SQLite (rusqlite) impl ProjectRepository; notify impl Watcher; ...
Dependency rule -- phụ thuộc chỉ hướng vào trong (adapter -> application -> domain). Domain không use Axum/Tauri/rusqlite.

[Desktop read-only invariant -- PRD.md §7.5]
Read-only: desktop không ghi vào file/folder user; state riêng (window, prefs) ở app-data-dir cross-platform (macOS Application Support, Linux ~/.local/share, Windows %APPDATA%).

[Confirmed absence of prior analysis]
grep-searched docs/backlog.md, PRD.md, README.md, and plans/ at the frozen commit for "editor"/"editable"/"edit mode": no existing plan, backlog item, or design discussion addresses adding editing capability. This case is genuinely unobserved by prior work.

=== End of frozen case brief ===`;
