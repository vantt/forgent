# Host Invocation boundary conservation review

Author session: codex-session:5@2026-10-13
Merge commit: 0653419c19e7c37d8d00408ad482cdecbd45a807
Pre-merge tree: 63af2a5f9
Main pin: 5ebbffc94da1ca6448f392dd37235020834509e1

State: ready-for-review. Batch is open. Scope is owner A31 only: one merge conflict resolution, conservation source rebindings and native identity gaps created by the merge, and machine comparison of unchanged cited-text re-pins. Main-only files are checked against the main diff as successor evidence. Code truth is not re-reviewed.

## Applied reviews and batch context

All six source and five successor follow-up verdicts from df8321b33 are applied in ordinary mode with exact notes; 431/431 Host source decisions and 35/35 existing successors are reviewed. Fourteen changed native units were accepted with no rework. dropped-010 is deferred to Packaging-distribution (Step 4) under owner F6; its FLAGGED-obsolete literal retention remains untouched. Preview: [link rewrite](link-rewrite-preview-host-invocation-routing.md), [135 draft aliases](draft-alias-host-invocation-routing.json), 4,031 inbound edges, zero consumers changed.

Fresh readers under A32 pass using the key/pilot counting: 6/6 in all six reader/scenario cells with partials, 25/25 distinct anchors pass the official checker, at most four files before the first correct owner, zero legacy-authority answers. Isolation remains instruction-only and UNPROVEN. Notes to carry into the final batch report: no explicit area risk rubric; no area-level done definition; restored-section navigation depends on portal/pointers; release-manifest ownership is outside the area; the deferred npm-bin clause was not reached. No docs were edited for these gaps.

## Review set

- 3 current source decisions (2 rebound existing rows + 1 native new source successor).
- 18 native identity gaps, including the old source code-fence identity. No retired units created, no native ID graft.
- 43 code-evidence re-pins: cited excerpts unchanged, all other receipt fields identical. Receipt artifact at b6cdda81b333a375ebfb72141e962e1feac724f0: `plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-boundary-repin.json`. Original authorship is retained (codex-session:1@2026-10-11); this session only re-pins evidence. Lead verifies by machine and creates the report binding, without truth re-review.
- 31 changed-code references retain their old receipt rows as history and current units go to candidate-unverified under A28. No approval carries.

Full machine accounting: [conservation](host-invocation-boundary-accounting.json), [evidence pins](host-invocation-boundary-code-evidence.json). Pending gap data: `plans/260925-documentation-authority-unification/ledger/decisions/s3-host-invocation-boundary-gaps.json`; source rebindings and the old source gap are in `plans/260925-documentation-authority-unification/ledger/decisions/s2-agent-coordination-truth-judgment.json`.

## Conflict resolution

Keep the plan document shape and every byte outside Routing Identities. Replace only the capability block with main’s exact block, including kind tool executors only. This imports main content; it is not a new plan design. The four legacy-root ratchet entries account imported main bytes only.
````text
diff --git a/docs/platform/agent-coordination/architecture/dispatch-control-plane.md b/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
index 6041476ec..78b45b1ac 100644
--- a/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
+++ b/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
@@ -78,9 +78,9 @@ The dispatch core recognizes exactly two target identities. No other name
 resolves a Run target.
 
 ```txt
-capability   — abstract behavior promise, bound only by
-               runner.capabilities.<capability>.prefer;
-               executor for[] declarations do not bind this selector
+capability   — abstract behavior promise, resolved through
+               runner.capabilities.<capability> (prefer/overrides), then
+               runner.executors.<id>.for[] (kind "tool" executors only)
 executor-id  — explicit concrete implementation override, naming a
                runner.executors.<id> entry directly
 ```

````

## Main-only successor diff

Base: c719f0527e4d63b07a1f89f8d0286f664cfa3dec
Diff SHA256: 1bf5cbf1c0ad1aebf10a5a98cc7e86f6614df0aac465803954376e691f65d5ee

````text
diff --git a/docs/architect/agent-coordination/architecture/dispatch-control-plane.md b/docs/architect/agent-coordination/architecture/dispatch-control-plane.md
index f7113b843..b8b66197f 100644
--- a/docs/architect/agent-coordination/architecture/dispatch-control-plane.md
+++ b/docs/architect/agent-coordination/architecture/dispatch-control-plane.md
@@ -58,7 +58,7 @@ resolves a Run target.
 ```txt
 capability   — abstract behavior promise, resolved through
                runner.capabilities.<capability> (prefer/overrides), then
-               runner.executors.<id>.for[]
+               runner.executors.<id>.for[] (kind "tool" executors only)
 executor-id  — explicit concrete implementation override, naming a
                runner.executors.<id> entry directly
 ```
diff --git a/docs/architecture-manifest.json b/docs/architecture-manifest.json
index 1f8a4e0a7..e923fa822 100644
--- a/docs/architecture-manifest.json
+++ b/docs/architecture-manifest.json
@@ -65,6 +65,8 @@
     "src/runner/dispatch/provider-capacity.mjs": "infra",
     "src/runner/dispatch/provider-auth-failure.mjs": "infra",
     "src/runner/dispatch/provider-credential-probe.mjs": "infra",
+    "src/runner/dispatch/provider-account-probe.mjs": "infra",
+    "src/runner/dispatch/provider-credential-renewal.mjs": "infra",
     "src/runner/dispatch/assignment-runner.mjs": "infra",
     "src/runner/dispatch/settlement.mjs": "infra",
     "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
@@ -177,6 +179,7 @@
     "src/setup/ansi.mjs": "domain",
     "src/setup/config-merge.mjs": "domain",
     "src/setup/shell-rc.mjs": "infra",
+    "src/setup/project-launcher.mjs": "infra",
     "src/setup/bin-discovery.mjs": "infra",
     "src/setup/skill-wrappers.mjs": "infra",
     "src/setup/instruction-registry.mjs": "infra",
diff --git a/docs/platform/agent-coordination/architecture/dispatch-control-plane.md b/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
index 1961c9a67..79608c1ab 100644
--- a/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
+++ b/docs/platform/agent-coordination/architecture/dispatch-control-plane.md
@@ -54,7 +54,7 @@ resolves a Run target.
 ```txt
 capability   — abstract behavior promise, resolved through
                runner.capabilities.<capability> (prefer/overrides), then
-               runner.executors.<id>.for[]
+               runner.executors.<id>.for[] (kind "tool" executors only)
 executor-id  — explicit concrete implementation override, naming a
                runner.executors.<id> entry directly
 ```
diff --git a/docs/platform/component-boundary.md b/docs/platform/component-boundary.md
index dd858828b..38a437f37 100644
--- a/docs/platform/component-boundary.md
+++ b/docs/platform/component-boundary.md
@@ -65,7 +65,7 @@ This table is a compact navigation surface, not a full replacement for the advis
 | Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |
 | Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
 | fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\|status\|stop`; không phải một phần của herdr và không phải "herdr-gateway" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
-| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters. | [../specs/confinement-authority.md](../specs/confinement-authority.md) |
+| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |
 | Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |
 | Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
 | Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |
diff --git a/docs/platform/packaging-distribution/spec.md b/docs/platform/packaging-distribution/spec.md
index 2700f4e50..1a3fefc41 100644
--- a/docs/platform/packaging-distribution/spec.md
+++ b/docs/platform/packaging-distribution/spec.md
@@ -30,6 +30,7 @@ The spec is written for current behavior and near-term accepted target behavior.
 | `install.sh` | Implemented | Installs `fgctl` from release assets into a machine-local install directory. |
 | `install.ps1` | Implemented preview | The Windows counterpart of `install.sh` (PowerShell 5.1 or later, no administrator rights, no `PATH` change): installs `fgctl.exe` for `x86_64-pc-windows-msvc` with the same `FGCTL_VERSION` / `FGCTL_INSTALL_DIR` / `FGCTL_ASSET_BASE_URL` / `FGCTL_TARGET` semantics and a mandatory `SHA256SUMS` check (rule RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell) in `docs/specs/distribution.md`). |
 | `fgctl init` | Implemented preview | Initializes a project/workspace from a release chosen by `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the committed pin > the latest GitHub release; a downloaded asset is checksum-verified against `SHA256SUMS` before staging (rule RUL15 (fgctl init downloads a checksum-verified release when no source is given) in `docs/specs/distribution.md`). |
+| `fgos` launcher | Implemented preview | One `fgos` (`fgos.cmd` on Windows) written next to `fgctl` by `fgos doctor --fix` (which `fgctl init` runs): it walks up to the nearest `.fgos/installation/bin/fgos` and runs it, so each project runs its own activated release with no absolute path and no rc edit. A different `fgos` found first on `PATH` is reported, never overwritten. See distribution spec RUL17 (one fgos on PATH runs each project's own activated fgos). |
 | `fgctl upgrade` | Implemented preview | Moves a workspace activation to another release when supplied; current preview proof covers no-op upgrade against the verified asset. |
 | `fgctl repair` | Implemented preview | Repairs a workspace installation under the selected release model; current preview proof covers repair after activation. |
 | `.fgos/installation/bin/fgos` | Implemented preview | Stable workspace command surface after activation; current preview proof reports `host: "rust"` and the activated `artifactDigest`. |
diff --git a/docs/specs/confinement-authority.md b/docs/specs/confinement-authority.md
index bf5328a99..0221d7f73 100644
--- a/docs/specs/confinement-authority.md
+++ b/docs/specs/confinement-authority.md
@@ -1355,13 +1355,30 @@ Bảy rủi ro ban đầu đã được giải quyết qua các cell thi công P
 **Công thức (đã chạy thật, Request-to-Run P6):** một invocation `herdr-spawn` có `confinement.backend: bwrap` giữ trạng thái của agent trong một private home thay vì thư mục account thật (đang read-only dưới posture):
 
 1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
-2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Không mount thư mục account thật, không bypass flag thay sandbox.
-3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật; với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
+2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
+3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
 
 **Lịch sử (để khỏi suy ra lại):** `5a42bc376` (2026-09-11) `codex-bwrap` cli-spawn có private-home→`CODEX_HOME`; `569f72d3b`, `a1a966ff2`, `ec6a0745d` (09-16, rotator slice 1 thay `FGOS_CODEX_CREDENTIAL_HOMES`) chuyển credential sang inventory (khi đó chỉ `codex-home`). `c54c1888b`, `8c4b4aeeb`, `2cff7102a` (09-11..18) đưa launch confine của herdr-spawn qua Authority — chứng minh bằng worker giả và claude. `e37f8225d` (09-21, H8) từ chối `credential-provisioning-unsupported` cho adapter khác cli-spawn; lý do chỉ nằm trong comment code và `plans/reports/dispatch-execution-engine-architecture-review-260920.md`. `e7bd9b418`, `a9fc61324` (09-17) gộp/đổi tên executor id (`codex-bwrap` thành `openai`/`codex-cli-bwrap`), `5bbd066cd` xoá `claude-herdr`/`pi-herdr` "dormant" nên grep theo tên cũ không còn ra. `cfd670c43` (2026-10-01) áp posture lên mọi invocation herdr nhưng không kèm binding: codex/pi/agy chết ngay lúc khởi động (state dir read-only).
 
 **Vì sao từng bị quên:** (a) cách làm nằm trong commit và trong spec dưới nhãn "Codex bwrap" nên đọc như chuyện riêng của cli-spawn; (b) ngoại lệ H8 loại herdr-spawn không có trong spec; (c) id executor bị đổi tên, tìm theo tên cũ không thấy; (d) phase "facts" của kế hoạch chỉ hỏi về code hiện tại, không hỏi "trước đây đã có gì và vì sao bị bỏ". Bước kiểm tiền lệ nay nằm ở `AGENTS.md` ("Before touching code").
 
+### 13.2 Login được gia hạn trong private home: bản chép là snapshot, bản mới hơn được ghi ngược
+
+Private home nhận một **bản chép** của login, bị xoá sau dispatch. Hai điều đi kèm (chi tiết và luật ở `docs/specs/runner.md`, RUL75 (login xoay vòng được gia hạn một lần tại nguồn, trong bản chép fgOS giữ, và login được gia hạn trong private home được ghi ngược)):
+
+- **Kho SQLite chép dạng snapshot.** File `agent.db` (omp) trong danh sách `files` được chép bằng `VACUUM INTO` qua `node:sqlite` — snapshot nhất quán, gồm cả phần còn nằm trong write-ahead log — thay vì chép file thô thiếu WAL; không có `node:sqlite` thì chép file như trước. Danh sách file được phép chép không đổi, thư mục account thật vẫn không bao giờ được mount.
+- **Bản mới hơn được ghi ngược lúc xoá home.** Khi dispatch được opt-in (caller truyền hàm gia hạn), ownership marker của private home ghi thêm `credentialWriteBack` (provider, account, home nguồn, layout, runtime dir; chỉ tên và đường dẫn, không giá trị credential) sau khi chép xong. Mọi đường xoá home — cleanup của driver, `finalizeConfinementResources` và orphan reaper — đi qua một hàm xoá duy nhất (`removeConfinementDir`, `confinement/cleanup.mjs`): trước khi xoá, login trong home mới hơn login nguồn thì được dàn (staging) rồi áp lên nguồn dưới lock của account, một lần thử không chờ; lock bận thì để `pending/` cho lần refresh-ahead kế tiếp. Lỗi ghi ngược chỉ báo bằng mã cố định trên stderr và chỉ chặn việc xoá trong đúng một trường hợp: việc dàn thất bại (xem dưới). Bản dàn không bao giờ bị xoá khi nguồn không đọc được (đang ghi dở, `agent.db` không mở được, hoặc không xác định được entry) hay khi bản chép không đọc được vì lý do có thể qua (thiếu `node:sqlite`, `agent.db` không mở được): bản chép được giữ ở `pending/` (tối đa 5 bản mới nhất mỗi account) và báo `staged`/`apply-deferred`; chỉ xoá khi nguồn đọc được và chứng minh bản chép không mới hơn, hoặc bản chép được chứng minh hỏng (JSON hỏng, hay không có entry dùng được). Lỗi đọc file của hệ điều hành (quyền, I/O; mã `unreadable-file`) có thể qua nên bản chép được giữ; chỉ file kho không tồn tại (`missing-file`) mới được coi là rỗng và bị xoá. Nếu việc dàn thất bại, private home và marker được giữ lại (việc xoá báo lỗi, một dòng stderr mã cố định) để lần xoá sau, kể cả của reaper, thử lại; mỗi lần thất bại được đếm trong marker (`credentialKept`; hai lần cách nhau dưới 15 phút chỉ tính một, để lỗi tạm thời không dùng hết hạn mức), marker được ghi qua file tạm rồi rename và marker có mặt nhưng đọc không được thì việc xoá dừng lại. Sau 5 lần home bị giữ hẳn: không thử xoá nữa, không bao giờ bị xoá vì quá tuổi. Home bị giữ được kiểm lại dưới account lock khi account đó được gia hạn lần kế tiếp và bởi `fgos doctor --fix` (tập temp root tìm kiếm giống của doctor: root mặc định cộng `tempRoot` của từng backend đã đăng ký, lấy qua hook do phía dispatch truyền xuống; home nằm dưới `privateHomeRoot` riêng của backend không thuộc tập này nên không check, repair, reaper hay lần gia hạn nào thấy, và cũng không bao giờ bị xoá), và chỉ với home thuộc đúng runtime dir của lock đang giữ: chỉ xoá khi nguồn đọc được và chứng minh login trong home không mới hơn, hoặc login đó đã dàn được cạnh nguồn (và được áp); không thì vẫn giữ. Home cũng vẫn bị giữ khi `pending/` đã đầy và login của nó chỉ có thể được dàn (để trần không đẩy mất bản cũ hơn); bản đã dàn và thư mục `pending/` được đồng bộ xuống đĩa trước khi home bị xoá. File marker không nhận ra được là marker nào cả (không phải JSON, không phải object, hay không có tên contract) thì mọi việc xoá home đó dừng lại. Finalizer so digest của marker không tính `credentialKept` (cleanup của driver thêm trường này sau khi digest được lấy) và không dừng ở home đó mà vẫn xoá các resource còn lại của dispatch (dispatch ghi là `retained`, kèm lý do của home). Check `credential-copies-retained` của `fgos doctor` báo theo provider/account: home bị giữ hẳn (fail, nêu thư mục home), home đang thử lại và các bản `pending/`/scratch quá một ngày (cảnh báo); chỉ có số đếm và tuổi, không bao giờ in giá trị, và check không xoá gì. Provisioning Codex đóng kín (fail closed): `auth.json` là symlink trỏ ra ngoài home, hoặc `home` tương đối, làm dispatch thất bại trước khi worker chạy (trước đây symlink được theo, home tương đối được hiểu theo cwd). Đường xoá home gọi module gia hạn credential (`provider-credential-renewal.mjs`) và qua đó phụ thuộc vào provider capacity, chỉ để lấy account lock. Home không có field này được xoá y như trước.
+
+### 13.3 Pane Codex chạy `--no-daemon`: sandbox riêng của Codex phải tắt suốt phiên
+
+**Quyết định (2026-10-13):** invocation `codex-herdr-fgovn` truyền thêm `--no-daemon` cạnh `-s danger-full-access -a never`. bwrap là confinement; sandbox riêng của Codex phải tắt trong suốt phiên, không chỉ ở lượt đầu.
+
+**Vì sao:** mặc định TUI của Codex (từ 0.160) không tự chạy phiên mà giao cho một app-server daemon dùng chung (`codex app-server --listen unix:// --managed-daemon`), cài vào `<CODEX_HOME>/packages/app-server-daemon/releases/<version>/` lúc khởi động, kèm một daemon-updater tự thay bản mới hơn. Cờ `-s` của TUI chỉ áp cho thread nó mở; một thread mà daemon mở lại sau khi bị thay thì chạy theo mặc định của config, mà với workspace đã được gieo trust thì đó là sandbox `workspace-write` của chính Codex. Sandbox đó dựng bwrap riêng, coi cwd là writable root và mkdir các mount che (`.codex`, `.aws`, ...) bên trong cwd; dưới `--ro-bind / /` của fgOS lệnh mkdir thất bại nên mọi lệnh hỏng trước khi chạy: `bwrap: Can't mkdir <cwd>/.aws: Read-only file system`. Với `--no-daemon` phiên chạy trong chính tiến trình TUI, mang `-s danger-full-access` đến hết, không có daemon/updater nào chạy ra từ private home.
+
+**Bằng chứng:** sự cố thật ở run `unit-run-1791874482416-acccbfe0/panelist-2/1` (pane chạy codex 0.160.1, lệnh đầu chạy được, sau một lần turn bị ngắt thì daemon 0.162.1 xuất hiện trong private home và mọi lệnh hỏng với lỗi trên). Tái hiện cơ chế: dưới đúng mount fgOS dựng (`--ro-bind / /`, `--tmpfs /tmp`, private home và outbox writable), `codex sandbox -c sandbox_mode="workspace-write" -- <ghi outbox>` với cwd là checkout chính báo đúng `bwrap: Can't mkdir /home/vantt/projects/forgentX/.aws: Read-only file system` (worktree không có `.codex` thì báo `.codex`), còn `danger-full-access` ghi được outbox; `read-only` hỏng vì cách khác (`execvp codex-linux-sandbox`). Dispatch pane thật có `--no-daemon`: private home không có `app-server-daemon/` hay `packages/`, run settle, outbox có `report-1.md` và `result-1.json`.
+
+**Chưa chứng minh:** sự kiện nào khiến thread trong sự cố chạy lại dưới `workspace-write` (giả thuyết mạnh nhất: daemon-updater thay 0.160.1 bằng 0.162.1 giữa run, chính việc thay thế làm ngắt turn, và thread được mở lại không mang `-s`). Tắt daemon loại bỏ cả nhánh này; ghi `sandbox_mode = "danger-full-access"` vào `config.toml` của private home là lớp phòng thủ thứ hai chưa làm (file đó do bước gieo trust ghi, và driver bwrap không được rẽ nhánh theo provider). Đường `codex exec` (`codex-cli-bwrap`) không dùng daemon nên không đổi.
+
 ### Tồn đọng mở (Open Deferred Items):
 
 - **P04 M-3 (Inherited unconfined anchor overclaim):** Khi kế thừa anchor từ capability cha, một capability không khai báo confinement nhận attestation `unconfined` (explicit opt-out) thay vì `unknown`/`omitted`. Cần phân biệt rõ cờ thừa kế trong phase tiếp theo.
diff --git a/docs/specs/distribution.md b/docs/specs/distribution.md
index aa00b827b..13d2e172d 100644
--- a/docs/specs/distribution.md
+++ b/docs/specs/distribution.md
@@ -64,12 +64,12 @@ of it).
 | 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
 | 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
 | 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
-| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule below). | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
+| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
 | 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
 | 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |
 | 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
-| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
-| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
+| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
+| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, under the account lock, and removes one only when its login is shown applied or obsolete; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
 | 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |
 
 ## Behaviors & Operations
@@ -294,7 +294,7 @@ of it).
   - Not customizable here: executor, model and provider policy (`config.json`) and the platform laws. An extension is treated as a domain until an extension loader exists.
   - No component-boundary change: it extends the three-tier discovery convention coordination protocols already use (project, `domains/<name>/`, packaged `core/`) to agent definitions.
 
-- **RUL14 (the lazy-probe unlock rule: an account locked for a dead login unlocks itself after one real call that succeeds).** An account quarantined as `auth-token` has no end time: the owner logs in again by hand and fgOS cannot see it. Instead of waiting for a person to run the clear command, a dispatch that finds **no usable account of the provider** makes one real, cheap call per such account (Codex: `codex exec`; a pi account directory: `pi -p`), against the account's own home, not a copy, because a login that rotates its refresh token on renewal would use the token up in a throwaway copy. A call that answers clears the lock (audited as `fgos provider-capacity probe`) and the dispatch goes on; one that does not keeps the lock and records the attempt, and no new call is made for that account within a 30 minute cooldown, however many dispatches ask. Only `auth-token` locks are probed: a quota limit ends by itself and any other manual lock is a person's decision. The call is never made while another account of the provider is usable, runs outside the state lock, stops at the first account that answers, and a failure to probe never blocks the dispatch. A credential layout fgOS cannot name (the agy homes of Gemini) has no call, so that account stays locked for a person. The probe is passed to the dispatch by its callers; a caller that passes none changes nothing.
+- **RUL14 (the lazy-probe unlock rule: moved).** The rule that unlocks an account locked for a dead login with one real call now lives with the provider-capacity rules in `docs/specs/runner.md` (RUL74 (lazy-probe unlock: an account locked for a dead login unlocks itself after one real call that succeeds)), together with the refresh-ahead and write-back rules for a rotating login (RUL75 (a rotating provider login is renewed once at the source, in a copy fgOS holds, and a login renewed inside a private home is written back)). This document keeps only where the state lives (row 5d).
 - **RUL15 (`fgctl init` needs no hand-downloaded tarball: it picks its release by a fixed precedence and downloads it checksum-verified; 2026-10-12).** The release `fgctl init` installs comes from the first of these that is set:
   1. `--from <path | URL>` on the command line;
   2. the `FGCTL_FROM=<path | URL>` environment variable (same meaning as the flag, for a non-release build: a `.tar.gz`, a release directory, or a URL);
@@ -313,6 +313,11 @@ of it).
   - **Workspace launchers.** `fgctl init` and `fgctl repair` write four launchers into `.fgos/installation/bin/`: the `sh` pair `fgos`, `fgos-runner` (Linux, macOS, Git Bash) and the batch pair `fgos.cmd`, `fgos-runner.cmd` (PowerShell, `cmd.exe`; no `sh` involved). Each reads `activation.json`, refuses with exit 3 unless `status` is `ready`, and runs the active release's entry. A directory on `PATH` holding them makes `fgos` resolve in PowerShell through `PATHEXT`. The post-activation tail (`init`, `doctor --fix`, `doctor`) runs the `.cmd` form on a Windows host. `fgctl verify` checks that the launchers its host needs (the `sh` pair everywhere, the batch pair too on Windows) exist and equal what this `fgctl` writes; a missing or edited one is reported with `run fgctl repair` and never quarantines the (intact) release.
   - **Proof.** Pushing a release tag builds both targets and runs a consumer proof on each, and only when both pass does the publish job run; publishing exists only in `release.yml`. The Windows proof (`scripts/ci-external-consumer.ps1`, under Windows PowerShell 5.1 and PowerShell 7) installs `fgctl` with `install.ps1`, runs `fgctl init` against a local release server, runs the activated `fgos` from PowerShell and from `cmd.exe`, and checks that a tampered download is refused by both the installer and `fgctl init`.
   - **Not covered.** Windows ARM64 and macOS have no asset. The machine release store stays at `%USERPROFILE%\.local\state\fgos` (`FGOS_STATE_HOME` moves it); relocating it to `%LOCALAPPDATA%` is a separate decision.
+- **RUL17 (one `fgos` on PATH runs each project's own activated fgos; `doctor --fix` provides it; 2026-10-13).** A release install puts only `fgctl` on PATH and `fgctl init` activates a release per project, so a plain `fgos` used to need an absolute path. `fgos doctor` check `project-fgos-launcher` and its registered fix own the answer, and `fgctl init` already ends by running `doctor --fix`:
+  - The fix writes one small launcher named `fgos` (`fgos.cmd` on Windows) into the directory `fgctl` was found in on `PATH`. The launcher walks up from the working directory to the nearest `.fgos/installation/bin/fgos` and runs it with the same arguments, so each project runs the release it activated, from any subdirectory, in any shell, interactive or not; it edits no rc file. Outside a project it exits 127 and says to run `fgctl init`.
+  - The launcher carries a marker line. The check reports `ready`, an out-of-date copy (rewritten by the fix), a foreign `fgos` found first on `PATH` (never overwritten; the check names it), no `fgos` with `fgctl` on `PATH` (the fix writes it), or neither on `PATH` (the check says to add the directory `fgctl` was installed into).
+  - A source checkout keeps the sourced shell-integration script and needs no launcher; the check passes there.
+  - Proof: `test/setup/project-launcher.test.mjs` (two projects and a nested one each run their own fgos; the `cmd` launcher runs on Windows in the focused Windows job).
 
 ## Lịch sử quyết định
 
diff --git a/docs/specs/runner.md b/docs/specs/runner.md
index f970fd6c5..f101cf85f 100644
--- a/docs/specs/runner.md
+++ b/docs/specs/runner.md
@@ -73,7 +73,7 @@ Vòng lặp tự hành của forgent: tự lấy việc sẵn-sàng từ work-st
 | # | Element | Meaning | Values | Required | Default |
 |---|-------|---------|--------|----------|---------|
 | 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian một worker · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay |
-| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`. Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
+| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
 | 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
 | 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
 | 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
@@ -1049,7 +1049,7 @@ Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc)
 
   Fallback (Provider Capacity, tầng 1) từng chọn invocation MẶC ĐỊNH của candidate fallback một cách mù — khi 1 executor mang nhiều invocation khác `confinement` (executor-id-consolidation), phép chọn mù đó có thể lặng lẽ hạ cấp 1 primary có confinement xuống 1 fallback KHÔNG confinement. `selectConfinedInvocationId` (`resolve.mjs`) đóng gap này: kiểm CẤU TRÚC thuần ("candidate có invocation nào khai confinement không"), không bao giờ kiểm ngữ nghĩa policy (việc đó vẫn thuộc Confinement Authority, `confinement/authority.mjs`, không đụng tới) — primary có confinement mà fallback không tìm được invocation nào có confinement thì bị refuse thẳng, không âm thầm dispatch hở. Phạm vi CHỈ áp cho đường fallback provider-capacity; đường redirect read-only (RUL trên/Phase D) là cơ chế khác, không đụng tới ở đây. `opPolicy.fallbackExecutors` giữ nguyên `string[]` — không mở rộng thành `{executor, invocation}` (việc đó phải chạm 8+ file ở tầng khai báo Workflow/Operation, không cần thiết khi bản check cấu trúc trên đã đóng đúng gap thật).
 
-  `execute --for <purpose>` (cửa CLI/con người duy nhất vào purpose door không lease/fallback) đã RÚT hẳn, xác nhận 0 live caller thật (chỉ có 1 proof sweep lịch sử của Confinement Authority, không phải traffic sản xuất) — `execute --for` giờ refuse thẳng, chỉ tên đúng pattern 2 phase mà mọi caller thật đã dùng: `decide --for <purpose>` giải purpose ra executor id thật trước, rồi `execute <id đó>` mới dispatch theo vị trí. `decide --for` và tham số `for` riêng của `executeExecutorCli` (dùng bởi `spawnWorker` và caller lập trình khác, không phải flag CLI) không đổi.
+  `execute --for <purpose>` (cửa CLI/con người duy nhất vào purpose door không lease/fallback) đã RÚT hẳn, xác nhận 0 live caller thật (chỉ có 1 proof sweep lịch sử của Confinement Authority, không phải traffic sản xuất) — `execute --for` (không kèm executor) giờ refuse thẳng — RUL76 (`execute <id> --for <capability>`: caller nêu posture) mở lại riêng dạng `execute <id> --for <capability>` để mang posture sang phase 2 — chỉ tên đúng pattern 2 phase mà mọi caller thật đã dùng: `decide --for <purpose>` giải purpose ra executor id thật trước, rồi `execute <id đó>` mới dispatch theo vị trí. `decide --for` và tham số `for` riêng của `executeExecutorCli` (dùng bởi `spawnWorker` và caller lập trình khác, không phải flag CLI) không đổi.
 
   Việc GỘP THẬT `spawnWorker` vào lease/fallback của `executeAssignment` (tức xoá hẳn tầng purpose door) KHÔNG làm ở đây — quyết định có chủ đích, không phải nợ kỹ thuật: purpose door là 1 primitive dispatch CỐ Ý không phụ thuộc Work item tồn tại. Work item, tới nay, chủ yếu là khái niệm QUẢN LÝ LIFECYCLE (hiện trên board), xếp lớp TRÊN dispatch, không phải điều kiện tiên quyết để dispatch được. Khi nào việc gắn Work-item lifecycle vào dispatch thật sự được xây, đó mới là điểm đúng để gộp `spawnWorker` vào `executeAssignment` — không phải trước đó.
 
@@ -1080,6 +1080,23 @@ Một báo-cáo hỏng-hình (không phân tích được, thiếu tên việc)
   3. Work mang `workflowStep` (id bước trong Workflow của domain); `src/state/workflow-stage-graphs.mjs`, `src/state/stage-fsm.mjs` đã xoá — `domain-registry.mjs` (phần vòng đời Work của domain + tra Workflow) và `step-fsm.mjs` (cạnh chuyển bước = `transitions` của Workflow) thay thế. Chi tiết dữ liệu cũ: spec Work-State, "Work không còn `stage`".
   4. Cổng mutating của một unit-run: Assignment mutating phải mang `binding` do `bind()` sinh ra, khớp bản `bind()` tính lại từ `unit.json`, và không được ghim executor khác (`policy.preferExecutor`) — thiếu/khác → từ chối trước khi spawn.
 
+- **RUL74 (lazy-probe unlock: an account locked for a dead login unlocks itself after one real call that succeeds).** An account quarantined as `auth-token` has no end time: the owner logs in again by hand and fgOS cannot see it. Instead of waiting for a person to run the clear command, a dispatch that finds **no usable account of the provider** makes one real, cheap call per such account (Codex: `codex exec`; an omp profile, a `home-files` source that lists `agent.db`: `omp -p`; a pi account directory, one that lists `auth.json`: `pi -p`; omp is tested before pi), against the account's own home, not a copy, because the owner uses that home and a renewal belongs there. A call that answers clears the lock (audited as `fgos provider-capacity probe`) and the dispatch goes on; one that does not keeps the lock and records the attempt, and no new call is made for that account within a 30 minute cooldown, however many dispatches ask. Only `auth-token` locks are probed: a quota limit ends by itself and any other manual lock is a person's decision. The call is never made while another account of the provider is usable, runs outside the state lock but inside the account lock of RUL75 (so a renewal made by fgOS cannot overlap it; an account whose lock stays busy past two minutes counts as a failed attempt), stops at the first account that answers, and a failure to probe never blocks the dispatch. A credential layout fgOS cannot name (the agy homes of Gemini) has no call, so that account stays locked for a person. The probe is passed to the dispatch by its callers; a caller that passes none changes nothing.
+
+- **RUL75 (a rotating provider login is renewed once at the source, in a copy fgOS holds, and a login renewed inside a private home is written back).** Dispatch copies an account's login into a private home that is thrown away. pi, omp and Codex logins carry a single-use refresh token (measured for each), so a renewal that happens inside such a copy uses up the source's token on the provider's side and the new pair is lost with the home; the next renewal anywhere is refused (`invalid_grant`, the account is quarantined `auth-token`). Opt-in (the same shape as the lazy probe): a caller passes `providerCredentialRenew` (`createCredentialRenewal()`, `src/runner/dispatch/provider-credential-renewal.mjs`) to `executeAssignment`, and only then do the two halves below run; without it provisioning and removal are as before. `agent.db` is copied as a consistent SQLite snapshot (`VACUUM INTO`, write-ahead log included) whether or not a dispatch opted in, and the unlock probe knows the omp layout regardless.
+
+- **RUL76 (`execute <executorId> --for <capability>`: the caller states the posture; [ĐÃ BỊ THAY bởi RUL77 (posture thuộc capability; agent executor không khai `for`) — chốt "executor phải khai capability" đã bỏ]; partly reverses the `execute --for` retirement of RUL68 (2 tầng dispatch; `execute --for` đã rút), 2026-10-13).** `execute <id>` with no purpose infers the capability from the executor's own `for` list, a required-confinement capability first (`resolveCapabilityDetailsFromHints`). RUL70 (executor id theo `providerModel`; gộp `pi`+`codex` thành `openai`) merged `codex` (`for: [code:review, code:debug]`, both `host-write-denied`) and `pi` (no `for`, the writing invocations) into `openai`, so every `execute openai` became write-denied, whatever the work: a documentation task died with `Read-only file system` when Codex tried to refresh its login under bwrap. That rule itself says executors whose `for` differ should not be merged into one entry; the merge kept the codex `for` without noticing pi had none. Instead of splitting the executor, the two-phase `decide`-then-`execute` pattern now carries the purpose to phase two: `execute <id> --for <capability>` runs under that capability's posture. It is accepted only when the executor declares the capability in `for` or the capability's `prefer` names the executor (otherwise `capability-not-served`, before spawning), so config still says which postures an executor accepts; without `--for` the strictest-first inference stays the fail-closed default. `execute --for` with no executor, or combined with `--assignment`/`--contract`, is still refused. `openai.for` gains `execute`, so writing work goes `execute openai --for execute`, which takes the first `cli` invocation (`codex-cli-bypass-fgovn`, unconfined). `--timeout-ms`/`--idle-timeout-ms` override `runner.timeoutMs`/`runner.idleTimeoutMs` per call. Config for a dispatch whose `--cwd` is a worktree with its own `.fgos/config.json` is read from that worktree (5a42bc376, intended), so a branch behind main also resolves older model tiers.
+
+- **RUL77 (posture belongs to the capability, an agent executor declares no `for`, and each door carries one posture lane; supersedes RUL76 (`execute <id> --for <capability>` with a "must declare" gate), 2026-10-13).** An agent executor can do any kind of work, so no `for` list describes it, and a list on one was read as the posture of every dispatch to it (`docs/specs/confinement-authority.md` already said a direct executor call must carry a capability anchor and never infer the minimum from `executor.for`). `resolveCapabilityDetailsFromHints` reads `for` from tool executors only; on an agent executor it is inert (config still loads, so projects and worktrees that carry one keep dispatching) and `fgos doctor` names it under `executor-profile-warnings` (`executor.<id>.agent-for-inert`); the agent executors' `for` lists are gone from this repo's `.fgos/config.json` (`decide --for` routing unchanged: it reads `capabilities.<name>.prefer`). The CLI door `execute <agent>` refuses before spawning when no `--for` is given (`capability-required`, listing the writing capabilities and the read-only door); programmatic callers (Assignment, Work) pass their own capability hints and are unchanged. `execute <agent> --for <capability>` runs the invocation that capability `prefer`s for that executor, else the first plain cli invocation with no sandbox backend, instead of always the first cli invocation. That door leases no provider account, so it carries writing work only: a capability with required confinement is refused (`posture-needs-assignment`). Read-only work runs sandboxed as a Workflow unit with `writes: []` (`fgos workflow start --units`), which binds the read-only posture and leases the account (the architecture-advisory seats ran that way: `confined-bwrap`, login provisioned); `execute --contract <file> --executor <id>` keeps a named provider and leases its account but runs unconfined, read-only by instruction only (measured: `execute openai --for code:review` on the bare door ran `codex-cli-bwrap` confined and got 401 with no login; the same read through `--contract --executor openai` answered, on `cli-spawn` with `confinement: null`). A sandboxed read-only door that also keeps a named provider does not exist yet. The calling agent answers Q1 (does it write? does a provider matter?) from prose doctrine in `core/skills/_shared/capability-matching.md`, with no classifier or workflow generator. Decided after an `architecture-advisory` run (`wf-run-1791875339761-10315b91`: framing and shaping with three blind seats and a synthesizer completed; critique was blocked by a Codex trust prompt, so no reviewed synthesis exists). Not built: a soft provider hint on `decide` (`--prefer`, the synthesizer's recommendation) — naming the executor on `execute` already lets a caller pick a provider, and the hint would change `bind()`, shared with Workflow binding; revisit when a caller needs "this provider if it can, else any".
+  1. **Account lock.** One lock per provider account under `<runtime dir>/account-locks/<provider>/<account>/`, separate from the state lock, in the same append-only generation format. A waiter waits with timers, never by blocking the event loop (panel seats share a process and may share an account); a caller that must not wait (a removal) tries once. The holder records the pid of the renewal child it started: a dead holder with a live child keeps the lock, so a second renewal never redeems the same refresh token.
+  2. **Refresh-ahead.** After the final account selection (the executor-fallback lease included) and before a confined private home is built from it, when the login has less than the window left, fgOS renews it once. The window is `max(60 minutes, probe timeout + 5 minutes)`. Only the entry of the dispatched provider counts, for the window and for "was it renewed" (Codex: its single entry; pi: the key equal to the provider id or starting with `<provider>-`; omp: the row `provider` likewise; a lone oauth entry of another provider is not used; zero or several matches skip the renewal as `entry-unidentified`), so an abandoned login of another provider never makes every dispatch renew, and only that entry is made due and applied. Under the account lock it applies any leftover copy first, re-reads the source, and skips for 30 minutes after a failed renewal; then it builds a scratch home under the account directory (mode 0700, the listed files only), makes only that copy look due, runs the layout's probe call on it (wrapped in coreutils `timeout --kill-after=5`, so the child ends on its own even if the runner dies and the account lock does not outlive it unbounded; the runner's own timer stays; the lazy-probe unlock call, an account locked for a dead login, is wrapped the same way), and applies the renewed entry to the real store. The real store is never made to look expired, so the owner's own CLI does not renew because of this, a failed or hung call leaves it untouched, and a scratch copy left by a dead runner is applied (if newer) by the next lock holder and then removed. Where each layout keeps its expiry: pi `auth.json` `<provider>.expires` (ms; seconds below 1e12), `type: oauth` entries only; omp `agent.db` table `auth_credentials`, `data.expires` (ms), rows `credential_type = 'oauth'` and no `disabled_cause`; Codex `auth.json`, due at the earlier of the access token's `exp` claim and `last_refresh` plus 8 days (`TOKEN_REFRESH_INTERVAL`, `should_refresh_proactively` in `codex-rs/login/src/auth/manager.rs` of openai/codex; the same file renews at five minutes before `exp` when the token can be read). A layout that cannot be read (an API key, agy, no `node:sqlite`) is left as it was.
+  3. **Apply (compare-before-write).** Shared by refresh-ahead and write-back, always under the account lock: only an entry whose expiry is strictly later than the source's and whose refresh token differs from the source's replaces it (compared in memory, never printed; a copy that still holds the source's refresh token renewed nothing), and for a fresh renewal the new expiry must also be in the future, while a copy staged earlier (a pane's home, a pending or leftover copy) is applied even if its access token has expired since, because its refresh token is the newer one and the source's is already spent, only that entry changes (other pi providers, other omp rows and columns, other Codex fields stay as they were), a copy that cannot be read, has an unexpected shape, or has no refresh token where the source's entry has one never touches the source. A copy is deleted only when the source was read successfully and proves the copy is not newer (same refresh token, or an expiry not strictly later), or when the copy is proven malformed (corrupt JSON, or it parses to no usable entry, or it has no store file); when the source is unreadable or half-written, the entry cannot be identified at apply time, or the copy cannot be read for a reason that may pass (`node:sqlite` unavailable, a database that will not open), the copy is kept (a fresh scratch copy moves to `pending/`) and the result is `apply-deferred`, never `applied` or `not-renewed`. An operating-system read error on a copy file (permissions, I/O) is reported as `unreadable-file` and keeps the copy (`apply-deferred`); only a store file that is not there (`missing-file`) is proven empty. pi and Codex files are replaced through a temp file and a rename, recomputed when the source changed in between; the omp store is changed by a row update in one transaction, never by replacing the file the owner's omp may hold open.
+  4. **Write-back at removal.** When a dispatch opted in, the private home's ownership marker records `credentialWriteBack` (provider, account, source home, layout, runtime dir; names and paths only). One removal function serves the driver cleanup, the finalizer of a settled dispatch and the orphan reaper: before deleting a home whose marker asks for it, a login in the home that is newer than the source's is staged under `pending/` (atomic rename) and applied under the account lock, tried once without waiting; when the lock is busy, or nothing proves the copy is not newer (the source is unreadable, its entry cannot be identified, or the copy cannot be read for a reason that may pass, such as `node:sqlite` being unavailable: an omp store is then staged as plain files, write-ahead log included), it stays pending and the next refresh-ahead (or removal) applies it once it can be identified, even if the source still looks fresh, because the source's own refresh token may already be spent; a refresh-ahead that skips because the entry is unidentified applies the pending copies too, so the ones that have become identifiable clear. Pending copies are capped at five per account, the newest by staging time; a drop writes one stderr line `credential-pending-dropped` with a count only. If staging itself fails, the private home and its marker are kept (the removal reports failure, one stderr line with a fixed code and no path or value) so a later removal, the reaper's included, retries; only a copy proven malformed, or one the source was read to prove not newer, lets the home go. Each failed attempt is counted in the marker (`credentialKept`: attempts, first time, time of the last counted attempt; failures less than 15 minutes after the last counted one are not counted again, so a transient fault does not use the budget up); the marker is rewritten through a temp file and a rename, and a marker that is present but unreadable stops the removal. After five attempts the home is held: no further removal attempt and no deletion by age, however old. A held home is re-checked, under the account lock, when that account is next renewed (the temp roots searched are the same as doctor's: the default one plus each registered backend's own `tempRoot`; a home under a backend's separate `privateHomeRoot` is in none of them, so no check, repair, reaper or renewal sees it, and it is never deleted either) and by `fgos doctor --fix`, and only a home of the lock's own runtime directory: it is removed only when the source is readable and proves its login is not newer, or when that login can now be staged beside the source (and is applied); otherwise it stays held. It also stays held when the pending copies are already full and its login would only be staged, so the cap never pushes out an older copy; a staged copy and the pending directory are synced to disk before the home goes. A marker file that is no recognisable marker at all (not JSON, not an object, no contract name) stops any removal of its home. The finalizer compares the ownership marker's digest without `credentialKept` (a failed driver cleanup adds it after the digest was taken) and carries on with the dispatch's other resources past a home that cannot go (the dispatch is recorded as retained, with the home's reason). The doctor check `credential-copies-retained` reports, by provider and account, held homes (a failure, naming the home directory), homes still being retried and pending or scratch copies older than a day (warnings), with counts, ages and never a value; the check deletes nothing. Any other write-back problem is reported on stderr by a fixed code and never stops the removal.
+  5. **Known exposure.** Refresh-ahead can spend the refresh token that a pane started just outside the window still holds: that pane's own renewal is then refused, no worse than before this rule, and write-back cannot rescue it because its renewal failed. A run that copied the login with more than the window left and runs longer than that remainder is the case.
+  6. **No value in any output.** Results, events, markers, cooldown and lock records, stderr and reports carry fixed codes (`unreadable-json`, `unexpected-shape`, `sqlite-unavailable`, ...) and fingerprints at most, never a token or a parser message (which quotes nearby input).
+- **RUL78 (a confined pane reads its folder trust from the leased account's own store, 2026-10-13).** A herdr pane with a private home carries the login of the account the capacity layer leased (RUL65b), but the folder-trust seed (`seedWorkspaceTrust`, `trustStorePaths` in `src/runner/dispatch/herdr-round.mjs`) derived the trust decision from the store of the account the invocation's static env names (`codex-herdr-fgovn`: `CODEX_HOME=${HOME}/.codex-fgovn`). When the two accounts differ and the static one was never asked about the repo, the seed refused (`untrusted-root`) and Codex stopped at "Trust this folder?" (measured 2026-10-13 14:24, run `unit-run-1791876207053-efe6686b/reviewer/1/runs/01`: the leased `tetcu72` trusts `/home/vantt/projects/forgentX`, `~/.codex-fgovn/config.toml` did not; reproduced read-only with a scratch static home: the main-branch code blocked on herdr rule `trust_directory`, the fixed code settled confined). Now the leased credential source travels with the dispatch (`executeThroughConfinement` adapter option `trustAccountSource` -> herdr-spawn adapter -> the round), and for a round with its own private home the decision is read from that account's store: a `codex-home` source's `config.toml`, a `home-files` source's agy settings. A declared `trustStore.path` still wins; a round without a private home still reads the invocation's home, because that is what its CLI reads. Codex hook trust, seeded from the same root, follows. The "trust vanishing" of 2026-10-07 (another Codex session rewriting an account `config.toml`) is a separate cause this does not remove: it still bites when the leased account's own entry is lost. Not proven: whether Codex 0.160 honours trust given to an ancestor directory (`/home/vantt/projects`); the seed still requires the repo root itself.
+- **RUL79 (`fgos dispatch probe-account`: one account, every CLI, at the same moment, diagnostic only, 2026-10-13).** A dispatch failure on one CLI does not say whether the account (dead login, quota) or the CLI (trust prompt, sandbox, version bug) is at fault. `fgos dispatch probe-account --provider <p> --account <a> [--executor <id>] [--invocation <id,...>] [--timeout-ms <ms>]` (`src/runner/dispatch/provider-account-probe.mjs`) starts every invocation that runs as the account at once through the Assignment door a Workflow unit uses (read-only posture binding, invocation pinned by `cliOverride`, inventory narrowed to the one account so the lease cannot pick another and a quarantine still refuses, RUL75 (a rotating login is renewed once at the source and written back from a private home) renewal opt-in), with a trivial prompt, and reports per CLI an outcome class (`ok`, `blocked-trust-prompt`, `auth`, `quota`, `sandbox`, `timeout`, `other`), the evidence line, the assignment, run directory and pane, plus a verdict (`healthy`; `account-fault` when every CLI failed with `auth`/`quota`; `cli-fault` when one answered; `mixed`). An invocation runs as the account when it is confined with a private home whose CLI the account's credential layout logs in (`lease`), when its credential env names the account home (`env`), or when its id ends with `-<account>` (`name`, the config's `<bin>-<mode>-<account>` convention). It closes the panes the rounds left open and removes the private homes kept for them; it picks and schedules nothing. First real run (openai/tetcu72): both Codex invocations `ok` (cli-spawn under bwrap and the herdr pane), both pi invocations `sandbox` (`EROFS` on `~/.pi/accounts/openai-tetcu72/settings.json.lock`: under the read-only posture pi cannot write its own account directory, which it does before answering; outside confinement the same pi account answered), verdict `cli-fault`.
+- **RUL80 (an account is chosen first, then a CLI: one login store per CLI, quota and locks per account, 2026-10-13).** One provider account may be used through several CLIs (Codex, pi, omp), and each CLI keeps its own login store, so an account declared with a single `credentialSource` gave every confined CLI the one store (openai `tetcu72` declared its Codex home, so its confined pi invocations got a Codex login and pi failed on its own directory, RUL79 (`fgos dispatch probe-account`: one account, every CLI, at the same moment)). An account in the machine-global inventory now declares exactly one of `credentialSource` (one store, used for every CLI, unchanged; other projects use it) or `credentialSources` (`{ <cli>: <source> }`, the key is the basename of an invocation's `command`: `codex`, `pi`, `omp`, `agy`; each source has the same `kind`/`home`/`files` shape). Every reader takes the store of the CLI actually dispatched: the confinement request (`buildConfinementRequest`) resolves `providerCapacity.credentialSource` from the invocation's command, so private-home provisioning, the write-back marker and the folder-trust seed (RUL78 (a confined pane reads its folder trust from the leased account's own store)) see that store, and a CLI the leased account has no store for is refused before the worker starts (`credential-provisioning`). The lease does not know the invocation unless it is pinned (`cliOverride.preferInvocation`, as Workflow units and the account probe pin it): a pinned lease only picks an account that has a store for the pinned CLI (`provider-capacity.no-account-for-cli` when none has); an unpinned lease picks among all accounts as before. Refresh-ahead (RUL75 (a rotating login is renewed once at the source and written back from a private home)) runs before the invocation is settled, so for a per-CLI account it renews the store of each CLI the executor may still launch (the pinned one only, when pinned); the lazy unlock probe (RUL74 (an account locked for a dead login unlocks itself after one real call)) calls through the store of the first such CLI. Renewal copies of a per-CLI store wait under `account-locks/<provider>/<account>/stores/<cli>/` (`pending/`, scratch homes, cooldown), never beside another store's copies, and the marker records the store; the account lock stays one per account, and `credential-copies-retained` reads both places. Quota, leases, quarantine and rotation stay per account: no account is split into pseudo-accounts per CLI. The account probe (RUL79 (`fgos dispatch probe-account`: one account, every CLI, at the same moment)) leases an account into each confined CLI it has a store for. `confined-pane-accounts` in `fgos doctor` checks each pane against the store of its own CLI. An fgos release from before this rule refuses an inventory that uses `credentialSources` (unknown account key), so the inventory is changed only after the release that reads it is active. Not built: per-CLI stores for an unconfined invocation, which keeps naming its store through its own env.
+
 ## Edge Cases Settled
 
 - Worker `cli-spawn` chạy trong sandbox (bwrap) chỉ ghi được dưới `runs/<n>/worker-output/outbox`: effective contract và prompt gọi tên claim/report ở đó (không phải thư mục run phẳng, vốn read-only → `EROFS`); collector, reconcile run chết và lần chọn thao tác sau đều tìm claim/report qua cùng một lookup (`worker-output/outbox`, rồi `worker-output`, rồi `outbox`, rồi tên phẳng). herdr-spawn giữ outbox riêng của brief.

````

## Current source decisions — complete shown text

### claim_ebe7d2366429303cb74938b60f5cf2fb

Source unit digest: ba8ccc03e5d12eaaf004b55882c332fe6ba0c2d0987ed1103738672a5bf52e39
Target unit digest: 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b
Shown source SHA256: 5e9c332bd0938eb37d99b6ff23fff5ea59aad7c64f435afe388c5e184e1f15bd
Shown target SHA256: 63ad8aec0f738bf5e625896603e32885f68425e391d99d992d4a4c463375fa37

Decision:
```text
{
  "claimId": "claim_ebe7d2366429303cb74938b60f5cf2fb",
  "sourceUnitDigest": "ba8ccc03e5d12eaaf004b55882c332fe6ba0c2d0987ed1103738672a5bf52e39",
  "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "targetAnchor": "routing-identities",
  "claimKind": "architecture",
  "disposition": "supersede",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:5@2026-10-13",
  "rationale": "The committed reviewer rejected this specific binding: LEG:architecture/dispatch-control-plane.md#routing-identities -> architecture/dispatch-control-plane.md#routing-identities (supersede): Routing Identities target keeps the for[] binding path (lines 81-83) that contradicts resolve.mjs:255-266 where an executor for never binds a purpose; only prefer binds. The corrected current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities now states the code-checked boundary in Routing Identities; evidence: src/runner/dispatch/resolve.mjs:25-66; src/runner/dispatch/resolve.mjs:255-309. The disposition supersede and carriage carrier stay unchanged. This is a pending current-text rebinding, not a new file move, retirement or inherited approval. The source claim ID/digest and its accepted complete historical carriage are retained; the full shown target digest is renewed and requires independent targeted review. A31 boundary merge: current target imports main capability tool-executor restriction; the shown full source and target bind this conservation review only.",
  "reviewNote": "legacy:architecture/dispatch-control-plane.md#routing-identities -> architecture/dispatch-control-plane.md#routing-identities (supersede): supersede heading; target Routing Identities text true against resolve.mjs:269-310 and prefer-only binding; for[] defect fixed",
  "beforeTargetedFix": {
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "routing-identities",
    "disposition": "supersede",
    "shownTargetDigest": null,
    "reviewCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "shownTargetDigest": "c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720",
  "truthFixEvidence": "plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json",
  "targetUnitDigest": "7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b",
  "targetAncestry": [
    "Dispatch Control Plane"
  ]
}
```

Full source section:
````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorIdForPurpose`,
`resolveExecutorAndOverrides(cfg, executorIdOrPurpose)`) all name a capability
value, resolved against the same `runner.capabilities` catalog an explicit
capability selector would use. `compileDispatchPlan()`'s
`selector.type: 'purpose'` denotes a capability-shaped request, not a separate
ontology; nothing downstream branches on `purpose` as a concept distinct from
capability. Renaming these call sites internally is compatibility work
(tracked as Slice D/E in the normalization plan above), not a semantic
change — `--for`, `--work`, and `--assignment` stay supported at the CLI/API
adapter layer.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

Full current target:
````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

### claim_ab182560a5142f22e010e35a97b115dc

Source unit digest: 212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec
Target unit digest: 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b
Shown source SHA256: 212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec
Shown target SHA256: 63ad8aec0f738bf5e625896603e32885f68425e391d99d992d4a4c463375fa37

Decision:
```text
{
  "claimId": "claim_ab182560a5142f22e010e35a97b115dc",
  "sourceUnitDigest": "212ffb52fe719fef01a51f585286aedd6792e48d063ada3a2663933e7c2593ec",
  "claimKind": "architecture",
  "disposition": "supersede",
  "rationale": "The same owned unit is rebound to the corrected text authorized by A20/A22 in f4bc8027ff2ef34b7c7c1b084330b62fdcbc353f. The old target wording is superseded in place, with the legacy source and accepted historical carriage unchanged. Independent review must check the current shown text against the section truth ledger; no prior text approval is carried. Previous rationale (historical): The current successor at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#routing-identities supersedes the stale current-state claim shown at docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-11 before 96a13ab21670e1f5d9748c02cd615ea5598b53f5. The original frozen source remains conserved by the accepted carriage and its dated complete historical carrier; this is a truth correction, not a new move or retirement. The section-specific code/CLI evidence is recorded in plans/260925-documentation-authority-unification/reports/phase-06/truth-ledger-agent-coordination.json. This successor is pending independent truth review, with no inherited approval. A31 boundary merge: current target imports main capability tool-executor restriction; the shown full source and target bind this conservation review only.",
  "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "targetAnchor": "routing-identities",
  "authoredBy": "codex-session:5@2026-10-13",
  "reviewStatus": "pending",
  "reviewNote": "legacy:architecture/dispatch-control-plane.md#unheaded-block-9 -> architecture/dispatch-control-plane.md#routing-identities (supersede): supersede old purpose paragraph; target drops nonexistent resolveExecutorIdForPurpose (git grep none) and keeps plan.mjs:91 selector label; true",
  "targetUnitDigest": "7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b",
  "targetAncestry": [
    "Dispatch Control Plane"
  ]
}
```

Full source section:
```text
`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorIdForPurpose`,
`resolveExecutorAndOverrides(cfg, executorIdOrPurpose)`) all name a capability
value, resolved against the same `runner.capabilities` catalog an explicit
capability selector would use. `compileDispatchPlan()`'s
`selector.type: 'purpose'` denotes a capability-shaped request, not a separate
ontology; nothing downstream branches on `purpose` as a concept distinct from
capability. Renaming these call sites internally is compatibility work
(tracked as Slice D/E in the normalization plan above), not a semantic
change — `--for`, `--work`, and `--assignment` stay supported at the CLI/API
adapter layer.
```

Full current target:
````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

### claim_a5297db7dd5392e3acf511564f7cb642

Native source successor of claim_f5567f4d0486c29fd719218e8a37d4ad. No inherited approval.
Source unit digest: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c
Target unit digest: 7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b
Shown source SHA256: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c
Shown target SHA256: 63ad8aec0f738bf5e625896603e32885f68425e391d99d992d4a4c463375fa37

```text
{
  "claimId": "claim_a5297db7dd5392e3acf511564f7cb642",
  "sourceUnitDigest": "1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c",
  "claimKind": "architecture",
  "disposition": "supersede",
  "rationale": "A31 current source unit added by the upstream tool-executor restriction; the current target Routing Identities section carries the complete changed code fence. Main diff is the source/successor evidence; no truth re-review.",
  "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
  "targetAnchor": "routing-identities",
  "authoredBy": "codex-session:5@2026-10-13",
  "reviewStatus": "pending",
  "reviewNote": "legacy:architecture/dispatch-control-plane.md#unheaded-block-8 -> architecture/dispatch-control-plane.md#routing-identities (supersede): supersede old identity block (prefer/overrides then for[]); target now states prefer-only per resolve.mjs:269-310 and names for[] as non-binding",
  "beforeTargetedFix": {
    "targetOwner": "docs/platform/agent-coordination/architecture/dispatch-control-plane.md",
    "targetAnchor": "routing-identities",
    "disposition": "supersede",
    "shownTargetDigest": null,
    "reviewCommit": "947f6169e826564b6e00bafb8a0535ec2ff6f0ea"
  },
  "shownTargetDigest": "c7634d6197f50b6174b05b60d0164fac0837a06cce0efe17c6cd71abdf38c720",
  "truthFixEvidence": "plans/260925-documentation-authority-unification/reports/phase-06/truth-fix-evidence-agent-coordination.json",
  "targetUnitDigest": "7829c9c2262ec408f1212c5408dbd496856b97f8a64fa7ab1953f18ac8f60a6b",
  "targetAncestry": [
    "Dispatch Control Plane"
  ]
}
```

Full source section:
````text
```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

Full target section:
````text
## Routing Identities

The dispatch core recognizes exactly two target identities. No other name
resolves a Run target.

```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```

`purpose` is not a third identity. It is compatibility terminology for
capability. The `--for <purpose>` CLI flag and the `purpose`/`for` parameter
names threaded through `src/runner/dispatch/plan.mjs` and
`src/runner/dispatch/resolve.mjs` (`resolveExecutorAndOverrides`) name capability
values. `resolveExecutorIdForPurpose` is not a current exported resolver.
`compileDispatchPlan()`'s `selector.type: 'purpose'` is the compatibility
selector label. It does not create a third conceptual route identity.
The [earlier normalization plan](../../../history/dispatch-core-contract-normalization/plan.md)
is dated migration context, not an assertion that its remaining helpers ship.

`job` is not a routing identity. ADR-004 reserves the term for a possible
future scheduler; where it appears (e.g. in logs), it names a caller's
execution-request label, never a target this control plane resolves against.
A `Run` (see the [Assignment/Run/RunResult Contract](../contracts/assignment-run-runresult.md))
is one concrete execution attempt for an Assignment — it is not a job or
operation identity either.

Work, workflow, stage, operation, taskSpec, skill, and protocol context are
component-outer. A caller in that layer may derive a capability or an
explicit executor-id from them before entering this control plane; none of
them becomes a third resolvable identity inside dispatch core. See
Component-Outer Boundary Note below.
````

## Native gaps — complete before/current text

These gaps preserve old identities whose non-stable units changed on main. Their proposed same-file successors follow the main diff line map; IDs are not grafted. Review conservation only. The old source code-fence gap is also part of the Routing Identities correction above.

### claim_f5567f4d0486c29fd719218e8a37d4ad

Old identity: docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8
Old unit digest: 58d62d1e2fb7ced0af3003179e67762eda8bb0b99d37ed17185eb92dafb80d52
Successor: docs/architect/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-8
Current unit digest: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c
Shown old SHA256: 58d62d1e2fb7ced0af3003179e67762eda8bb0b99d37ed17185eb92dafb80d52
Shown current SHA256: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c

Full old unit/section:
````text
```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[]
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

Full current successor unit/section:
````text
```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

### claim_83c033652dd933ee9b5fc5e519a2b6fb

Old identity: docs/architecture-manifest.json#file-block
Old unit digest: 6e362a74d975a16c477b8f474f062c5ec769515a149a15dfbba1de7f6e7650a3
Successor: docs/architecture-manifest.json#file-block
Current unit digest: c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85
Shown old SHA256: 6e362a74d975a16c477b8f474f062c5ec769515a149a15dfbba1de7f6e7650a3
Shown current SHA256: c1c230462d8e6a3a59005658d279246afcdcee727e89f03ff08b0f9ce8b14e85

Full old unit/section:
```text
{
  "contract": "architecture-manifest.v1",
  "map": "docs/architecture-map.md",
  "layers": [
    "entry",
    "use-case",
    "infra",
    "domain",
    "kernel"
  ],
  "rules": [
    "one-directional-layer",
    "domain-siloing"
  ],
  "components": [
    "packaging-distribution"
  ],
  "domains": [
    "coding",
    "marketing"
  ],
  "files": {
    "bin/fgos.mjs": "entry",
    "bin/fgos-runner.mjs": "entry",
    "src/runner/loop.mjs": "use-case",
    "src/runner/paths.mjs": "infra",
    "src/runner/dispatch.mjs": "infra",
    "src/runner/operation-capability.mjs": "domain",
    "src/runner/rigor.mjs": "kernel",
    "src/runner/dispatch-log.mjs": "infra",
    "src/runner/fanout-batch.mjs": "infra",
    "src/runner/work-compat.mjs": "infra",
    "src/runner/dispatch/adapters.mjs": "infra",
    "src/runner/dispatch/config.mjs": "infra",
    "src/runner/dispatch/confinement/policies.mjs": "infra",
    "src/runner/dispatch/confinement/bypass-pairing.mjs": "infra",
    "src/runner/dispatch/confinement/backend-registry.mjs": "infra",
    "src/runner/dispatch/confinement/authority.mjs": "infra",
    "src/runner/dispatch/confinement/request.mjs": "infra",
    "src/runner/dispatch/confinement/resources.mjs": "infra",
    "src/runner/dispatch/confinement/cleanup.mjs": "infra",
    "src/runner/dispatch/confinement/attestation-store.mjs": "infra",
    "src/runner/dispatch/confinement/drivers/bwrap.mjs": "infra",
    "src/runner/dispatch/confinement/probes/harness.mjs": "infra",
    "src/runner/dispatch/resolve.mjs": "infra",
    "src/runner/dispatch/mechanism.mjs": "infra",
    "src/runner/dispatch/plan.mjs": "infra",
    "src/runner/dispatch/transport.mjs": "infra",
    "src/runner/dispatch/prepare.mjs": "infra",
    "src/runner/dispatch/result-ladder.mjs": "infra",
    "src/runner/dispatch/assignment.mjs": "infra",
    "src/runner/dispatch/assignment-layout.mjs": "infra",
    "src/runner/dispatch/assignment-normalizer.mjs": "infra",
    "src/runner/dispatch/execution-contract.mjs": "infra",
    "src/runner/dispatch/effective-execution-contract.mjs": "infra",
    "src/runner/dispatch/agent-result-claim-contract.mjs": "infra",
    "src/runner/dispatch/evidence-attribution.mjs": "infra",
    "src/runner/dispatch/run-result.mjs": "infra",
    "src/runner/dispatch/usage-parsers.mjs": "infra",
    "src/runner/dispatch/runtime-inspection.mjs": "infra",
    "src/runner/dispatch/reconciliation-planner.mjs": "infra",
    "src/runner/dispatch/assignment-policy.mjs": "infra",
    "src/runner/dispatch/operation-prompt-templates.mjs": "infra",
    "src/runner/dispatch/provider-adapter.mjs": "infra",
    "src/runner/dispatch/provider-capacity.mjs": "infra",
    "src/runner/dispatch/provider-auth-failure.mjs": "infra",
    "src/runner/dispatch/provider-credential-probe.mjs": "infra",
    "src/runner/dispatch/assignment-runner.mjs": "infra",
    "src/runner/dispatch/settlement.mjs": "infra",
    "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
    "src/runner/dispatch/cli.mjs": "infra",
    "src/runner/dispatch/detached-run-supervisor.mjs": "infra",
    "src/runner/prompt-templates.mjs": "infra",
    "src/runner/worker-log.mjs": "infra",
    "src/runner/agent-roster.mjs": "infra",
    "src/runner/agent-definitions.mjs": "infra",
    "src/runner/agent-listing.mjs": "infra",
    "src/runner/worktree.mjs": "infra",
    "src/runner/promote-preflight.mjs": "infra",
    "src/runner/promote-engine.mjs": "infra",
    "src/runner/session.mjs": "infra",
    "src/runner/gateway-control.mjs": "infra",
    "src/runner/goal-check.mjs": "infra",
    "src/runner/iron-law-gate.mjs": "infra",
    "src/runner/frozen-judge.mjs": "domain",
    "src/runner/merge.mjs": "infra",
    "src/runner/main-checkout-lock.mjs": "infra",
    "src/runner/main-checkout-reset-guard.mjs": "infra",
    "src/runner/github-adapter.mjs": "infra",
    "src/state/drift-status.mjs": "infra",
    "src/state/postland-drift.mjs": "infra",
    "src/state/store.mjs": "infra",
    "src/state/gate-bypass.mjs": "infra",
    "src/state/cursor.mjs": "use-case",
    "src/state/porting-store.mjs": "infra",
    "src/state/tool-registry.mjs": "domain",
    "src/install/coexist.mjs": "infra",
    "src/runner/recovery.mjs": "domain",
    "src/runner/anti-loop.mjs": "domain",
    "src/runner/attestation-guard.mjs": "domain",
    "src/runner/claim-port.mjs": "infra",
    "src/runner/claim-liveness.mjs": "infra",
    "src/runner/lock-wait.mjs": "infra",
    "src/runner/write-queue.mjs": "domain",
    "src/runner/root-affinity.mjs": "domain",
    "src/state/status-fsm.mjs": "domain",
    "src/state/decision-question.mjs": "domain",
    "src/state/handoff.mjs": "domain",
    "src/state/porting.mjs": "domain",
    "src/state/frontier.mjs": "domain",
    "src/state/impact.mjs": "domain",
    "src/state/priority-formula.mjs": "domain",
    "src/state/replay.mjs": "domain",
    "src/state/events-compaction.mjs": "domain",
    "src/state/dep-graph.mjs": "domain",
    "src/state/graph-harness.mjs": "domain",
    "src/state/graph-metrics.mjs": "domain",
    "src/state/awaiting-context.mjs": "domain",
    "src/state/cleanup-harness.mjs": "domain",
    "src/state/cleanup-pool.mjs": "domain",
    "src/state/discover-pool.mjs": "domain",
    "src/state/plan-pool.mjs": "domain",
    "src/state/retro-pool.mjs": "domain",
    "src/state/retrospective-doors.mjs": "domain",
    "src/state/worker-slots.mjs": "domain",
    "src/intake/discovery.mjs": "use-case",
    "src/intake/plan.mjs": "use-case",
    "src/intake/plan-verdict-from-plan-md.mjs": "use-case",
    "src/intake/verify-pattern-check.mjs": "kernel",
    "src/cli/command-registry.mjs": "kernel",
    "src/cli/deprecation.mjs": "kernel",
    "src/cli/version.mjs": "kernel",
    "src/cli/invocation-fault-log.mjs": "infra",
    "src/cli/approve-fault-log.mjs": "infra",
    "src/report/enduser-index.mjs": "domain",
    "src/report/enduser-index-generate.mjs": "infra",
    "src/report/decision-index.mjs": "infra",
    "src/report/capability-plan-lint.mjs": "infra",
    "src/report/context-render.mjs": "domain",
    "src/report/frontmatter.mjs": "domain",
    "src/report/authoritative-match.mjs": "domain",
    "src/evolve/iron-law.mjs": "domain",
    "src/state/events.mjs": "kernel",
    "src/state/events-jsonl-truncation-guard.mjs": "kernel",
    "src/state/main-checkout-guard-warnings.mjs": "kernel",
    "src/state/work.mjs": "kernel",
    "src/state/envelope.mjs": "kernel",
    "src/intake/risk-keywords.mjs": "kernel",
    "src/verbs/merge/merge.mjs": "use-case",
    "src/verbs/merge/iron-law-level.mjs": "use-case",
    "src/verbs/merge/approve.mjs": "use-case",
    "src/verbs/merge/review.mjs": "use-case",
    "src/verbs/merge/sync-root.mjs": "use-case",
    "src/verbs/merge/catchup.mjs": "use-case",
    "src/verbs/merge/reject.mjs": "use-case",
    "src/verbs/merge/promote-to-component.mjs": "use-case",
    "src/verbs/state/edit.mjs": "use-case",
    "src/verbs/state/move.mjs": "use-case",
    "src/verbs/state/read.mjs": "use-case",
    "src/verbs/dispatch/show-run.mjs": "use-case",
    "src/verbs/dispatch/inspect.mjs": "use-case",
    "src/verbs/dispatch/reconcile.mjs": "use-case",
    "src/verbs/dispatch/watch.mjs": "use-case",
    "src/verbs/dispatch/recover.mjs": "use-case",
    "src/report/item-trace.mjs": "domain",
    "src/util/format-bytes.mjs": "kernel",
    "src/util/format-duration.mjs": "kernel",
    "src/util/normalize-path.mjs": "kernel",
    "src/util/release-binary-path.mjs": "kernel",
    "src/util/release-targets.mjs": "kernel",
    "src/util/session-identity.mjs": "kernel",
    "src/util/unique-tmp-tag.mjs": "kernel",
    "src/util/host-bin.mjs": "infra",
    "src/convention/convention-client.mjs": "infra",
    "src/observe/friction-client.mjs": "infra",
    "src/intake/classify.mjs": "use-case",
    "src/setup/ansi.mjs": "domain",
    "src/setup/config-merge.mjs": "domain",
    "src/setup/shell-rc.mjs": "infra",
    "src/setup/bin-discovery.mjs": "infra",
    "src/setup/skill-wrappers.mjs": "infra",
    "src/setup/instruction-registry.mjs": "infra",
    "src/setup/git-hooks.mjs": "infra",
    "src/setup/claude-code-hooks.mjs": "infra",
    "src/setup/agent-hooks.mjs": "infra",
    "src/setup/agy-permissions.mjs": "infra",
    "src/setup/agent-cli-trust.mjs": "infra",
    "src/setup/blind-steps-proven-pools.mjs": "use-case",
    "src/setup/workflow-pool-independence.mjs": "use-case",
    "src/setup/checks.mjs": "use-case",
    "src/setup/executor-profile-warnings.mjs": "infra",
    "src/config/global-config.mjs": "infra",
    "src/setup/registrations.mjs": "use-case",
    "src/config/shared-config-file.mjs": "domain",
    "src/state/knowledge-registry.mjs": "domain",
    "src/report/knowledge-resolver.mjs": "domain",
    "src/report/knowledge-projection.mjs": "domain",
    "src/state/fgos-file-registry.mjs": "kernel",
    "src/state/runtime-coordination.mjs": "infra",
    "src/runner/dispatch/brief.mjs": "infra",
    "src/runner/dispatch/dispatch-error.mjs": "infra",
    "src/runner/dispatch/proof-helpers.mjs": "infra",
    "src/runner/dispatch/herdr-agent.mjs": "infra",
    "src/runner/dispatch/herdr-diagnosis.mjs": "infra",
    "src/runner/dispatch/herdr-round.mjs": "infra",
    "src/runner/dispatch/herdr-reconcile.mjs": "infra",
    "src/runner/dispatch/worker-artifacts.mjs": "infra",
    "src/runner/dispatch/liveness.mjs": "infra",
    "src/runner/dispatch/visibility-session.mjs": "infra",
    "src/runner/dispatch/recovery-planner.mjs": "infra",
    "src/runner/dispatch/run-lock.mjs": "infra",
    "src/runner/dispatch/process-identity.mjs": "infra",
    "src/runner/dispatch/trust-store.mjs": "infra",
    "src/runner/dispatch/worker-home.mjs": "infra",
    "src/runner/dispatch/stop-processes-inside.mjs": "infra",
    "src/runner/dispatch/worker-session.mjs": "infra",
    "src/runner/dispatch/worker-session-boot.mjs": "infra",
    "src/runner/dispatch/recovery.mjs": "infra",
    "src/setup/instruction-composition.mjs": "infra",
    "src/setup/instruction-projections.mjs": "infra",
    "src/runner/execution/unit.mjs": "infra",
    "src/runner/execution/bind.mjs": "infra",
    "src/runner/execution/account-rotation.mjs": "infra",
    "src/runner/execution/dry-bind.mjs": "infra",
    "src/runner/execution/role-ledger.mjs": "infra",
    "src/runner/execution/commit-unit-work.mjs": "infra",
    "src/runner/execution/handoff-refs.mjs": "infra",
    "src/runner/execution/unit-run-history.mjs": "infra",
    "src/runner/execution/unit-summary.mjs": "infra",
    "src/runner/execution/run.mjs": "use-case",
    "src/runner/execution/patterns/index.mjs": "domain",
    "src/runner/execution/patterns/panel.mjs": "domain",
    "src/runner/execution/patterns/presets.mjs": "domain",
    "src/runner/execution/patterns/reviewed.mjs": "domain",
    "src/runner/execution/patterns/role-tasks.mjs": "domain",
    "src/runner/execution/patterns/solo.mjs": "domain",
    "src/workflow/definition.mjs": "kernel",
    "src/workflow/dir-guard.mjs": "infra",
    "src/workflow/loader.mjs": "infra",
    "src/workflow/store.mjs": "infra",
    "src/workflow/integrate.mjs": "infra",
    "src/workflow/plan-source.mjs": "infra",
    "src/workflow/runner.mjs": "use-case",
    "src/workflow/index.mjs": "use-case",
    "src/workflow/checked.mjs": "infra",
    "src/workflow/ref-digests.mjs": "infra",
    "src/workflow/seat-providers.mjs": "infra",
    "src/workflow/seats.mjs": "infra",
    "src/workflow/steps.mjs": "kernel",
    "src/state/domain-registry.mjs": "kernel",
    "src/state/step-fsm.mjs": "domain",
    "src/verbs/state/step.mjs": "use-case",
    "src/runner/operation-choice.mjs": "use-case",
    "src/runner/work-dispatch.mjs": "infra"
  }
}

```

Full current successor unit/section:
```text
{
  "contract": "architecture-manifest.v1",
  "map": "docs/architecture-map.md",
  "layers": [
    "entry",
    "use-case",
    "infra",
    "domain",
    "kernel"
  ],
  "rules": [
    "one-directional-layer",
    "domain-siloing"
  ],
  "components": [
    "packaging-distribution"
  ],
  "domains": [
    "coding",
    "marketing"
  ],
  "files": {
    "bin/fgos.mjs": "entry",
    "bin/fgos-runner.mjs": "entry",
    "src/runner/loop.mjs": "use-case",
    "src/runner/paths.mjs": "infra",
    "src/runner/dispatch.mjs": "infra",
    "src/runner/operation-capability.mjs": "domain",
    "src/runner/rigor.mjs": "kernel",
    "src/runner/dispatch-log.mjs": "infra",
    "src/runner/fanout-batch.mjs": "infra",
    "src/runner/work-compat.mjs": "infra",
    "src/runner/dispatch/adapters.mjs": "infra",
    "src/runner/dispatch/config.mjs": "infra",
    "src/runner/dispatch/confinement/policies.mjs": "infra",
    "src/runner/dispatch/confinement/bypass-pairing.mjs": "infra",
    "src/runner/dispatch/confinement/backend-registry.mjs": "infra",
    "src/runner/dispatch/confinement/authority.mjs": "infra",
    "src/runner/dispatch/confinement/request.mjs": "infra",
    "src/runner/dispatch/confinement/resources.mjs": "infra",
    "src/runner/dispatch/confinement/cleanup.mjs": "infra",
    "src/runner/dispatch/confinement/attestation-store.mjs": "infra",
    "src/runner/dispatch/confinement/drivers/bwrap.mjs": "infra",
    "src/runner/dispatch/confinement/probes/harness.mjs": "infra",
    "src/runner/dispatch/resolve.mjs": "infra",
    "src/runner/dispatch/mechanism.mjs": "infra",
    "src/runner/dispatch/plan.mjs": "infra",
    "src/runner/dispatch/transport.mjs": "infra",
    "src/runner/dispatch/prepare.mjs": "infra",
    "src/runner/dispatch/result-ladder.mjs": "infra",
    "src/runner/dispatch/assignment.mjs": "infra",
    "src/runner/dispatch/assignment-layout.mjs": "infra",
    "src/runner/dispatch/assignment-normalizer.mjs": "infra",
    "src/runner/dispatch/execution-contract.mjs": "infra",
    "src/runner/dispatch/effective-execution-contract.mjs": "infra",
    "src/runner/dispatch/agent-result-claim-contract.mjs": "infra",
    "src/runner/dispatch/evidence-attribution.mjs": "infra",
    "src/runner/dispatch/run-result.mjs": "infra",
    "src/runner/dispatch/usage-parsers.mjs": "infra",
    "src/runner/dispatch/runtime-inspection.mjs": "infra",
    "src/runner/dispatch/reconciliation-planner.mjs": "infra",
    "src/runner/dispatch/assignment-policy.mjs": "infra",
    "src/runner/dispatch/operation-prompt-templates.mjs": "infra",
    "src/runner/dispatch/provider-adapter.mjs": "infra",
    "src/runner/dispatch/provider-capacity.mjs": "infra",
    "src/runner/dispatch/provider-auth-failure.mjs": "infra",
    "src/runner/dispatch/provider-credential-probe.mjs": "infra",
    "src/runner/dispatch/provider-account-probe.mjs": "infra",
    "src/runner/dispatch/provider-credential-renewal.mjs": "infra",
    "src/runner/dispatch/assignment-runner.mjs": "infra",
    "src/runner/dispatch/settlement.mjs": "infra",
    "src/runner/dispatch/reconcile-cli-spawn.mjs": "infra",
    "src/runner/dispatch/cli.mjs": "infra",
    "src/runner/dispatch/detached-run-supervisor.mjs": "infra",
    "src/runner/prompt-templates.mjs": "infra",
    "src/runner/worker-log.mjs": "infra",
    "src/runner/agent-roster.mjs": "infra",
    "src/runner/agent-definitions.mjs": "infra",
    "src/runner/agent-listing.mjs": "infra",
    "src/runner/worktree.mjs": "infra",
    "src/runner/promote-preflight.mjs": "infra",
    "src/runner/promote-engine.mjs": "infra",
    "src/runner/session.mjs": "infra",
    "src/runner/gateway-control.mjs": "infra",
    "src/runner/goal-check.mjs": "infra",
    "src/runner/iron-law-gate.mjs": "infra",
    "src/runner/frozen-judge.mjs": "domain",
    "src/runner/merge.mjs": "infra",
    "src/runner/main-checkout-lock.mjs": "infra",
    "src/runner/main-checkout-reset-guard.mjs": "infra",
    "src/runner/github-adapter.mjs": "infra",
    "src/state/drift-status.mjs": "infra",
    "src/state/postland-drift.mjs": "infra",
    "src/state/store.mjs": "infra",
    "src/state/gate-bypass.mjs": "infra",
    "src/state/cursor.mjs": "use-case",
    "src/state/porting-store.mjs": "infra",
    "src/state/tool-registry.mjs": "domain",
    "src/install/coexist.mjs": "infra",
    "src/runner/recovery.mjs": "domain",
    "src/runner/anti-loop.mjs": "domain",
    "src/runner/attestation-guard.mjs": "domain",
    "src/runner/claim-port.mjs": "infra",
    "src/runner/claim-liveness.mjs": "infra",
    "src/runner/lock-wait.mjs": "infra",
    "src/runner/write-queue.mjs": "domain",
    "src/runner/root-affinity.mjs": "domain",
    "src/state/status-fsm.mjs": "domain",
    "src/state/decision-question.mjs": "domain",
    "src/state/handoff.mjs": "domain",
    "src/state/porting.mjs": "domain",
    "src/state/frontier.mjs": "domain",
    "src/state/impact.mjs": "domain",
    "src/state/priority-formula.mjs": "domain",
    "src/state/replay.mjs": "domain",
    "src/state/events-compaction.mjs": "domain",
    "src/state/dep-graph.mjs": "domain",
    "src/state/graph-harness.mjs": "domain",
    "src/state/graph-metrics.mjs": "domain",
    "src/state/awaiting-context.mjs": "domain",
    "src/state/cleanup-harness.mjs": "domain",
    "src/state/cleanup-pool.mjs": "domain",
    "src/state/discover-pool.mjs": "domain",
    "src/state/plan-pool.mjs": "domain",
    "src/state/retro-pool.mjs": "domain",
    "src/state/retrospective-doors.mjs": "domain",
    "src/state/worker-slots.mjs": "domain",
    "src/intake/discovery.mjs": "use-case",
    "src/intake/plan.mjs": "use-case",
    "src/intake/plan-verdict-from-plan-md.mjs": "use-case",
    "src/intake/verify-pattern-check.mjs": "kernel",
    "src/cli/command-registry.mjs": "kernel",
    "src/cli/deprecation.mjs": "kernel",
    "src/cli/version.mjs": "kernel",
    "src/cli/invocation-fault-log.mjs": "infra",
    "src/cli/approve-fault-log.mjs": "infra",
    "src/report/enduser-index.mjs": "domain",
    "src/report/enduser-index-generate.mjs": "infra",
    "src/report/decision-index.mjs": "infra",
    "src/report/capability-plan-lint.mjs": "infra",
    "src/report/context-render.mjs": "domain",
    "src/report/frontmatter.mjs": "domain",
    "src/report/authoritative-match.mjs": "domain",
    "src/evolve/iron-law.mjs": "domain",
    "src/state/events.mjs": "kernel",
    "src/state/events-jsonl-truncation-guard.mjs": "kernel",
    "src/state/main-checkout-guard-warnings.mjs": "kernel",
    "src/state/work.mjs": "kernel",
    "src/state/envelope.mjs": "kernel",
    "src/intake/risk-keywords.mjs": "kernel",
    "src/verbs/merge/merge.mjs": "use-case",
    "src/verbs/merge/iron-law-level.mjs": "use-case",
    "src/verbs/merge/approve.mjs": "use-case",
    "src/verbs/merge/review.mjs": "use-case",
    "src/verbs/merge/sync-root.mjs": "use-case",
    "src/verbs/merge/catchup.mjs": "use-case",
    "src/verbs/merge/reject.mjs": "use-case",
    "src/verbs/merge/promote-to-component.mjs": "use-case",
    "src/verbs/state/edit.mjs": "use-case",
    "src/verbs/state/move.mjs": "use-case",
    "src/verbs/state/read.mjs": "use-case",
    "src/verbs/dispatch/show-run.mjs": "use-case",
    "src/verbs/dispatch/inspect.mjs": "use-case",
    "src/verbs/dispatch/reconcile.mjs": "use-case",
    "src/verbs/dispatch/watch.mjs": "use-case",
    "src/verbs/dispatch/recover.mjs": "use-case",
    "src/report/item-trace.mjs": "domain",
    "src/util/format-bytes.mjs": "kernel",
    "src/util/format-duration.mjs": "kernel",
    "src/util/normalize-path.mjs": "kernel",
    "src/util/release-binary-path.mjs": "kernel",
    "src/util/release-targets.mjs": "kernel",
    "src/util/session-identity.mjs": "kernel",
    "src/util/unique-tmp-tag.mjs": "kernel",
    "src/util/host-bin.mjs": "infra",
    "src/convention/convention-client.mjs": "infra",
    "src/observe/friction-client.mjs": "infra",
    "src/intake/classify.mjs": "use-case",
    "src/setup/ansi.mjs": "domain",
    "src/setup/config-merge.mjs": "domain",
    "src/setup/shell-rc.mjs": "infra",
    "src/setup/project-launcher.mjs": "infra",
    "src/setup/bin-discovery.mjs": "infra",
    "src/setup/skill-wrappers.mjs": "infra",
    "src/setup/instruction-registry.mjs": "infra",
    "src/setup/git-hooks.mjs": "infra",
    "src/setup/claude-code-hooks.mjs": "infra",
    "src/setup/agent-hooks.mjs": "infra",
    "src/setup/agy-permissions.mjs": "infra",
    "src/setup/agent-cli-trust.mjs": "infra",
    "src/setup/blind-steps-proven-pools.mjs": "use-case",
    "src/setup/workflow-pool-independence.mjs": "use-case",
    "src/setup/checks.mjs": "use-case",
    "src/setup/executor-profile-warnings.mjs": "infra",
    "src/config/global-config.mjs": "infra",
    "src/setup/registrations.mjs": "use-case",
    "src/config/shared-config-file.mjs": "domain",
    "src/state/knowledge-registry.mjs": "domain",
    "src/report/knowledge-resolver.mjs": "domain",
    "src/report/knowledge-projection.mjs": "domain",
    "src/state/fgos-file-registry.mjs": "kernel",
    "src/state/runtime-coordination.mjs": "infra",
    "src/runner/dispatch/brief.mjs": "infra",
    "src/runner/dispatch/dispatch-error.mjs": "infra",
    "src/runner/dispatch/proof-helpers.mjs": "infra",
    "src/runner/dispatch/herdr-agent.mjs": "infra",
    "src/runner/dispatch/herdr-diagnosis.mjs": "infra",
    "src/runner/dispatch/herdr-round.mjs": "infra",
    "src/runner/dispatch/herdr-reconcile.mjs": "infra",
    "src/runner/dispatch/worker-artifacts.mjs": "infra",
    "src/runner/dispatch/liveness.mjs": "infra",
    "src/runner/dispatch/visibility-session.mjs": "infra",
    "src/runner/dispatch/recovery-planner.mjs": "infra",
    "src/runner/dispatch/run-lock.mjs": "infra",
    "src/runner/dispatch/process-identity.mjs": "infra",
    "src/runner/dispatch/trust-store.mjs": "infra",
    "src/runner/dispatch/worker-home.mjs": "infra",
    "src/runner/dispatch/stop-processes-inside.mjs": "infra",
    "src/runner/dispatch/worker-session.mjs": "infra",
    "src/runner/dispatch/worker-session-boot.mjs": "infra",
    "src/runner/dispatch/recovery.mjs": "infra",
    "src/setup/instruction-composition.mjs": "infra",
    "src/setup/instruction-projections.mjs": "infra",
    "src/runner/execution/unit.mjs": "infra",
    "src/runner/execution/bind.mjs": "infra",
    "src/runner/execution/account-rotation.mjs": "infra",
    "src/runner/execution/dry-bind.mjs": "infra",
    "src/runner/execution/role-ledger.mjs": "infra",
    "src/runner/execution/commit-unit-work.mjs": "infra",
    "src/runner/execution/handoff-refs.mjs": "infra",
    "src/runner/execution/unit-run-history.mjs": "infra",
    "src/runner/execution/unit-summary.mjs": "infra",
    "src/runner/execution/run.mjs": "use-case",
    "src/runner/execution/patterns/index.mjs": "domain",
    "src/runner/execution/patterns/panel.mjs": "domain",
    "src/runner/execution/patterns/presets.mjs": "domain",
    "src/runner/execution/patterns/reviewed.mjs": "domain",
    "src/runner/execution/patterns/role-tasks.mjs": "domain",
    "src/runner/execution/patterns/solo.mjs": "domain",
    "src/workflow/definition.mjs": "kernel",
    "src/workflow/dir-guard.mjs": "infra",
    "src/workflow/loader.mjs": "infra",
    "src/workflow/store.mjs": "infra",
    "src/workflow/integrate.mjs": "infra",
    "src/workflow/plan-source.mjs": "infra",
    "src/workflow/runner.mjs": "use-case",
    "src/workflow/index.mjs": "use-case",
    "src/workflow/checked.mjs": "infra",
    "src/workflow/ref-digests.mjs": "infra",
    "src/workflow/seat-providers.mjs": "infra",
    "src/workflow/seats.mjs": "infra",
    "src/workflow/steps.mjs": "kernel",
    "src/state/domain-registry.mjs": "kernel",
    "src/state/step-fsm.mjs": "domain",
    "src/verbs/state/step.mjs": "use-case",
    "src/runner/operation-choice.mjs": "use-case",
    "src/runner/work-dispatch.mjs": "infra"
  }
}

```

### claim_d52f4222d940558ef34a2d7c0f174628

Old identity: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-10
Old unit digest: b053393c73b2fe8eecad5f35e7cb87c2e6a31830b02fec1c22fb6aad1ea85013
Successor: docs/platform/agent-coordination/architecture/dispatch-control-plane.md#unheaded-block-10
Current unit digest: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c
Shown old SHA256: b053393c73b2fe8eecad5f35e7cb87c2e6a31830b02fec1c22fb6aad1ea85013
Shown current SHA256: 1d6df4038cd801c79a791a0ccca5621ce632a7f8b33a07983cc7d4220e79b05c

Full old unit/section:
````text
```txt
capability   — abstract behavior promise, bound only by
               runner.capabilities.<capability>.prefer;
               executor for[] declarations do not bind this selector
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

Full current successor unit/section:
````text
```txt
capability   — abstract behavior promise, resolved through
               runner.capabilities.<capability> (prefer/overrides), then
               runner.executors.<id>.for[] (kind "tool" executors only)
executor-id  — explicit concrete implementation override, naming a
               runner.executors.<id> entry directly
```
````

### claim_af89c4e6063eb43c4e690c3fdd430677

Old identity: docs/platform/component-boundary.md#unheaded-block-11
Old unit digest: e7f609881002fff0d6f1ac41035f63cdb09095bb5fbba2f073856682e8f7027b
Successor: docs/platform/component-boundary.md#unheaded-block-11
Current unit digest: 6bea55eabbf3ca711b55d4bee07df1e778082b2c93056e32cd2385c41465f4df
Shown old SHA256: e7f609881002fff0d6f1ac41035f63cdb09095bb5fbba2f073856682e8f7027b
Shown current SHA256: 6bea55eabbf3ca711b55d4bee07df1e778082b2c93056e32cd2385c41465f4df

Full old unit/section:
```text
| Component | Current role | Current source |
| --- | --- | --- |
| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |
| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for "ai làm / model / persona / cơ chế" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |
| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |
| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\|status\|stop`; không phải một phần của herdr và không phải "herdr-gateway" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters. | [../specs/confinement-authority.md](../specs/confinement-authority.md) |
| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |
| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |
| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |
| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |
| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |
| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |
```

Full current successor unit/section:
```text
| Component | Current role | Current source |
| --- | --- | --- |
| Work Lifecycle Engine / Work Driver | Domain-agnostic work-unit lifecycle, status board, claim/return, human gates. Does not own stage or sequencing (owned by Workflow runner). Owns worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`). | [../architect/component-boundary/component-boundary-advisory.md](../architect/component-boundary/component-boundary-advisory.md) |
| Workflow (Định nghĩa + Run + Runner + Tích hợp) | Domain-neutral step & Unit DAG scheduling (`src/workflow/**`), human review gates, pure git integration. Single sequencer for plans, workflows, and multi-unit tasks. | [../specs/runner.md](../specs/runner.md) |
| Execution Core (Unit, Unit run, `bind()`, Pattern cộng tác, cửa `fgos run`, posture) | Single authority for "ai làm / model / persona / cơ chế" (`src/runner/execution/bind.mjs`), single run door for new work (`fgos run` via `src/runner/execution/run.mjs`, herdr pane default, cli fallback), OS confinement posture for both herdr and cli, verifiable mutating gate. Strictly forbids L3 Work lifecycle dependencies (`src/state/**`). | [../specs/runner.md](../specs/runner.md) |
| Collaboration Patterns (Execution Core) | Domain-neutral small collaboration loops (`solo`, `reviewed`, `panel`) and presets (`consult`, `research-fan-out`, `rfc`). Replaces retired coordination engine. | [../specs/runner.md](../specs/runner.md) |
| Herdr (Transport chính + Bề mặt quan sát) | Transport mặc định cho out-of-process runs, pane execution liveness, plugin `herdr-dashboard/` (TUI trong pane herdr + pick/pane supervisor; herdr nạp qua `herdr-plugin.toml`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| fgos Gateway | Tiến trình detached duy nhất phục vụ REST API (`/v1`, hợp đồng CTR010), MCP `search`/`execute` trên cùng cổng, và bundle web dashboard nhúng sẵn (`apps/fgos-gateway/`: `gateway.rs`, `mcp.rs`, `cf_access.rs`, `remote_invocation.rs`, `web/`). Vòng đời duy nhất qua `fgos gateway start\|status\|stop`; không phải một phần của herdr và không phải "herdr-gateway" (tên đó chỉ repo tham chiếu ngoài). Dùng chung với `herdr-dashboard` lớp adapter CLI fgos tại `packages/herdr-fgos-common/rust` (`fgos.rs`, `settings.rs`, trait `WorkItemSource`). | [../specs/herdr-web-dashboard.md](../specs/herdr-web-dashboard.md) |
| Dispatch Transport & Confinement | Machine backend registry, isolation confinement (`bwrap` v1 driver, attestation storage, fail-closed probes), executor adapters; the `bwrap` driver calls the credential renewal module at provisioning (`copyCredentialFiles`, the write-back marker) and removing a private home (`confinement/cleanup.mjs`) calls it again for write-back (dependency confinement → provider capacity, for the account lock only). | [../specs/confinement-authority.md](../specs/confinement-authority.md) |
| Run Result Evaluator | Evidence/confidence boundary for assignment run results. | [../architect/agent-coordination/architecture/evidence-and-results.md](../architect/agent-coordination/architecture/evidence-and-results.md) |
| Domain Components And Extension Layer | Domain-specific behavior, workflows, skills, task specs, doctrine. L2 prose no longer picks executors or mechanisms (lớp matching L2 cũ đã thu hồi per 0048); thin driver `fgos-run` delegates directly to Workflow runner and P1 Execution Core. | [../../domains/](../../domains/), [../architect/domainization/](../architect/domainization/) |
| Host And Surface Layer | CLI, fgos Gateway (REST/MCP/web), `herdr-dashboard` plugin and other Herdr surfaces into platform engines. | Host invocation and gateway docs |
| Packaging-Distribution | Runtime packaging, install, activation, setup/doctor readiness. | [packaging-distribution/README.md](packaging-distribution/README.md) |
| Knowledge, Learning, And Documentation Registry | Retrospective learning, doc registry, end-user docs index, trace/evolve signals. | Knowledge and docs registry docs |
| Observe (Metrics & Friction) | Measurement and friction tracking across substrate entities (cases, runs, sessions, friction, snapshots). Owned in Rust (`packages/observe/rust`), native routing. | [../specs/observe.md](../specs/observe.md) |
| Convention (Executable Names & Placement) | Platform-core authority for deterministic artifact names, repository-relative placement, path classification, and conformance checking. Implemented; owns no state and depends only on `fgos-host-runtime`. | [convention/spec.md](convention/spec.md) |
```

### claim_9c0e5bb670fb2957bb0998cbe5d8d51e

Old identity: docs/platform/packaging-distribution/spec.md#unheaded-block-4
Old unit digest: c068f5dddf466e0aa502a6524b019543a8bff6ed6b34ebed2a18adb3d5d1b745
Successor: docs/platform/packaging-distribution/spec.md#unheaded-block-4
Current unit digest: c14f83e85b43064dd321bf0926e6b98f781c23df08cf772ef8959a30837a2e18
Shown old SHA256: c068f5dddf466e0aa502a6524b019543a8bff6ed6b34ebed2a18adb3d5d1b745
Shown current SHA256: c14f83e85b43064dd321bf0926e6b98f781c23df08cf772ef8959a30837a2e18

Full old unit/section:
```text
| Entry point | Status | Purpose |
| --- | --- | --- |
| `install.sh` | Implemented | Installs `fgctl` from release assets into a machine-local install directory. |
| `install.ps1` | Implemented preview | The Windows counterpart of `install.sh` (PowerShell 5.1 or later, no administrator rights, no `PATH` change): installs `fgctl.exe` for `x86_64-pc-windows-msvc` with the same `FGCTL_VERSION` / `FGCTL_INSTALL_DIR` / `FGCTL_ASSET_BASE_URL` / `FGCTL_TARGET` semantics and a mandatory `SHA256SUMS` check (rule RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell) in `docs/specs/distribution.md`). |
| `fgctl init` | Implemented preview | Initializes a project/workspace from a release chosen by `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the committed pin > the latest GitHub release; a downloaded asset is checksum-verified against `SHA256SUMS` before staging (rule RUL15 (fgctl init downloads a checksum-verified release when no source is given) in `docs/specs/distribution.md`). |
| `fgctl upgrade` | Implemented preview | Moves a workspace activation to another release when supplied; current preview proof covers no-op upgrade against the verified asset. |
| `fgctl repair` | Implemented preview | Repairs a workspace installation under the selected release model; current preview proof covers repair after activation. |
| `.fgos/installation/bin/fgos` | Implemented preview | Stable workspace command surface after activation; current preview proof reports `host: "rust"` and the activated `artifactDigest`. |
| `.fgos/installation/bin/fgos.cmd`, `fgos-runner.cmd` | Implemented preview | The same stable surface for PowerShell and `cmd.exe`, written by `fgctl init`/`repair` next to the `sh` pair and needing no POSIX shell; `fgctl verify` reports a missing or edited launcher and `fgctl repair` regenerates it. |
| `npm install -g github:vantt/forgent` | Implemented legacy deprecated | Installs the legacy Node `fgos` and `fgos-runner` entry points; explicit deprecated escape hatch during the compatibility window, not the public/default posture. |
| `scripts/fgos-shell-integration.sh` | Implemented | Contributor/dev helper that resolves fgOS command tiers from shell functions. |
| local `fgos init` | Partial target | Adopts/materializes workspace state after `fgctl` publishes a ready activation. |
| `fgos doctor` | Implemented | Reports environment checks without writing by default. |
| `fgos doctor --fix` | Implemented | Runs registered fixes and then reports checks. |
| `fgos setup` | Implemented deprecated legacy compatibility | Wires local development support and runs registered environment repairs in the current Node CLI; command surfaces point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`, while shell/global integration remains compatibility behavior through the 30-day preview fallback window unless a later release decision replaces it. |
```

Full current successor unit/section:
```text
| Entry point | Status | Purpose |
| --- | --- | --- |
| `install.sh` | Implemented | Installs `fgctl` from release assets into a machine-local install directory. |
| `install.ps1` | Implemented preview | The Windows counterpart of `install.sh` (PowerShell 5.1 or later, no administrator rights, no `PATH` change): installs `fgctl.exe` for `x86_64-pc-windows-msvc` with the same `FGCTL_VERSION` / `FGCTL_INSTALL_DIR` / `FGCTL_ASSET_BASE_URL` / `FGCTL_TARGET` semantics and a mandatory `SHA256SUMS` check (rule RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell) in `docs/specs/distribution.md`). |
| `fgctl init` | Implemented preview | Initializes a project/workspace from a release chosen by `--from` > `FGCTL_FROM` > `FGCTL_VERSION` > the committed pin > the latest GitHub release; a downloaded asset is checksum-verified against `SHA256SUMS` before staging (rule RUL15 (fgctl init downloads a checksum-verified release when no source is given) in `docs/specs/distribution.md`). |
| `fgos` launcher | Implemented preview | One `fgos` (`fgos.cmd` on Windows) written next to `fgctl` by `fgos doctor --fix` (which `fgctl init` runs): it walks up to the nearest `.fgos/installation/bin/fgos` and runs it, so each project runs its own activated release with no absolute path and no rc edit. A different `fgos` found first on `PATH` is reported, never overwritten. See distribution spec RUL17 (one fgos on PATH runs each project's own activated fgos). |
| `fgctl upgrade` | Implemented preview | Moves a workspace activation to another release when supplied; current preview proof covers no-op upgrade against the verified asset. |
| `fgctl repair` | Implemented preview | Repairs a workspace installation under the selected release model; current preview proof covers repair after activation. |
| `.fgos/installation/bin/fgos` | Implemented preview | Stable workspace command surface after activation; current preview proof reports `host: "rust"` and the activated `artifactDigest`. |
| `.fgos/installation/bin/fgos.cmd`, `fgos-runner.cmd` | Implemented preview | The same stable surface for PowerShell and `cmd.exe`, written by `fgctl init`/`repair` next to the `sh` pair and needing no POSIX shell; `fgctl verify` reports a missing or edited launcher and `fgctl repair` regenerates it. |
| `npm install -g github:vantt/forgent` | Implemented legacy deprecated | Installs the legacy Node `fgos` and `fgos-runner` entry points; explicit deprecated escape hatch during the compatibility window, not the public/default posture. |
| `scripts/fgos-shell-integration.sh` | Implemented | Contributor/dev helper that resolves fgOS command tiers from shell functions. |
| local `fgos init` | Partial target | Adopts/materializes workspace state after `fgctl` publishes a ready activation. |
| `fgos doctor` | Implemented | Reports environment checks without writing by default. |
| `fgos doctor --fix` | Implemented | Runs registered fixes and then reports checks. |
| `fgos setup` | Implemented deprecated legacy compatibility | Wires local development support and runs registered environment repairs in the current Node CLI; command surfaces point workspace onboarding to `fgctl init` plus local `fgos doctor --fix`/`fgos doctor`, while shell/global integration remains compatibility behavior through the 30-day preview fallback window unless a later release decision replaces it. |
```

### claim_15308eb4847ddd38be79bd87bd69a0b6

Old identity: docs/specs/confinement-authority.md#unheaded-block-140
Old unit digest: a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6
Successor: docs/specs/confinement-authority.md#unheaded-block-140
Current unit digest: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc
Shown old SHA256: a58b4be15c55c3d02464399b2586a140a5570426f09c064077121b88783931f6
Shown current SHA256: 0291bfb160d8cd95cf9b5d305ba952d9f824993e04ebbfdde79b629f8b1a92dc

Full old unit/section:
```text
1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật; với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
```

Full current successor unit/section:
```text
1. `resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: <CODEX_HOME | HOME | PI_CODING_AGENT_DIR> } }]` trên invocation (cùng dạng `codex-cli-bwrap`).
2. Login của account đến từ inventory toàn máy `runner.providers.<provider>.accounts.<id>.credentialSource` trong `~/.fgos/config.json` (RUL65b của `docs/specs/runner.md`): kind `codex-home` (`auth.json`) hoặc `home-files` (danh sách file tường minh, copy owner-only, fail closed) — driver `drivers/bwrap.mjs` copy vào private home trước khi spawn. Account có thể khai `credentialSources` (một store cho mỗi CLI, key là tên lệnh); request của Authority (`buildConfinementRequest`) chọn store của CLI mà invocation chạy, và CLI không có store thì bị từ chối trước khi worker chạy (runner.md RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Không mount thư mục account thật, không bypass flag thay sandbox.
3. Trust của workspace ghi vào store trong private home (`herdr-round.mjs` `trustStorePaths`), dẫn xuất từ store account thật — store của chính account được lease (credential source mà Authority chuyển cho adapter qua `trustAccountSource`), không phải account mà env tĩnh của invocation chỉ tới (runner.md RUL78 (a confined pane reads its folder trust from the leased account's own store)); với codex, trust từng hook của `<cwd>/.codex/hooks.json` (`[hooks.state."<đường dẫn tuyệt đối>:<event>:<nhóm>:<handler>"] trusted_hash`, băm theo luật của codex, ghim bằng test) được gieo cùng lúc, chỉ vào config của private home (không bao giờ vào config thật của account; private home bị xoá sau dispatch nên không có bước gỡ) và chỉ khi gốc repo đã được người dùng tin; với claude, các MCP server do `<cwd>/.mcp.json` khai báo được duyệt riêng cho tiến trình worker bằng `--settings` (`enabledMcpjsonServers`, thêm vào args khi chuẩn bị worker invocation; không ghi file dùng chung), cũng chỉ khi gốc repo đã được tin; `fgos doctor` check `confined-pane-accounts` báo pane nào sẽ khởi động chưa đăng nhập.
```

### claim_65b61a54c10aa48c0dc423cf65cff0a2

Old identity: docs/specs/distribution.md#unheaded-block-14
Old unit digest: fa3f748914efbaea7c57bef01798385bca7de83421cb30c59670cc603d278f54
Successor: docs/specs/distribution.md#unheaded-block-14
Current unit digest: cdc65be47d5ab1b4f61dfdef36be58ea1c499cff90dd56e3b3bcb5431aa561f4
Shown old SHA256: fa3f748914efbaea7c57bef01798385bca7de83421cb30c59670cc603d278f54
Shown current SHA256: cdc65be47d5ab1b4f61dfdef36be58ea1c499cff90dd56e3b3bcb5431aa561f4

Full old unit/section:
```text
- **RUL14 (the lazy-probe unlock rule: an account locked for a dead login unlocks itself after one real call that succeeds).** An account quarantined as `auth-token` has no end time: the owner logs in again by hand and fgOS cannot see it. Instead of waiting for a person to run the clear command, a dispatch that finds **no usable account of the provider** makes one real, cheap call per such account (Codex: `codex exec`; a pi account directory: `pi -p`), against the account's own home, not a copy, because a login that rotates its refresh token on renewal would use the token up in a throwaway copy. A call that answers clears the lock (audited as `fgos provider-capacity probe`) and the dispatch goes on; one that does not keeps the lock and records the attempt, and no new call is made for that account within a 30 minute cooldown, however many dispatches ask. Only `auth-token` locks are probed: a quota limit ends by itself and any other manual lock is a person's decision. The call is never made while another account of the provider is usable, runs outside the state lock, stops at the first account that answers, and a failure to probe never blocks the dispatch. A credential layout fgOS cannot name (the agy homes of Gemini) has no call, so that account stays locked for a person. The probe is passed to the dispatch by its callers; a caller that passes none changes nothing.
- **RUL15 (`fgctl init` needs no hand-downloaded tarball: it picks its release by a fixed precedence and downloads it checksum-verified; 2026-10-12).** The release `fgctl init` installs comes from the first of these that is set:
  1. `--from <path | URL>` on the command line;
  2. the `FGCTL_FROM=<path | URL>` environment variable (same meaning as the flag, for a non-release build: a `.tar.gz`, a release directory, or a URL);
  3. `FGCTL_VERSION=<tag>`, which downloads exactly that tag's asset (needed for a pre-release, which "latest" never selects);
  4. the release pinned by the project's committed `.fgos/distribution.json` (no network when that release is staged on the machine; otherwise see "The pin records the tag" below);
  5. otherwise the latest GitHub release, found by following `<repo>/releases/latest` to its tag.
  - An explicit source (1-3) beats a pin; the pin then only validates what was fetched (a different digest is refused as a pin mismatch, as for `--from` today). The inputs are read per invocation; nothing is remembered.
  - **The pin records the tag.** When `fgctl init` installs from a download (latest or `FGCTL_VERSION`) and writes a new `.fgos/distribution.json`, it stores the resolved tag in `projectRuntime.releaseVersion` next to the digest (a local or URL source writes a digest-only pin with a null `releaseVersion`, never the build's own manifest version, which is not a download name; an existing pin is never rewritten). A pin with a tag whose digest is not staged on this machine (a teammate's fresh clone, or a quarantined release) makes a plain `fgctl init` download that tag, checksum-verified; the pin's digest must equal what was fetched, else `pin-mismatch` and nothing is activated. A tag written without the leading `v` (a hand-edited pin, for example `0.2.0`) is read as `v0.2.0`, the form releases are tagged in; if the download still fails, the error names the pinned tag and points to `FGCTL_VERSION` and `FGCTL_FROM` instead of surfacing a bare HTTP error. A digest-only pin (no tag) keeps the old behavior: it needs `--from`, `FGCTL_FROM` or `FGCTL_VERSION` on a machine that has not staged it. `fgctl upgrade` writes no tag (it takes a local path), so an upgraded pin goes back to digest-only unless the manifest carries its own version.
  - A download fetches `fgos-<tag>-<target>.tar.gz` and `SHA256SUMS` through the system `curl` with the same flags, timeouts and `FGCTL_ASSET_BASE_URL` override as `install.sh`; there is no HTTP/TLS library in `fgctl`. The target is detected the way the installers do (`FGCTL_TARGET` overrides; `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` are supported, see RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)) and an unsupported target refuses before any request.
  - Verification is mandatory: the asset's own entry in `SHA256SUMS` (file name matched exactly) must equal the downloaded file's SHA-256, otherwise `fgctl init` refuses and writes nothing (no staging, no pin, no activation). A URL source must have `SHA256SUMS` in the same directory; a local path is trusted as given. The download lives in a private scratch directory under `${TMPDIR:-/tmp}/fgos-work/` that is removed when init returns, success or not.
  - The project must be inside a git repository, checked before any request is made (unchanged). `fgctl upgrade` and `fgctl stage` still take only `--from <path>`; they do not download.
  - `curl` is an assumed tool (on Windows, the `curl.exe` that ships with Windows 10 and later): the `curl-available` doctor check reports it.
- **RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell; 2026-10-13).** fgOS runs from a plain PowerShell or `cmd.exe` session on Windows 10 and later, with no Git Bash and no WSL.
  - **Assets.** A release publishes, per target, `fgos-<tag>-<target>.tar.gz` and `fgctl-<tag>-<target>.tar.gz` for `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc`, one `SHA256SUMS` covering every asset, and both installers (`install.sh`, and `install.ps1`, which lives at `scripts/install.ps1` in the repository because the root-file allowlist is closed and is published under the name `install.ps1`). `tar.gz` is the one archive format on every target: Windows 10 and later ship `tar.exe` and `curl.exe`, and the Rust extractor already reads it. The Windows `fgos` tree carries the host as `bin/fgos.exe` (and `bin/fgos`, the manifest's entry name), a `bin/fgos-runner.cmd` beside the `sh` form of `bin/fgos-runner`, and declares `target: {os: windows, arch: x64}`. The Linux asset is built on `ubuntu-22.04`, and the build fails when a shipped binary needs a glibc symbol newer than `GLIBC_2.35` (`scripts/check-glibc-ceiling.sh`), so a binary never prints a loader error on the oldest supported distribution. A new platform is one row in `src/util/release-targets.mjs`, one in the Rust `host_target` table, one in each installer and one release-workflow matrix entry; macOS is not published.
  - **`install.ps1`.** Same contract as `install.sh`: `FGCTL_VERSION`, `FGCTL_INSTALL_DIR` (default `%LOCALAPPDATA%\fgos\bin`), `FGCTL_ASSET_BASE_URL` (http, https or `file://`), `FGCTL_TARGET`; the tarball's own `SHA256SUMS` entry must match or nothing is installed; a symlinked `fgctl.exe` is refused; every request is bounded by a timeout. It needs no administrator rights (an elevated session is refused unless `FGCTL_ALLOW_ROOT=1`, as `install.sh` refuses root), never changes `PATH`, and prints the commands that do. Like `install.sh`, with no `FGCTL_VERSION` it installs the latest NON-prerelease, so a pre-release needs `FGCTL_VERSION`.
  - **Workspace launchers.** `fgctl init` and `fgctl repair` write four launchers into `.fgos/installation/bin/`: the `sh` pair `fgos`, `fgos-runner` (Linux, macOS, Git Bash) and the batch pair `fgos.cmd`, `fgos-runner.cmd` (PowerShell, `cmd.exe`; no `sh` involved). Each reads `activation.json`, refuses with exit 3 unless `status` is `ready`, and runs the active release's entry. A directory on `PATH` holding them makes `fgos` resolve in PowerShell through `PATHEXT`. The post-activation tail (`init`, `doctor --fix`, `doctor`) runs the `.cmd` form on a Windows host. `fgctl verify` checks that the launchers its host needs (the `sh` pair everywhere, the batch pair too on Windows) exist and equal what this `fgctl` writes; a missing or edited one is reported with `run fgctl repair` and never quarantines the (intact) release.
  - **Proof.** Pushing a release tag builds both targets and runs a consumer proof on each, and only when both pass does the publish job run; publishing exists only in `release.yml`. The Windows proof (`scripts/ci-external-consumer.ps1`, under Windows PowerShell 5.1 and PowerShell 7) installs `fgctl` with `install.ps1`, runs `fgctl init` against a local release server, runs the activated `fgos` from PowerShell and from `cmd.exe`, and checks that a tampered download is refused by both the installer and `fgctl init`.
  - **Not covered.** Windows ARM64 and macOS have no asset. The machine release store stays at `%USERPROFILE%\.local\state\fgos` (`FGOS_STATE_HOME` moves it); relocating it to `%LOCALAPPDATA%` is a separate decision.
```

Full current successor unit/section:
```text
- **RUL14 (the lazy-probe unlock rule: moved).** The rule that unlocks an account locked for a dead login with one real call now lives with the provider-capacity rules in `docs/specs/runner.md` (RUL74 (lazy-probe unlock: an account locked for a dead login unlocks itself after one real call that succeeds)), together with the refresh-ahead and write-back rules for a rotating login (RUL75 (a rotating provider login is renewed once at the source, in a copy fgOS holds, and a login renewed inside a private home is written back)). This document keeps only where the state lives (row 5d).
- **RUL15 (`fgctl init` needs no hand-downloaded tarball: it picks its release by a fixed precedence and downloads it checksum-verified; 2026-10-12).** The release `fgctl init` installs comes from the first of these that is set:
  1. `--from <path | URL>` on the command line;
  2. the `FGCTL_FROM=<path | URL>` environment variable (same meaning as the flag, for a non-release build: a `.tar.gz`, a release directory, or a URL);
  3. `FGCTL_VERSION=<tag>`, which downloads exactly that tag's asset (needed for a pre-release, which "latest" never selects);
  4. the release pinned by the project's committed `.fgos/distribution.json` (no network when that release is staged on the machine; otherwise see "The pin records the tag" below);
  5. otherwise the latest GitHub release, found by following `<repo>/releases/latest` to its tag.
  - An explicit source (1-3) beats a pin; the pin then only validates what was fetched (a different digest is refused as a pin mismatch, as for `--from` today). The inputs are read per invocation; nothing is remembered.
  - **The pin records the tag.** When `fgctl init` installs from a download (latest or `FGCTL_VERSION`) and writes a new `.fgos/distribution.json`, it stores the resolved tag in `projectRuntime.releaseVersion` next to the digest (a local or URL source writes a digest-only pin with a null `releaseVersion`, never the build's own manifest version, which is not a download name; an existing pin is never rewritten). A pin with a tag whose digest is not staged on this machine (a teammate's fresh clone, or a quarantined release) makes a plain `fgctl init` download that tag, checksum-verified; the pin's digest must equal what was fetched, else `pin-mismatch` and nothing is activated. A tag written without the leading `v` (a hand-edited pin, for example `0.2.0`) is read as `v0.2.0`, the form releases are tagged in; if the download still fails, the error names the pinned tag and points to `FGCTL_VERSION` and `FGCTL_FROM` instead of surfacing a bare HTTP error. A digest-only pin (no tag) keeps the old behavior: it needs `--from`, `FGCTL_FROM` or `FGCTL_VERSION` on a machine that has not staged it. `fgctl upgrade` writes no tag (it takes a local path), so an upgraded pin goes back to digest-only unless the manifest carries its own version.
  - A download fetches `fgos-<tag>-<target>.tar.gz` and `SHA256SUMS` through the system `curl` with the same flags, timeouts and `FGCTL_ASSET_BASE_URL` override as `install.sh`; there is no HTTP/TLS library in `fgctl`. The target is detected the way the installers do (`FGCTL_TARGET` overrides; `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` are supported, see RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell)) and an unsupported target refuses before any request.
  - Verification is mandatory: the asset's own entry in `SHA256SUMS` (file name matched exactly) must equal the downloaded file's SHA-256, otherwise `fgctl init` refuses and writes nothing (no staging, no pin, no activation). A URL source must have `SHA256SUMS` in the same directory; a local path is trusted as given. The download lives in a private scratch directory under `${TMPDIR:-/tmp}/fgos-work/` that is removed when init returns, success or not.
  - The project must be inside a git repository, checked before any request is made (unchanged). `fgctl upgrade` and `fgctl stage` still take only `--from <path>`; they do not download.
  - `curl` is an assumed tool (on Windows, the `curl.exe` that ships with Windows 10 and later): the `curl-available` doctor check reports it.
- **RUL16 (Windows is a native release target: same assets, an installer and launchers that need no POSIX shell; 2026-10-13).** fgOS runs from a plain PowerShell or `cmd.exe` session on Windows 10 and later, with no Git Bash and no WSL.
  - **Assets.** A release publishes, per target, `fgos-<tag>-<target>.tar.gz` and `fgctl-<tag>-<target>.tar.gz` for `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc`, one `SHA256SUMS` covering every asset, and both installers (`install.sh`, and `install.ps1`, which lives at `scripts/install.ps1` in the repository because the root-file allowlist is closed and is published under the name `install.ps1`). `tar.gz` is the one archive format on every target: Windows 10 and later ship `tar.exe` and `curl.exe`, and the Rust extractor already reads it. The Windows `fgos` tree carries the host as `bin/fgos.exe` (and `bin/fgos`, the manifest's entry name), a `bin/fgos-runner.cmd` beside the `sh` form of `bin/fgos-runner`, and declares `target: {os: windows, arch: x64}`. The Linux asset is built on `ubuntu-22.04`, and the build fails when a shipped binary needs a glibc symbol newer than `GLIBC_2.35` (`scripts/check-glibc-ceiling.sh`), so a binary never prints a loader error on the oldest supported distribution. A new platform is one row in `src/util/release-targets.mjs`, one in the Rust `host_target` table, one in each installer and one release-workflow matrix entry; macOS is not published.
  - **`install.ps1`.** Same contract as `install.sh`: `FGCTL_VERSION`, `FGCTL_INSTALL_DIR` (default `%LOCALAPPDATA%\fgos\bin`), `FGCTL_ASSET_BASE_URL` (http, https or `file://`), `FGCTL_TARGET`; the tarball's own `SHA256SUMS` entry must match or nothing is installed; a symlinked `fgctl.exe` is refused; every request is bounded by a timeout. It needs no administrator rights (an elevated session is refused unless `FGCTL_ALLOW_ROOT=1`, as `install.sh` refuses root), never changes `PATH`, and prints the commands that do. Like `install.sh`, with no `FGCTL_VERSION` it installs the latest NON-prerelease, so a pre-release needs `FGCTL_VERSION`.
  - **Workspace launchers.** `fgctl init` and `fgctl repair` write four launchers into `.fgos/installation/bin/`: the `sh` pair `fgos`, `fgos-runner` (Linux, macOS, Git Bash) and the batch pair `fgos.cmd`, `fgos-runner.cmd` (PowerShell, `cmd.exe`; no `sh` involved). Each reads `activation.json`, refuses with exit 3 unless `status` is `ready`, and runs the active release's entry. A directory on `PATH` holding them makes `fgos` resolve in PowerShell through `PATHEXT`. The post-activation tail (`init`, `doctor --fix`, `doctor`) runs the `.cmd` form on a Windows host. `fgctl verify` checks that the launchers its host needs (the `sh` pair everywhere, the batch pair too on Windows) exist and equal what this `fgctl` writes; a missing or edited one is reported with `run fgctl repair` and never quarantines the (intact) release.
  - **Proof.** Pushing a release tag builds both targets and runs a consumer proof on each, and only when both pass does the publish job run; publishing exists only in `release.yml`. The Windows proof (`scripts/ci-external-consumer.ps1`, under Windows PowerShell 5.1 and PowerShell 7) installs `fgctl` with `install.ps1`, runs `fgctl init` against a local release server, runs the activated `fgos` from PowerShell and from `cmd.exe`, and checks that a tampered download is refused by both the installer and `fgctl init`.
  - **Not covered.** Windows ARM64 and macOS have no asset. The machine release store stays at `%USERPROFILE%\.local\state\fgos` (`FGOS_STATE_HOME` moves it); relocating it to `%LOCALAPPDATA%` is a separate decision.
- **RUL17 (one `fgos` on PATH runs each project's own activated fgos; `doctor --fix` provides it; 2026-10-13).** A release install puts only `fgctl` on PATH and `fgctl init` activates a release per project, so a plain `fgos` used to need an absolute path. `fgos doctor` check `project-fgos-launcher` and its registered fix own the answer, and `fgctl init` already ends by running `doctor --fix`:
  - The fix writes one small launcher named `fgos` (`fgos.cmd` on Windows) into the directory `fgctl` was found in on `PATH`. The launcher walks up from the working directory to the nearest `.fgos/installation/bin/fgos` and runs it with the same arguments, so each project runs the release it activated, from any subdirectory, in any shell, interactive or not; it edits no rc file. Outside a project it exits 127 and says to run `fgctl init`.
  - The launcher carries a marker line. The check reports `ready`, an out-of-date copy (rewritten by the fix), a foreign `fgos` found first on `PATH` (never overwritten; the check names it), no `fgos` with `fgctl` on `PATH` (the fix writes it), or neither on `PATH` (the check says to add the directory `fgctl` was installed into).
  - A source checkout keeps the sourced shell-integration script and needs no launcher; the check passes there.
  - Proof: `test/setup/project-launcher.test.mjs` (two projects and a nested one each run their own fgos; the `cmd` launcher runs on Windows in the focused Windows job).
```

### claim_0f4d968b593902731bd334f9ed2af711

Old identity: docs/specs/distribution.md#unheaded-block-5
Old unit digest: cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c
Successor: docs/specs/distribution.md#unheaded-block-5
Current unit digest: 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90
Shown old SHA256: cdf23ebc6949803aa19ec83913121c79ebc370e9ef29134c0fb3bf49af44a99c
Shown current SHA256: 0ce5ce17cd290a31a55e9a63872f96732a0cd0d096c4aa29693105768629ba90

Full old unit/section:
```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule below). | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |
```

Full current successor unit/section:
```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Package name | The npm package identity used for the git-based install command | `forgent` | yes | — |
| 2 | Package version | A semantic version string tooling (e.g. packaging commands) needs to treat the package as valid | semver string | yes | `0.1.0` |
| 3 | Distribution file allowlist | The exact set of paths shipped to anyone installing the package — everything else in the source repo is excluded | `bin`, `src`, `scripts`, `core`, `domains`, `.agents`, `README.md`, `LICENSE`, the end-user documentation subset (`docs/how-to`, `docs/explanation`, and `docs/enduser-docs-index.json`), plus `packages/convention/contracts/convention.rules.v1.json`, which installed doctor needs to interpret per-rule cutoffs without duplicating native rule data | yes | — |
| 4 | CLI entry points | The commands exposed once installed | `fgos` → runs `bin/fgos.mjs`; `fgos-runner` → runs `bin/fgos-runner.mjs` (the autonomous-loop runner, see spec Runner) | yes | — |
| 4b | Claude Code plugin skill set | `plugins/fgOS/skills/` — the Claude Code plugin's own skill bundle, distributed via the Claude Code plugin marketplace mechanism (a separate distribution channel from the npm-installed `fgos`/`fgos-runner` CLI above). Ships two layers: hand-authored CLI-wrapper skills (`cook`, `discover`, `pick`, `submit`, ...) and mirrored `fgos-*` dev-skills plus `_shared/` for plugin-only consumers. Dev-skills are authored in `core/skills/` or `domains/*/skills/`; run `npm run build:skills` in the fgOS source repo to assemble `.agents/skills/`, generate `.claude/skills/` thin wrappers and references, and mirror dev-skills/shared fragments into the plugin. Plugin mirrors stay byte-identical to `.agents/skills/`, while Claude `SKILL.md` files are thin redirects with byte-identical frontmatter (`test/skills/fgos-mirror.test.mjs`). Assembled Markdown carries a generated-from source header. Do not hand-edit `.agents`, generated `.claude` files, or plugin mirrors; hand-authored CLI-wrapper skills remain sources. `plugin-dev-skills-packaged` (doctor check, row 7 below) detects missing or stale plugin mirrors | mirrored dev-skills + shared fragments + hand-authored CLI-wrapper skills | yes (the mirrors let plugin-only consumers dispatch dev-skills without a source checkout) | — |
| 5 | Dev checkout shell helper | An opt-in file, sourced from a contributor's own shell profile, exposing the same two CLI entry points from inside a checkout of the source repository — no install, no package fetch | one file, both commands | no (contributor's own choice) | not sourced automatically anywhere |
| 5b | Global config file | `~/.fgos/config.json` — same schema as the project-local shared config file, initialized/kept current by `fgos setup` (tsk-1ri) the same way it already handles the project-local file; project always wins any key present in both (`mergeWithGlobalConfig`, `src/config/global-config.mjs`) | one file, home-dir-relative | no (optional; a missing file is not an error, resolves to `{}`) | not created by anything except `fgos setup` |
| 5c | Machine backend registry file | `~/.fgos/confinement-backends.json` (overridable via `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`) — machine-local backend registry declaring confinement backends (e.g. `bwrap`, container) available on the host (`confinement-backend-registry.v1`); managed by `fgos doctor --fix` (not project-over-global merge), trust store for security isolation drivers | one file, machine-local path | no (optional; bootstrap creates default bwrap backend on demand) | `~/.fgos/confinement-backends.json` |
| 5d | Provider-capacity runtime state | `~/.fgos/runtime/provider-capacity/state.json` plus lock `state.lock` — machine-local selected-account lease/quarantine state for provider-capacity rotation. Intentionally host-global only (never project-overridden) so multiple projects sharing provider accounts coordinate concurrency and rate limits safely without starvation. It is never packaged, never committed, and never repaired by `doctor`; `fgos dispatch inspect --provider-capacity` and the `provider-capacity-state` doctor check report it, while manual clear goes through `fgos dispatch reconcile provider-capacity clear-quarantine ...`. An account locked for a dead login is also unlocked by one real call when a dispatch would otherwise find no usable account (the lazy-probe unlock rule, now in `docs/specs/runner.md`). The same directory holds `account-locks/<provider>/<account>/`: the per-account lock, copies of a login renewed elsewhere and waiting to be applied, a scratch home while a renewal runs, and the renewal failure cooldown; it is created only when a renewal or write-back runs and holds no credential outside those copies. | one runtime directory, home-dir-relative | no (created only when a provider account lease/quarantine/write occurs) | absent/inactive |
| 5e | Confinement attestation store state | `~/.local/state/fgos/attestations/` (or `$XDG_STATE_HOME/fgos/attestations`, overridable via `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH`) — host-global security attestation records. Intentionally host-global only (outside all agent write grants) so confined agents can never tamper with their own audit trails, preserving immutable attestation integrity across projects. | one directory, machine-local path | no (created on first confined dispatch attestation) | absent/inactive |
| 5f | Workspace customization folder | `fgos/` at the project root: tracked in the project's own git, written once as a skeleton at onboarding and never edited by fgOS afterwards. Holds the customer's own agent definitions (`fgos/agents/<name>.yaml`), which win over a definition of the same name in the installed set (RUL13 (customer customization lives in one tracked workspace folder)). Read by `--seats @name` (runner decision 0057); the `fgctl init` skeleton is not built yet | directory | no | absent — the installed set alone applies |
| 6 | Config staleness | Whether a config file (project-local or global — same computation, tsk-1ri) already has every setting the current default schema defines | up to date / missing one or more default settings | yes (computed, not stored) | — |
| 7 | Doctor check | One named diagnostic `fgos doctor` reports on | not a fixed list — an extensible registry (`src/setup/registrations.mjs`'s `registerCheck`); a check registration and a config-default registration are independent, never a forced pairing — a module may register only a check, only a config-default, or both. Today's registered checks: `convention-conformance`, `node-version-and-git`, `cli-version-visible` (tsk-2ej), `shell-integration-sourced`, `project-fgos-launcher` (a release install has one fgos launcher on PATH that runs each project's own activated fgos, see RUL17 (one fgos on PATH runs each project's own activated fgos)), `config-not-stale`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-classification-vocabulary`, `work-step-vocabulary` (tsk-64h), `domain-workflow-operations-coverage`, `root-drift`, `delivered-not-on-trunk` (tsk-1l9), `config-awareness`, `provider-capacity-state` (reports account lease/quarantine state and never auto-clears), `credential-copies-retained` (login copies still pending for a renewal after a day, and private homes held after repeated staging failures, counted by provider/account and age; read-only, a held home fails, copies waiting for a renewal only warn; the check itself never deletes and never prints a value), `provider-capacity-lock-stale` (Phase 06 C2c: the provider-capacity state.lock file, if any, is not held by a dead process; read-only, never reclaims), `dependencies-installed`, `gate-bypass-configured`, `claude-plugin-marketplace`, `plugin-skill-cli-reachable`, `plugin-dev-skills-packaged` (tsk-32b), `changelog-unreleased-stale`, `herdr-launcher-configured`, `herdr-web-dashboard-configured` (tsk-48w), `enduser-docs-index-stale` (tsk-1m0), `invariant-checks-configured` (tsk-516), `invocation-git-write-grants` (warns when an invocation or executor still grants a git add or git commit tool; the runner commits, workers only edit files; read-only, never rewrites user config), `worktree-setup-configured` (a present worktreeSetup section is a list of non-empty shell commands every runner-created worktree runs after its dependency install; never executes them), `events-jsonl-not-truncated` (tsk-cgg), `worker-slots-ceiling-usable` (tsk-1oz), `gateway-token-configured` (tsk-4r1), `readme-install-tag-exists` (tsk-2t8), `iron-law-configured` (tsk-1y6-1), `leaf-notify-drift` (tsk-1el), `task-specs-resolve` (tsk-2t9c), `agent-claims-resolve` (tsk-2t9c), `agent-type-names-unique` (tsk-397-12; names unique within each tier fgos/agents, domains/*/agents, core/agents, a higher tier replaces a lower one whole, the fgos/agents files checked for shape), `domain-registry-compiled` (every domain's compiled.json file under domains — the YAML-free form of the registry and workflow YAML the Work lifecycle reads, regenerated by the build:domains npm script; a drift test keeps it equal to the YAML), `dispatch-decide-hook-wired` (tsk-60f; also requires the AskUserQuestion decision-question hook), `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`, `decision-index-stale` (tsk-1lv-2/tsk-1lv), `advise-execute-capabilities-configured` (tsk-2uf-3), `workflow-capabilities-configured` (every capability a core/domain Workflow unit names resolves in runner.capabilities by exact name or bare verb, the way bind() looks it up, and fails when it does not; one that resolves but has no "prefer" pool on either name is reported as a warning because bind() refuses its unit headless; fgos setup registers every shipped Workflow's capabilities as description-only defaults, so a fresh project starts with that warning, and never overwrites a project's own entry), `capability-serves-valid` (I19: every runner.capabilities entry's serves attribute set is well-formed, no two entries declare the identical set, and the review slot is present), `agy-permissions-configured` (tsk-1xm), `agy-sub-homes-configured`, `bwrap-available`, `curl-available` (curl runs, because fgctl init downloads a release through it; a missing curl is a warning that only blocks the download paths, never a failure, see RUL15 (fgctl init downloads a checksum-verified release when no source is given)), `main-checkout-guard-warnings` (tsk-1vc-3), `events-compaction-verified` (tsk-3ve-6), `no-stuck-merge-abort` (tsk-40a), `doc-registry-enforce` (tsk-28x), `doc-registry-stale` (tsk-28x), `doc-alias-broken` (tsk-28x), `doc-active-duplicate` (tsk-28x), `doc-near-duplicate` (tsk-28x), `doc-provisional-aged` (tsk-28x), `doc-topic-oversized` (tsk-28x), `doc-role-underused` (tsk-28x), `doc-source-conservation` (tsk-28x), `doc-current-path-missing` (tsk-3uc), `doc-source-unreachable` (tsk-3uc), `coordination-protocol-fixtures-valid` (retired; confirms legacy definition fixtures retired), `operation-prompt-templates-valid` (Phase 03 I04: every discoverable operation prompt template validates against bounded variables and schema), `coordination-example-requests-valid` (Step 08 Phase 07 R3: published fgos coordination run example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef), `herdr-available`, `trust-store-readable`, `non-claude-trust-stores-readable` (Phase 07 herdr-trust-supervisor R3: every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, using the same reader the live dispatch will use), `confined-pane-accounts` (every confined herdr invocation that binds a private home has an account in the machine-global provider account inventory whose credential files exist, so its pane starts logged in; see RUL65b in the runner spec), `agent-cli-project-trusted` (the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a "Trust this folder?" prompt until its timeout; reads only a yes/no for the one path, names the exact line a person must add, never edits the CLI's config; not applicable when the root is not a git repository or no codex/agy executor is configured), `workflow-pools-satisfy-independence` (for every panel or reviewed Workflow unit, drives the runner's own pattern code through bind() without dispatching anything and fails when the capability prefer pool cannot supply enough distinct provider families for every role (three panelists plus a synthesizer need four); a provider out of quota or blocked on a trust prompt is invisible to bind() and not counted), `blind-steps-use-proven-pools` (for every Workflow unit declared blind, walks each role's candidates through bind() without dispatching anything and fails when the capability prefer pool can bind an executor whose provider family, transport and confinement backend are not in the table of canary-proven pairs kept in the check's own module; read-only, no model call; not applicable when no unit is blind), `executor-confinement` (dispatch visibility V0 Phase 01 group D: the transport an interactive dispatch needs, a readable folder-trust store so a fresh worktree can be pre-trusted instead of stopping at a dialog, and a second reading of the rule that an executor may only declare bypass permission mode alongside full confinement), `herdr-executor-kinds` (Phase 05 R3: every executor dispatched through a herdr pane names an agent kind herdr can actually start, and none depends on an integration hook herdr reports as outdated -- an installed-but-stale hook is believed by herdr and may report the wrong agent state, while a missing one only degrades detection), `executor-profile-warnings` (Phase 06 executor-policy-dispatch-seams: legacy executor/capability entries hardcoding policy-shaped flags, policy-overrides-as-identity, or account-pool-shaped env, each named with its documented migration target -- informational only, never a hard failure), `active-release-matches-checkout` (read-only Node payload contents against doctor dir working tree, not HEAD or Rust binary freshness; reports changed/missing/extra source files while excluding staged dependencies, skips outside source checkouts and main-owned activation in linked worktrees; use fgos:dev for working-tree code or restage/activate for plain fgos), `rust-host-binary-present`, `rust-host-target-supported`, `legacy-node-payload-present`, `command-routes-drift`, `confinement-policies-declared`, `confinement-backend-registry-readable`, `confinement-bwrap-platform`, `confinement-probe-freshness`, `confinement-blind-read` (a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker; reports pass, fail, or backend-unsupported, in which case every blind unit is refused), `confinement-strict-readiness`, `confinement-orphaned-resources-reaped` (Phase 04 M8: no confinement temp resource is left behind by a dead owning process, and no confinement temp root is readable beyond its owner; a home kept for a still-open pane is not orphaned; the fix tightens the root to 0700 and reaps), `confinement-herdr-maturity`, `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `operation-capability-resolves` (Unit I21: every discoverable operation's declared policy.capability resolves against the live runner config, reporting reachable provider-family diversity), `shadow-binder-divergence` (dispatch-engine-liveness-hardening Phase 7 C1: real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded to a local JSONL under .fgos/dispatch/, not only an ephemeral stderr line; informational, never fails), `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage`, `runner-rigor-config` (validates project/global rigor-to-tier mappings and retired capability overrides), `coordination-protocol-dead-vocabulary` (validates definitions against dead vocabulary), `model-policy-tier-coverage` (validates model policies cover all tiers required by rigor-to-tier), `tier-vocabulary-dead-keys` (validates project and global config do not contain retired tier/rigor keys), `runner-patterns-config` (validates presence, valid checkers, and cumulative checkersByRigor for runner patterns), `mutating-assignment-binding-snapshot` (validates that mutating assignment RunResult bindings match unit.json snapshot). The registry is open, but this list is not a snapshot — it names every registered check, and a module adding one updates this row in the same change | yes | — |
| 7b | Doctor fix | One named repair `fgos doctor --fix` can run before re-reporting checks | not a fixed list — an extensible registry (`registerFix`), independent of `registerCheck`/`registerConfigDefault` (per tsk-2cs). Today's registered fixes: `credential-copies-retained` (re-checks private homes held after repeated staging failures, under the account lock, and removes one only when its login is shown applied or obsolete; never removes on age), `gate-bypass-configured` (tsk-2qz, the registry's first entry to register all three capabilities at once), `claude-plugin-marketplace` (tsk-4xg), `enduser-docs-index-stale` (tsk-1m0), `bin-discovery-cache` (tsk-2qc-1), `gateway-token-configured` (tsk-4r1), `iron-law-configured` (tsk-1y6-1), `decision-index-stale` (tsk-1lv-2/tsk-1lv), `agy-permissions-configured` (tsk-1xm), `no-stuck-merge-abort` (tsk-40a), `doc-registry-stale` (tsk-28x), `confinement-backend-registry-readable`, `confinement-orphaned-resources-reaped` (Phase 04 M8), `instruction-projections-stale`, `coordination-abandoned-claims`, `runner-coordination-orgPolicy-shape`, `project-fgos-launcher`, `dispatch-decide-hook-wired`, `codex-hook-wired`, `agy-hook-wired`, `omp-hook-wired`, `pi-hook-wired`. Same rule as #7: the registry is open, but this list names every registered fix and a module adding one updates this row in the same change | yes | — |
| 8 | Output rendering mode | How `fgos setup`/`fgos doctor` present their result | enveloped JSON (every other verb's shape, unchanged) / colored plain text (`--pretty`) | yes | enveloped JSON |
```

### claim_97479b13a60800e856813bfd4f0cbb78

Old identity: docs/specs/runner.md#unheaded-block-144
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-148
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_50dca4885019ac5125d941ea5a86f448

Old identity: docs/specs/runner.md#unheaded-block-149
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-153
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_07ae72c4d2c93884a120cf2ca12250a8

Old identity: docs/specs/runner.md#unheaded-block-161
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-165
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_211f0b98400863f2a0e9b9cdaa2259fe

Old identity: docs/specs/runner.md#unheaded-block-170
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-174
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_1d8baa1def0cea7595b62de99846b489

Old identity: docs/specs/runner.md#unheaded-block-235
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-239
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_012bfa2639fb107eeb3baee4fb502f54

Old identity: docs/specs/runner.md#unheaded-block-244
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-248
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_99806d8b21d05eb7a8e8744d765bea00

Old identity: docs/specs/runner.md#unheaded-block-268
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-272
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_a6f43d98b3eebe97802fd01a4ac7863b

Old identity: docs/specs/runner.md#unheaded-block-280
Old unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Successor: docs/specs/runner.md#unheaded-block-284
Current unit digest: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown old SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104
Shown current SHA256: 95a357e29712c3c07eb935e2ea3696e77fd85d475bec04c6872e6ebdf495b104

Full old unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

Full current successor unit/section:
```text
Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
```

### claim_b91c86788522c3516bef2c7bab859093

Old identity: docs/specs/runner.md#unheaded-block-79
Old unit digest: a72d8937e06c1393d29237a78645c521fdf0e95a0e4ab77c5d459969af038254
Successor: docs/specs/runner.md#unheaded-block-79
Current unit digest: 661c9e16abe9ed411801ccbaec1066f2cabe3fbc6dc11197bda2def6cbed3df7
Shown old SHA256: a72d8937e06c1393d29237a78645c521fdf0e95a0e4ab77c5d459969af038254
Shown current SHA256: 661c9e16abe9ed411801ccbaec1066f2cabe3fbc6dc11197bda2def6cbed3df7

Full old unit/section:
```text
`execute --for <purpose>` (cửa CLI/con người duy nhất vào purpose door không lease/fallback) đã RÚT hẳn, xác nhận 0 live caller thật (chỉ có 1 proof sweep lịch sử của Confinement Authority, không phải traffic sản xuất) — `execute --for` giờ refuse thẳng, chỉ tên đúng pattern 2 phase mà mọi caller thật đã dùng: `decide --for <purpose>` giải purpose ra executor id thật trước, rồi `execute <id đó>` mới dispatch theo vị trí. `decide --for` và tham số `for` riêng của `executeExecutorCli` (dùng bởi `spawnWorker` và caller lập trình khác, không phải flag CLI) không đổi.
```

Full current successor unit/section:
```text
`execute --for <purpose>` (cửa CLI/con người duy nhất vào purpose door không lease/fallback) đã RÚT hẳn, xác nhận 0 live caller thật (chỉ có 1 proof sweep lịch sử của Confinement Authority, không phải traffic sản xuất) — `execute --for` (không kèm executor) giờ refuse thẳng — RUL76 (`execute <id> --for <capability>`: caller nêu posture) mở lại riêng dạng `execute <id> --for <capability>` để mang posture sang phase 2 — chỉ tên đúng pattern 2 phase mà mọi caller thật đã dùng: `decide --for <purpose>` giải purpose ra executor id thật trước, rồi `execute <id đó>` mới dispatch theo vị trí. `decide --for` và tham số `for` riêng của `executeExecutorCli` (dùng bởi `spawnWorker` và caller lập trình khác, không phải flag CLI) không đổi.
```

### claim_76d404ea624a10455d7a14debe2b2a95

Old identity: docs/specs/runner.md#unheaded-block-9
Old unit digest: 9070d65058bf41570d8fb1fbaef63f8decdc54c10b932c90d069a15d5f780677
Successor: docs/specs/runner.md#unheaded-block-9
Current unit digest: daf2341d585c13bd3e7f44184eb0b61402e41abf7ac9ae8a987b200a83f51c9e
Shown old SHA256: 9070d65058bf41570d8fb1fbaef63f8decdc54c10b932c90d069a15d5f780677
Shown current SHA256: daf2341d585c13bd3e7f44184eb0b61402e41abf7ac9ae8a987b200a83f51c9e

Full old unit/section:
```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian một worker · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`. Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

Full current successor unit/section:
```text
| # | Element | Meaning | Values | Required | Default |
|---|-------|---------|--------|----------|---------|
| 1 | Cấu hình runner (file committed ở gốc repo) | Chính sách thực thi — LÀ CONFIG THỰC THI ĐƯỢC: ai sửa nó điều khiển tiến trình được spawn (đầu vào tin cậy) | `executor` — mẫu lệnh gọi trợ lý (thay thế `{prompt}`/`{model}` theo từng phần tử, không bao giờ qua shell), tùy chọn `adapter` (mặc định `cli-spawn`) · `executors` — catalog executor theo danh tính provider/cách gọi, không mang khẩu vị chất lượng · `modelPolicies` — bảng bắt buộc provider→tier→model với tier cung `nano|mini|standard|advanced|flagship|frontier` · `rigorToTier` — bảng bắt buộc ánh xạ đủ bốn mức cầu `low|standard|high|critical` sang tier cung · `capabilities.<name>.rigor` — sàn cầu tùy chọn, chỉ nâng; khối `capabilities.<name>.overrides` bị từ chối · `timeoutMs` — trần thời gian một worker · `confinement`/`confinementPolicies` — chính sách giam giữ · `capabilities` — catalog lời hứa hành vi và binding executor/invocation | yes | tự sinh khi vắng mặt tại đường dẫn mặc định (không kèm `--config`); `fgos setup` điền `rigorToTier`, `fgos doctor` kiểm bảng này và các khoá placement đã retired; một `--config <path>` tường minh trỏ vào đường vắng mặt vẫn báo lỗi ngay |
| 1b | Provider-capacity inventory/state (slice 1) | Pool account cho một provider agent CLI khi provider đó có quota/capacity theo account. Inventory là machine-local secret-bearing config, không phải project policy; state/lease/quarantine là runtime-local evidence. | Inventory chỉ đọc từ `~/.fgos/config.json` tại `runner.providers.<provider>.accounts.<accountId>`; account là keyed object, không phải array. Slice 1 hỗ trợ `openai-codex` account với `label?` và `credentialSource: { kind: "codex-home", home }`; nay mỗi account khai đúng một trong `credentialSource` (một store cho mọi CLI, kind `codex-home` hoặc `home-files`) hoặc `credentialSources` (một store cho mỗi CLI, key là tên lệnh `codex`/`pi`/`omp`/`agy`; RUL80 (account trước, CLI sau: một login store cho mỗi CLI)). Account entry bị từ chối nếu khai placement/runtime policy (`executor`, `capability`, `model`, `modelTier`, `mutation`, `confinement`, `tool`, `fallback`, `runtimeClass`, `providerRuntimes`, ...). Project-local `.fgos/config.json` bị từ chối nếu chứa `runner.providers.*.accounts`. State ở `~/.fgos/runtime/provider-capacity/state.json`, lock ở `~/.fgos/runtime/provider-capacity/state.lock`. | no | vắng inventory nghĩa là mọi dispatch giữ hành vi cũ, không selection/lease |
| 2 | Nhánh đề xuất | Không gian kết quả của một worker, tên mang tiền tố nhận diện `fgw/<id>` | — | — | — |
| 3 | Bảng phục hồi | Lớp-lỗi → hành-động, máy đọc được | 8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi → hành động ∈ thử-lại (có trần) / đỗ-lại / dừng; lớp LẠ → dừng (an toàn trước) | — | — |
| 4 | Bộ đếm chống-lặp (lifetime) | visitCount: số lần một việc vào `doing` TÍNH TỪ ĐẦU đời việc — dẫn xuất từ nhật ký sự kiện, không trường mới; dùng cho các bản ghi outcome/metric đã ship (KHÔNG dùng để chặn dispatch nữa — xem #4b) | — | — | — |
| 4b | Ngân sách cổng chống-lặp (kể từ can thiệp người) | visitsSinceLastHumanEvent: số lần việc vào `doing` **ở stage executing** TÍNH TỪ sự kiện người CUỐI CÙNG của chính việc đó — đây là con số CỔNG dùng để chặn/park dispatch (thay `visitCount` ở vai trò này); một can thiệp người (xem trigger-set) đưa ngân sách về lại đủ 3 cho vòng kế tiếp. Executing-phase-only scoping (claim-lock): trước đây, pick/take chỉ mở frontier (executing-phase), nên counting mọi `todo→doing` move tương đương dispatch attempts. Claim-lock cho phép `pick` cầm stage khác — claim-release cycle ở các stage đầu vòng (`discovery`/`exploring`/`planning`, cộng tên di sản `decompose`) không được tính vào ngân sách executing-phase (per claim-lock code-review finding) | — | — | trần mặc định 3, dùng chung `MAX_VISITS` |
| 5 | Cầu dao (breaker) | Số lần chấm-trượt liên tiếp trong MỘT lần chạy (bộ nhớ trong phiên, không dẫn xuất từ nhật ký — chủ đích, vì nhật ký không phân biệt người/máy ghi); trần mặc định 3, đếm RIÊNG cho từng việc dưới dispatch song song (một việc chấm-trượt không kéo cầu dao của việc khác). **Trơ trong `--once`:** một việc đỗ lại (park) tối đa sau `maxRetries` (mặc định 2) lần thử trong CÙNG một lượt `--once`, nên không bao giờ chạm trần 3 của cầu dao trong một lượt đơn — cầu dao chỉ có thể kéo khi có một cơ chế chia-sẻ/nhiều-lượt tích luỹ miss xuyên lượt (chưa xây, xem Open Gaps) | — | — | — |
| 6 | Trần song song hai tầng | Giới hạn số việc chạy đồng thời trong một mẻ, đọc từ cấu hình committed | tầng 1 — số việc GỐC đồng thời; tầng 2 — số việc CON đồng thời trong MỖI gốc; mỗi lần nạp mẻ lấy `min(trần, số việc sẵn-sàng sau lọc quyền-sở-hữu-gốc)` | no (có mặc định) | 4 gốc × 4 con mỗi gốc |
| 7 | Quyền sở-hữu gốc | Ai đang cầm mọi việc CON của một gốc trong MỘT lượt chạy — gắn lúc con đầu tiên của gốc được nhận, xả khi gốc xong; sống trong bộ nhớ của lượt chạy, KHÔNG bền qua lượt chạy khác/tiến trình khác | một định danh (per lượt chạy) | — | chưa-chủ |
| 8 | Bản ghi output cục bộ (một file mỗi việc) | Lưu lại output của trợ lý cho MỌI lượt dispatch của một việc — đọc được sau khi console đã cuộn qua; không bao giờ vào cây committed. Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối | mỗi khối kết-cục: dấu thời gian, số lần thử, loại kết cục (đề xuất/quá-giờ/hỏng-spawn/…), output (khi trợ lý kịp sinh ra); xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến | no (chỉ tồn tại sau lượt dispatch đầu tiên của việc) | — |
| 9 | Candidate (Gate A, self-improve loop STR13 Slice 1) | Một việc mang ít nhất một bản ghi friction chưa ngã-ngũ, xếp hạng làm ứng viên tự cải thiện — dẫn xuất TỪ friction đã ghi, không phải một bản ghi độc lập, không bền qua lần `evolve` khác | id, disposition, errorClass, layer, detail, attempts (tất cả lấy từ bản ghi friction MỚI NHẤT theo dấu thời gian của id đó khi id có nhiều bản ghi chưa ngã-ngũ), score (cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, không chỉ bản mới nhất) | — | dẫn xuất mỗi lần gọi `evolve` |
| 10 | Phán quyết Iron Law (self-improve loop STR13 Slice 2/3) | Kết quả của phép tính hai-cửa (module + từ khóa) trên MỘT candidate fix — dẫn xuất thuần từ đầu vào truyền vào, không bền. Gọi từ bên trong `approve` nguồn `runner` (Cổng duyệt PR nội bộ), ngay trước bước kiểm cây sạch, cho MỌI đề xuất nguồn runner đang land LÊN TRUNK (thu hẹp về ranh giới trunk per `0032`) — xem "Cổng duyệt PR nội bộ" và "Iron Law" dưới, Business Rules RUL36 (`evolve --submit` là hành động ghi duy nhất trên bề mặt evolve, tái dùng chính cửa `submit`)/RUL37 (Iron Law hỏi ở đúng một ranh giới — trunk — cho mọi đề xuất nguồn runner tới đó)/RUL64 (`ironLaw.level` — key config riêng của cổng Iron Law, fail-closed về `ask`) | required (có/không cần chứng minh test-đỏ-trước), matchedFlags (danh sách từ khóa rủi ro nặng khớp trong mô tả fix), matchedModules (danh sách file khớp danh sách module minh họa) | — | required mặc định `false` khi cả hai phép thử đều không khớp |
| 11 | Prompt template worker (STR49, `src/runner/prompt-templates/`) | Nội dung chữ nghĩa của `buildPrompt`, tách khỏi code sang file committed — sửa prompt là sửa MỘT file, không đụng code | `selectTemplate({kind, tier, domain})` — bảng luật cơ học, wildcard cuối luôn khớp (từ STR91: luật `domain: 'coding'` khớp TRƯỚC wildcard — domain vắng mặt hay không nhận diện được đều fold về `coding` giống mọi nơi khác trong hệ, không phải một fallback riêng — trỏ `worker-prompt-skill-pointer.txt`; mọi domain đã đăng ký khác `coding` (vd `synthetic`) vẫn rơi về wildcard, trỏ `worker-prompt-default.txt` như trước STR91) · `renderTemplate` — substitution `{placeholder}` string-replace thuần, không engine · `hashTemplate` — sha256 nội dung raw file, ghi kèm dispatch log (xem RUL44 (đã xây — STR49, `src/runner/prompt-templates.mjs`)) · template `worker-prompt-skill-pointer.txt` giữ đủ 6 mục cố định sẵn có, CHỈ thêm đúng một mục `# Agent skill` trỏ `SKILL.md` của domain đó — đường dẫn luôn resolve qua sổ đăng ký domain→skill (`skillForStage`, spec Work-State "Mô hình domain"), không bao giờ hardcode (xem RUL52 (luật template theo domain `coding` khớp trước wildcard; domain lạ/vắng mặt fold về `coding`)) | yes (một template mặc định luôn có) | `worker-prompt-default.txt`, `worker-prompt-skill-pointer.txt` |
```

## Machine re-pin rows

For each entry below, compare the original committed receipt with the new immutable receipt: restore only evidence.commit and changed citation blob/range fields; the complete object must equal the original. For each changed range, old/new cited text must equal and its SHA256 must equal excerptDigest. Original report pins and notes are preserved in evidence accounting. These rows require machine verification, not code truth judgment.

### Re-pin claim_39e4f58e68986802a16d978b42f5a1db

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: 38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8
Shown digest: 38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8

Complete shown candidate text:
```text
A requested screen is the second stage of the sample, not another death read.
`evaluateLadder` emits `provider-limit` for credential/quota screen matches.
Its pane fate is `keep-always`; `paused-limit` remains a recognized alias.
Keep all failure panes by default; both limit outcomes survive automated
`closeAlways` (`liveness.mjs:93-109`). Operator destructive intent is separate
and guarded. Never infer Run completion from `agent_status` or pane idleness;
the ladder settles on the result file, which still requires normalization
(`liveness.mjs:238-246`).
```


Cited file: src/runner/dispatch/herdr-round.mjs
Old: 2409e8c6ca41a473e88bcdd9ef81e51760d93e37:351-369
New: 0cebf531509a9b6d0f9047e0ab25fd63eb7d6492:352-370
Unchanged excerpt SHA256: fcf68e268844e4680f66cb745565474ba85adab1155f7682b2f4e22e0114debf

```text
/**
 * The ladder's outcome is the precise answer; `errorClass` stays the coarse
 * vocabulary `recovery.mjs` matches on, so the recovery matrix keeps working
 * unchanged. A caller that wants the real reason reads `outcome`.
 *
 * A known seam, stated rather than hidden: `blocked` and `paused-limit` both
 * map to `worker-timeout`, so the matrix will retry them like any other
 * timeout even though neither is worth retrying immediately. Fixing that
 * means giving the matrix its own entries, which belongs with Run truth, not
 * with the adapter.
 */
const ERROR_CLASS_FOR_OUTCOME = Object.freeze({
  died: 'worker-spawn-fail',
  blocked: 'worker-timeout',
  'timed-out-idle': 'worker-timeout',
  'timed-out-ceiling': 'worker-timeout',
  'paused-limit': 'worker-timeout',
  'provider-limit': 'worker-timeout',
});
```

### Re-pin claim_e134b71a09a0a8fd7c62eef87959daf4

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9
Shown digest: 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9

Complete shown candidate text:
```text
Current durable Run admission and attempt accounting are implemented in
`src/runner/dispatch/assignment-runner.mjs:672-783`. Retry attempts retain the
Assignment and previous evidence; observer restarts are not a fresh semantic
request. Exact admission caps must come from that implementation/effective
contract, not a retired session retry declaration.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

### Re-pin claim_c7c1506a1c8d6e7bfe85935c0868d924

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b
Shown digest: 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b

Complete shown candidate text:
```text
The older Work-runner recovery matrix separately uses
`DEFAULT_MAX_RETRIES = 2` (`src/runner/recovery.mjs:91`).
Its claim-attempt counter is not interchangeable with every Assignment
admission counter.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

### Re-pin claim_95d630cee33a4aee7d6a44e1e0a3c4a9

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad
Shown digest: 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad

Complete shown candidate text:
```text
The proposed `maxAttemptsPerAssignment`/`maxAttemptsPerExecutor` policy and
unique primary-plus-fallback candidate list are not accepted current config
fields or a shipped universal default. `fallbackExecutors` is recorded but
reserved-not-executed by the Assignment policy resolver
(`assignment-policy.mjs:380-388`). Current Execution Core quota fallback uses
its own binding/replacement path; this proposal must not claim the old session
`maxRetries` mechanism still schedules it.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

### Re-pin claim_7731fbd40c6c0d51f94c7e55b93c0925

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e
Shown digest: eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e

Complete shown candidate text:
```text
Future unified caps would count admitted attempts, including pre-launch
failure, preserve counts across executors and reject exhaustion before another
admission. This is a design requirement, not proof that the proposed two-attempt,
one-attempt-per-executor schema is implemented.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

### Re-pin claim_4ec4e0906acc7fb09ca51129030e7230

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785
Shown digest: dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785

Complete shown candidate text:
```text
`taskSpecForStep` selects the primary normalized `step.operations` entry (or the
first); `skillForStep` reads `step.skill` separately and falls back to a declared
status skill (`src/workflow/steps.mjs:52-64`). Neither projects both values from
an operation. Compatibility remains a projection, not permission to weaken the
mandatory declared-operation, transition or evidence constraints. The existing
`operationsForStep`/`isLegalStepMove` projections preserve declared legality
(`steps.mjs:44-45,67-85`); they do not restore the retired Work-stage or engine.
```


Cited file: src/runner/operation-choice.mjs
Old: 7ccfd74c289cc74fb7f7122ea4a7b545a9101156:733-761
New: 24f523dbfb0290b451491ba0b98f9b4672e20e7a:735-763
Unchanged excerpt SHA256: a9acfef8825e627bf2a94a49eca167c3a4bbd8d73515b5812bd5377c8f734902

```text
  const ops = availableOperations ?? operationsForStep(getDomain(resolvedDomain), currentStage, work?.kind);

  if (!ops || ops.length === 0) {
    return Object.freeze({
      operation: null,
      reason: 'no-operations-available',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  const primaryOp = ops.find((o) => o.primary) ?? ops[0];

  const explicitRequestedOp =
    (typeof contextSignals.nextOperation === 'string' && contextSignals.nextOperation.trim() ? contextSignals.nextOperation.trim() : null) ??
    (typeof work?.nextOperation === 'string' && work.nextOperation.trim() ? work.nextOperation.trim() : null) ??
    (typeof contextSignals.secondaryOperation === 'string' && contextSignals.secondaryOperation.trim() ? contextSignals.secondaryOperation.trim() : null) ??
    (typeof work?.secondaryOperation === 'string' && work.secondaryOperation.trim() ? work.secondaryOperation.trim() : null) ??
    (typeof work?.operation === 'string' && work.operation.trim() ? work.operation.trim() : null);

  if (explicitRequestedOp && !ops.some((o) => o.id === explicitRequestedOp)) {
    return Object.freeze({
      operation: explicitRequestedOp,
      reason: `undeclared-stage-operation-${explicitRequestedOp}`,
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
```

### Re-pin claim_c38104d8972032b3b20db9bca5321871

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be
Shown digest: f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be

Complete shown candidate text:
```text
This compatibility path remains mandatory for Work-attached declared workflows.
Adding an agent-led path must not weaken or reinterpret it. The current Work
driver resolves the legal normalized operations, preserves their primary default
and refuses an undeclared request (`src/runner/operation-choice.mjs:733-761`);
declared Assignment creation independently requires a legal operation and its
TaskSpec (`src/runner/dispatch/assignment.mjs:328-345`). These are primary
compatibility and legality obligations, not a revival of the retired engine.
```


Cited file: src/runner/operation-choice.mjs
Old: 7ccfd74c289cc74fb7f7122ea4a7b545a9101156:733-761
New: 24f523dbfb0290b451491ba0b98f9b4672e20e7a:735-763
Unchanged excerpt SHA256: a9acfef8825e627bf2a94a49eca167c3a4bbd8d73515b5812bd5377c8f734902

```text
  const ops = availableOperations ?? operationsForStep(getDomain(resolvedDomain), currentStage, work?.kind);

  if (!ops || ops.length === 0) {
    return Object.freeze({
      operation: null,
      reason: 'no-operations-available',
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
  }

  const primaryOp = ops.find((o) => o.primary) ?? ops[0];

  const explicitRequestedOp =
    (typeof contextSignals.nextOperation === 'string' && contextSignals.nextOperation.trim() ? contextSignals.nextOperation.trim() : null) ??
    (typeof work?.nextOperation === 'string' && work.nextOperation.trim() ? work.nextOperation.trim() : null) ??
    (typeof contextSignals.secondaryOperation === 'string' && contextSignals.secondaryOperation.trim() ? contextSignals.secondaryOperation.trim() : null) ??
    (typeof work?.secondaryOperation === 'string' && work.secondaryOperation.trim() ? work.secondaryOperation.trim() : null) ??
    (typeof work?.operation === 'string' && work.operation.trim() ? work.operation.trim() : null);

  if (explicitRequestedOp && !ops.some((o) => o.id === explicitRequestedOp)) {
    return Object.freeze({
      operation: explicitRequestedOp,
      reason: `undeclared-stage-operation-${explicitRequestedOp}`,
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
```

### Re-pin claim_3c55901c64cdf2f99a36062302427fcb

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 40e8420ecedfdc8389c27e6a3e7b8446da8062301b6a306fd601f59de579c8fd
Shown digest: d6dfa94679cf29d1dc8f8f53e24f9560ed39967f74c7d05120b737507bad33f7

Complete shown candidate text:
```text
## 2. Identity And Existing Reality

| Identity | Owner | Current evidence and design consequence |
|---|---|---|
| Track/cell | Consuming track/domain harness | A manual-harness convention, not a universal core entity or current session-chain API. See the owner-retained operating harness and its trace contract. |
| Assignment | Assignment builder/store | Immutable semantic task; execution attempts are separate Run records. |
| Run | Dispatch runtime | One attempt, deterministic identity, eligibility and settlement; retry retains Assignment. |

The former session-owned workUnits/chain correlation proposal is preserved in the complete historical snapshot. It is not a current execution identity or acceptance owner. Current Run admission and recovery retain the Assignment/Run identities above.
```


Cited file: src/runner/dispatch/confinement/authority.mjs
Old: 7c75f05f2d7a7e78c41d9e6a596cfd00801fc89e:1608-1629
New: 108bc881ea0071faa91b75eb696bd7319bf772c0:1611-1632
Unchanged excerpt SHA256: 8b21b0133b721561369245ae1d630020546528a156e39638c72feec76ae3ed0c

```text
  if (adapterName === 'herdr-spawn') {
    // Must be the exact same normalization the launch call itself applies
    // (herdr-round.mjs's `agentName`) -- otherwise a long runId/
    // launchCommandId records an un-truncated herdrName here while herdr
    // actually starts the truncated one, and `agentGet(command.herdrName)`
    // misses even a live, healthy worker.
    const herdrName = normalizeAgentName(`fgos-${launchContext.run.runId}-${launchCommandId}`);
    const commandsDir = path.join(runDir, 'controller', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const launchCommandPath = path.join(commandsDir, `${launchCommandId}.json`);

    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    let existingCmd = null;
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === launchContext.run.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new DispatchError('launch-collision', `launch command for run ${launchContext.run.runId} already exists as ${existing.launchCommandId}`, {
              code: 'launch-collision',
              runId: launchContext.run.runId,
              existingCommandId: existing.launchCommandId,
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_edf9b5d6a4118579e66fcdedf2a0e66a

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad
Shown digest: 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad

Complete shown candidate text:
```text
| Identity | Owner | Current evidence and design consequence |
|---|---|---|
| Track/cell | Consuming track/domain harness | A manual-harness convention, not a universal core entity or current session-chain API. See the owner-retained operating harness and its trace contract. |
| Assignment | Assignment builder/store | Immutable semantic task; execution attempts are separate Run records. |
| Run | Dispatch runtime | One attempt, deterministic identity, eligibility and settlement; retry retains Assignment. |
```


Cited file: src/runner/dispatch/confinement/authority.mjs
Old: 7c75f05f2d7a7e78c41d9e6a596cfd00801fc89e:1608-1629
New: 108bc881ea0071faa91b75eb696bd7319bf772c0:1611-1632
Unchanged excerpt SHA256: 8b21b0133b721561369245ae1d630020546528a156e39638c72feec76ae3ed0c

```text
  if (adapterName === 'herdr-spawn') {
    // Must be the exact same normalization the launch call itself applies
    // (herdr-round.mjs's `agentName`) -- otherwise a long runId/
    // launchCommandId records an un-truncated herdrName here while herdr
    // actually starts the truncated one, and `agentGet(command.herdrName)`
    // misses even a live, healthy worker.
    const herdrName = normalizeAgentName(`fgos-${launchContext.run.runId}-${launchCommandId}`);
    const commandsDir = path.join(runDir, 'controller', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const launchCommandPath = path.join(commandsDir, `${launchCommandId}.json`);

    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    let existingCmd = null;
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === launchContext.run.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new DispatchError('launch-collision', `launch command for run ${launchContext.run.runId} already exists as ${existing.launchCommandId}`, {
              code: 'launch-collision',
              runId: launchContext.run.runId,
              existingCommandId: existing.launchCommandId,
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_c4ccebca77d2e1f1240fb4a3588803bd

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6
Shown digest: 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6

Complete shown candidate text:
```text
The former session-owned workUnits/chain correlation proposal is preserved in the complete historical snapshot. It is not a current execution identity or acceptance owner. Current Run admission and recovery retain the Assignment/Run identities above.
```


Cited file: src/runner/dispatch/confinement/authority.mjs
Old: 7c75f05f2d7a7e78c41d9e6a596cfd00801fc89e:1608-1629
New: 108bc881ea0071faa91b75eb696bd7319bf772c0:1611-1632
Unchanged excerpt SHA256: 8b21b0133b721561369245ae1d630020546528a156e39638c72feec76ae3ed0c

```text
  if (adapterName === 'herdr-spawn') {
    // Must be the exact same normalization the launch call itself applies
    // (herdr-round.mjs's `agentName`) -- otherwise a long runId/
    // launchCommandId records an un-truncated herdrName here while herdr
    // actually starts the truncated one, and `agentGet(command.herdrName)`
    // misses even a live, healthy worker.
    const herdrName = normalizeAgentName(`fgos-${launchContext.run.runId}-${launchCommandId}`);
    const commandsDir = path.join(runDir, 'controller', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const launchCommandPath = path.join(commandsDir, `${launchCommandId}.json`);

    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    let existingCmd = null;
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === launchContext.run.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new DispatchError('launch-collision', `launch command for run ${launchContext.run.runId} already exists as ${existing.launchCommandId}`, {
              code: 'launch-collision',
              runId: launchContext.run.runId,
              existingCommandId: existing.launchCommandId,
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_67592e838ebefa5d77fb98b4af14e367

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: b54abb5801b4e539ddd8dc29f1135d06a751a9833cd45a7fd27e72aff7b63cd6
Shown digest: 097936745e3bd24722d05d5c02697903f13d2e8a95e1e7c7cee804833dfdaf68

Complete shown candidate text:
```text
## 6. Local Concurrency And Durability

Control acquisition must not reclaim a live process merely because TTL expired.
Holder identity is `{hostId, bootId, pid, processStartTime}` of the process doing
control, not a guessed Rust parent. Unknown liveness is not dead. A dead holder
may leave a remotely queued command: successor first reconciles pending control.

Implemented (Phase 02 H1, `src/runner/dispatch/run-lock.mjs`): holder identity
is `{id, pid, bootId, processStartTime, host}` (`buildRunControlHolder`,
`host` in place of this section's `hostId`), and `resolveHolderLiveness`
encodes the reclaim decision above as a table — a live pid, a pid whose
liveness cannot be disproven (unreadable `/proc/<pid>/stat`), or a pre-H1
holder record with no `processStartTime` to cross-check all resolve to
`held`, never `dead`; only a genuinely dead pid, a pid reused by a different
process (`processStartTime` mismatch), or a `bootId` predating the current
boot resolve to `dead`.

Recommended local implementation for safe reclaim without unlink races:
one per-scope lock directory containing immutable generation records and
token-specific release markers. Contenders publish generation `g+1` only after
`g` is released or its exact process identity is proven dead. Exactly one wins
exclusive publication. Never unlink/overwrite an earlier generation during
acquire/release, so a delayed release cannot delete its successor. A live holder
never self-recognizes a second concurrent acquisition as reentrant. Generation
records are retained with the runtime/session artifacts; compaction is offline
only after the scope is quiescent.

The proposed durability profile requires a fully written/fsynced temp file in
the same directory, atomic non-overwriting publication and directory fsync.
It calls for temp+rename+directory fsync under the owning lock for replacement.
Those are design requirements; the implementation's best-effort directory
fsync and other limits are stated below, not silently promoted to guarantees.
Current terminal `result.json` is published by `publishImmutableProof`
(`settlement.mjs:434`), not the mutable writer. `run.json` updates, the
effective-execution-contract projection and bookkeeping markers use their
mutable/marker writers. An unreadable existing result refuses relaunch rather
than overwriting evidence. The proof helper fsyncs the file, hard-links it
without overwrite, treats `EEXIST` as an existing proof and rethrows other link
errors; directory fsync is best-effort (`proof-helpers.mjs:73-125`).
A dedicated unsupported-filesystem diagnostic/doctor probe is a design
requirement, not an implemented check. No distributed lease, background
renewal service or TTL-only takeover is required by this local design.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1003-1026
New: 7f90571424dd6fded8e890d1494c522f180ea153:1023-1046
Unchanged excerpt SHA256: 7f27cce5363aa80780f510cad748a286208913e4cb9370a6644cba1fdd28c4a5

```text
  const runMetaPath = path.join(stagingDir, 'run.json');
  fs.writeFileSync(runMetaPath, `${JSON.stringify(runMeta, null, 2)}\n`);
  fsyncFileBestEffort(runMetaPath);

  if (buildDispatchPlan) {
    const dispatchPlan = buildDispatchPlan(record);
    if (dispatchPlan) {
      const dispatchPlanPath = path.join(stagingDir, 'dispatch-plan.json');
      fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(dispatchPlan, null, 2)}\n`);
      fsyncFileBestEffort(dispatchPlanPath);
    }
  }

  if (buildEffectiveContractOpt) {
    const effectiveContract = buildEffectiveContractOpt(record);
    if (effectiveContract) {
      const contractPath = path.join(stagingDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
      publishMutableProjection(contractPath, effectiveContract);
    }
  }
  fsyncDirBestEffort(stagingDir);

  try {
    fs.renameSync(stagingDir, runDir);
```

### Re-pin claim_eb8aa75ad4ff996ab1f5f477c6bbb630

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4
Shown digest: fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4

Complete shown candidate text:
```text
No distributed lease, live session transfer, shared chain-budget allocator,
health scoring store or generic business-effect ledger is implemented here.
Current recovery plans park or request authority for unsafe/unknown cases;
do not infer a universal typed unsupported enum from this design.
```


Cited file: src/runner/dispatch/confinement/authority.mjs
Old: 7c75f05f2d7a7e78c41d9e6a596cfd00801fc89e:1608-1629
New: 108bc881ea0071faa91b75eb696bd7319bf772c0:1611-1632
Unchanged excerpt SHA256: 8b21b0133b721561369245ae1d630020546528a156e39638c72feec76ae3ed0c

```text
  if (adapterName === 'herdr-spawn') {
    // Must be the exact same normalization the launch call itself applies
    // (herdr-round.mjs's `agentName`) -- otherwise a long runId/
    // launchCommandId records an un-truncated herdrName here while herdr
    // actually starts the truncated one, and `agentGet(command.herdrName)`
    // misses even a live, healthy worker.
    const herdrName = normalizeAgentName(`fgos-${launchContext.run.runId}-${launchCommandId}`);
    const commandsDir = path.join(runDir, 'controller', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const launchCommandPath = path.join(commandsDir, `${launchCommandId}.json`);

    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    let existingCmd = null;
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === launchContext.run.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new DispatchError('launch-collision', `launch command for run ${launchContext.run.runId} already exists as ${existing.launchCommandId}`, {
              code: 'launch-collision',
              runId: launchContext.run.runId,
              existingCommandId: existing.launchCommandId,
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_260feeee6a60be662bdda8b9b7666412

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92
Shown digest: 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92

Complete shown candidate text:
```text
Operation-specific grants/effect policies must be supplied by their owner;
no adapter may infer permission to duplicate external effects. Live-process
force-release is not a current local-lock capability.
```


Cited file: src/runner/dispatch/confinement/authority.mjs
Old: 7c75f05f2d7a7e78c41d9e6a596cfd00801fc89e:1608-1629
New: 108bc881ea0071faa91b75eb696bd7319bf772c0:1611-1632
Unchanged excerpt SHA256: 8b21b0133b721561369245ae1d630020546528a156e39638c72feec76ae3ed0c

```text
  if (adapterName === 'herdr-spawn') {
    // Must be the exact same normalization the launch call itself applies
    // (herdr-round.mjs's `agentName`) -- otherwise a long runId/
    // launchCommandId records an un-truncated herdrName here while herdr
    // actually starts the truncated one, and `agentGet(command.herdrName)`
    // misses even a live, healthy worker.
    const herdrName = normalizeAgentName(`fgos-${launchContext.run.runId}-${launchCommandId}`);
    const commandsDir = path.join(runDir, 'controller', 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const launchCommandPath = path.join(commandsDir, `${launchCommandId}.json`);

    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    let existingCmd = null;
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === launchContext.run.runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new DispatchError('launch-collision', `launch command for run ${launchContext.run.runId} already exists as ${existing.launchCommandId}`, {
              code: 'launch-collision',
              runId: launchContext.run.runId,
              existingCommandId: existing.launchCommandId,
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_6b9d77ea4dcd08cde0c9003939ebc000

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1
Shown digest: 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1

Complete shown candidate text:
```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/contracts/assignment-run-runresult.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_d375b290e2ac560a3ea02781d5715e7b

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b
Shown digest: d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b

Complete shown candidate text:
```text
The implementation column below bounds the retained text. Proposed typed interfaces, acceptance scenarios and target-state rules are design obligations, not claims that those interfaces already exist. Historical names in examples are not revived APIs.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_c7d3e8ef6acdffb1b08e61d5b5bd4d9a

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65
Shown digest: 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65

Complete shown candidate text:
```text
Current construction has three provenance kinds:
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_456ad50a7253122ec3610059e0779e03

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09
Shown digest: 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09

Complete shown candidate text:
```text
1. declared Workflow step operation/TaskSpec;
2. validated inline contract and applicable registered domain harness;
3. Unit-run execution and its computed binding.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_59f6314467565caef24f13c7338a59be

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21
Shown digest: fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21

Complete shown candidate text:
```text
Proposed phase vocabulary, not a claim that the writer persists every transition:
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_041ac1009b965096340a81e9c4503cdc

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c
Shown digest: de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c

Complete shown candidate text:
```text
| Phase | Meaning | Must hold before entering |
|---|---|---|
| `admitted` | Run record durably written: `runId`, `assignmentId`, `attempt`, resolved DispatchPlan. | No runtime resource exists yet. `runId` is the launch identity used to reconcile crashes and orphaned runtimes; it is deterministic per (Assignment, attempt). |
| `launched` | The runtime adapter created a runtime resource (pane, process, job). | An admitted Run. A runtime found without an admitted Run is an orphan: reconcile it by `runId`, never adopt it as a new Run. |
| `bound` | The RunHandle binding (locator + owner) is durably recorded. | Launched. Binding is written before any non-idempotent prompt or input is delivered. |
| `delivered` | The work prompt/input reached the worker. | Bound. Delivery is a tri-state fact: `not-sent`, `sent`, `unknown`. A request sent without acknowledgment is `unknown`, never "launch failed". |
| `settled` | A normalized RunResult or an explicit failure record exists. | Any earlier phase; crash windows settle as explicit failure with the phase reached. |
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_da2ae48948793578312ac28653ea94a1

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2
Shown digest: fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2

Complete shown candidate text:
```text
The current writer initializes `phase: admitted` and `delivery: not-sent`
(`assignment-runner.mjs:1562-1582`). Runtime inspection derives additional
observations; recognizing `bound`/`delivered` does not prove those proposed
phase transitions are durably written. Herdr launch reconciliation uses both
Run identity and its persisted launch-command identity.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_322d2c6df8da103a227d25767f5db2dd

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e
Shown digest: 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e

Complete shown candidate text:
```text
Admission rules:

- Admission uses immutable generation records and deterministic attempt identity
  (`assignment-runner.mjs:697-714,895-910`).
- When a `retryId` is supplied, the same destination/payload tuple reuses its
  admission; a changed tuple or invalid predecessor refuses
  (`assignment-runner.mjs:724-730,914-924`). This stricter tuple behavior is opt-in,
  not the behavior of every legacy attempt caller.
- A prior un-settled Run with live/unknown control holder refuses another
  admission unless the caller explicitly requests `forceNewAttempt`; settled
  result refusal is separately opt-in (`assignment-runner.mjs:926-940,1554-1561`).
- Admission observations are not semantic acceptance. Corrupt settlement must
  not be overwritten by a fresh launch.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_1566bd6207fd7d92e2df1af41f8d6282

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a
Shown digest: 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a

Complete shown candidate text:
```text
Three guarantees, kept distinct:
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_92334b1c898f23a57c6d60f3c737f4d9

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5
Shown digest: 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5

Complete shown candidate text:
```text
- **Control fencing** — one controller per un-settled Run, implemented via
  `run-lock.mjs`'s exclusive-create generation ledger (`acquireRunControl`/
  `releaseRunControl`). Holder identity is `{id, pid, bootId, processStartTime,
  host}` (`buildRunControlHolder`); reclaim requires proven-dead identity
  (`resolveHolderLiveness`) — a live PID, a PID whose liveness cannot be
  disproven, or a PID reused after a host reboot is never mistaken for a dead
  holder's slot. Observers hold no lock. A controller that lost the lock may
  not deliver input, terminate, or write Run/RunHandle state.
- **Result fencing (stronger proposal)** — authoritative result-link exclusion
  for superseded Runs requires its own implemented eligibility owner. The old
  session `result-linked`/`run-retried` event order is historical, not a current
  standalone event API or proven guarantee.
- **Effect protection** — deduplication or isolation at the place the effect
  occurs. Owned by the operation contract and its adapter. Run promises no
  exactly-once external effect; a stopped worker does not mean its effects
  are absent.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_2d967da655fb640e62cbbc74cc394b89

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de
Shown digest: 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de

Complete shown candidate text:
```text
Current admission uses deterministic Run identities, attempt numbering and existing-result refusal in `src/runner/dispatch/assignment-runner.mjs:697-940`. Run control is epoch/token-fenced in `run-lock.mjs:306-412`; corrupt settlement refuses rather than relaunching. `runtime-inspection.mjs:160-175` recognizes phase observations including bound/delivered; that is not proof that every proposed RunHandle transition/schema below has been implemented.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_ce9cf7041e0794dd190740863312964a

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698
Shown digest: 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698

Complete shown candidate text:
```text
The former session `run-retried` event-order and result-link fencing rules are preserved in history. The current standalone Run record writes the implemented `assignment-run.v2` subset (`assignment-runner.mjs:1563-1590`). The admissionKey/admitRun/authorityRef/writerRuntime interface and stronger proposed supersession contract below remain design targets, not asserted runtime APIs.
```


Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:899-949
New: 7f90571424dd6fded8e890d1494c522f180ea153:919-969
Unchanged excerpt SHA256: fad4d70ccfd6ff9da04cb17afef36b119bd2a163dc6d9414c726cbf99ad8f62a

```text
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // S5: the admitting process's own identity, stamped into this same
        // atomic CAS commit -- see the `admitterAlive` check above for why
        // this exists and when it is (and is not) consulted.
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // M1: nothing for THIS new attempt was ever created (no run directory) --
    // 'pre-admission' is correct, matching every other admission refusal
    // above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    // S5: opt-in (`refuseIfSettled`) refusal -- see its own comment above
    // for why this exists. Nothing for THIS new attempt was ever created.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);
```

Cited file: src/runner/dispatch/assignment-runner.mjs
Old: 5546f7dd12098968a3b19150aba3e37032e2e53b:1569-1614
New: 7f90571424dd6fded8e890d1494c522f180ea153:1589-1634
Unchanged excerpt SHA256: 34d90f3737554a096f81636d0ae22729e9db4fbff48a890ba32bf686f6b726aa

```text
    destination: opts.destination ?? effectiveCwd,
    payloadDigest: opts.payloadDigest ?? defaultAdmissionPayloadDigest,
    expectedRunId: opts.expectedRunId,
    herdrLivenessPreCheck,
    // M1: operator escape valve for a prior attempt this host can no
    // longer observe correctly (e.g. its control ledger identity is on an
    // unreachable filesystem) -- never the default, always an explicit opt
    // sourced from the caller (CLI: --force-new-attempt).
    forceNewAttempt: opts.forceNewAttempt === true,
    // S5: opt-in only (session-engine.mjs's own FRESH, non-retry dispatch
    // path) -- see admitRunAttempt's own comment for why this exists.
    refuseIfSettled: opts.refuseIfSettled === true,
    buildRunMeta: (record) => ({
      contract: 'assignment-run.v2',
      runId: record.runId,
      assignmentId: effectiveAssignment.assignmentId,
      attempt: record.attempt,
      supersedesRunId: record.predecessorRunId ?? null,
      retryId: record.retryId ?? null,
      payloadDigest: record.admissionPayloadDigest ? (record.admissionPayloadDigest.startsWith('sha256:') ? record.admissionPayloadDigest : `sha256:${record.admissionPayloadDigest}`) : null,
      dispatchPlanDigest: compiledPlan ? `sha256:${crypto.createHash('sha256').update(JSON.stringify(compiledPlan)).digest('hex')}` : null,
      phase: 'admitted',
      delivery: 'not-sent',
      executorId: resolvedExecutorId,
      ...(templateResolution ? { template: templateResolution.templateProvenance } : (effectiveAssignment.provenance?.template ? { template: effectiveAssignment.provenance.template } : {})),
      ...(compiledPlan ? { dispatchPlanPath: path.relative(root, path.join(runsDir, record.attemptStr, 'dispatch-plan.json')) } : {}),
      effectiveContractPath: path.relative(root, path.join(runsDir, record.attemptStr, EFFECTIVE_EXECUTION_CONTRACT_FILE)),
      ...(planContentHash ? { planContentHash } : {}),
      cwd,
      startedAt,
      timeoutMs,
      status: 'running',
    }),
    buildDispatchPlan: () => compiledPlan,
  });
  const { attemptStr, runId, runDir } = admitted;
  const dispatchPlanPath = path.join(runDir, 'dispatch-plan.json');
  const effectiveContractPath = path.join(runDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
  let providerCapacitySelection = null;
  let providerCapacityEvidence = null;
  let fallbackEvidence = null;
  // executor-id-consolidation Step 2: true once `resolvedExecutorId` has
  // been substituted away from `declaredPrimaryExecutorId` by the
  // provider-capacity fallback mechanism specifically (resume rehydration
  // below, or a live fallback adoption further down) -- deliberately NEVER
  // set by the read-only-redirect substitution above, which is a separate,
```

### Re-pin claim_9e78656a9656a956d8d18436eb513951

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 0f92ff45e3f725fe4903ac850e30385d1199d6278c8a8ec2afd54232cce813bd
Shown digest: e98157308c83f0bd05e096838a8a7127087b57f0be4f3be32e1a91fc8d024c33

Complete shown candidate text:
````text
# ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot

```txt
Document type: Decision
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
````


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_25a8cfce7bd6938196e6b4ef2e4c02d9

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de
Shown digest: 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de

Complete shown candidate text:
```text
Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_9950fd6826b0086a4413fdb3d1834075

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: c91b14b9a4ae7b59bba753d6cb386d9d883a3ddd59a3abcd0da593e34d1c6029
Shown digest: 25391265a6f3b3016c824d8719c913fb1ebb17538de38a49cb13dc91c524e564

Complete shown candidate text:
```text
## Context

The original first-slice motivation is preserved in the complete historical input. Current build/execute accepts validated declared, inline and Unit-run provenance through the same governed Assignment path.

The Vision requires agent-led planning to lower into the same governed
Assignment path with equivalent objective, constraint, output, mutation,
evidence, capability, budget, and provenance semantics.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_a8344e1a43226394f04114d9f4270ce2

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604
Shown digest: 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604

Complete shown candidate text:
```text
The original first-slice motivation is preserved in the complete historical input. Current build/execute accepts validated declared, inline and Unit-run provenance through the same governed Assignment path.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_5a220e0966cb9c6872f42b471150726b

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 5622c06276f32ad74efed999035410c8d752835bbe3f671d5ac3368f4555384c
Shown digest: 860625505af248f5e4da75b5c8abbf0ca2d3732123931ab1947a70daa834164a

Complete shown candidate text:
```text
## Decision

1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058. Do not present the dormant stamp path as a current general session-runtime door.

7. **Retire the standalone read-only heuristic.** Once no declared caller
   passes `workId: null`, the `missionId || workId === null => read-only`
   clauses are removed; read-only status comes only from the stamped
   `mutation` field.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:345-354
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:346-355
Unchanged excerpt SHA256: 352c8346304a42d18b7fed6215a302b2ddced674017bc590689f4803f45d488a

```text
      round,
      // The role's own task when the pattern gave it a unit of its own (a reviewer is told to
      // review, not to redo the work); otherwise the unit's objective.
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
```

### Re-pin claim_1a0fd8e46885b7343da2f7c6cae17f2d

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237
Shown digest: 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237

Complete shown candidate text:
```text
1. **Three current provenance kinds, one execution path.** Declared and inline
   builders stamp `contractPolicyVersion`, `normalizerVersion` and validator
   provenance (`assignment.mjs:456-459,663-666`). The Unit door separately writes
   `provenance.kind: unit-run` with its Unit-run context (`execution/run.mjs:334-338`);
   do not assert every kind has the declared builder's identical shape.
   - `declared`: Workflow step/operation/TaskSpec validation and normalization.
   - `inline`: foundation contract validation, the applicable registered domain
     harness and caller provenance.
   - `unit-run`: the Unit execution door and its computed binding/admission.
2. **Normalizer stamps the snapshot.** At build time the normalizer stamps
   `mutation` (`read-only | mutating`) and `evidence.required`
   (`reported | verified`) onto the immutable Assignment. Declared operations
   use operation tables with role/mutation-derived fallbacks for unmapped
   operations (`assignment-normalizer.mjs:95-124`); inline contracts must declare
   mutation/evidence explicitly. Missing required inline values fail validation.
3. **Interpretation reads the Assignment, not the operation id.** Result
   confidence gating, mutation policy, and post-advance behavior are driven by
   Assignment fields. Declared `resultKind` and optional `onAdvance` use the
   normalizer tables, with advisory/work-product fallback from mutation
   (`assignment-normalizer.mjs:120-143`). These are not arbitrary accepted
   inline-contract fields.
4. **Validated inline fields.** `objective`, `contextRefs`, `constraints`,
   `expectedOutputs`, `mutation`, `evidence`, required `role` and `budget`;
   optional `capabilities`, `supports`, `contractTemplate` and narrow `policy`.
   Budget requires positive integer `timeoutMs` and `maxRuns`; optional `tokens`
   is telemetry, not an enforced limit (`execution-contract.mjs:345-346,371-382`);
   inline policy accepts only
   `tier`, not a full PolicyPatch. Caller fields are validated separately
   (`execution-contract.mjs:180-240,295-340`). Unknown fields are rejected.
5. **Same execution governance.** Declared, inline and Unit-run requests
   converge on Assignment execution and Run/RunResult normalization rather than
   private dispatch or stores that bypass governance.
6. **Current mutation admission, not the retired first slice.** Generic inline mutation validation still requires the reserved protocol-operation stamp (`execution-contract.mjs:327-334`, `assignment-normalizer.mjs:173-175`), but the engine that produced that stamp was retired. The current Unit-run mutating door uses the worktree and recomputed-binding checks described in docs/specs/runner.md:3058. Do not present the dormant stamp path as a current general session-runtime door.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:345-354
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:346-355
Unchanged excerpt SHA256: 352c8346304a42d18b7fed6215a302b2ddced674017bc590689f4803f45d488a

```text
      round,
      // The role's own task when the pattern gave it a unit of its own (a reviewer is told to
      // review, not to redo the work); otherwise the unit's objective.
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
```

### Re-pin claim_ad5d6c50833838b291a8afa244710000

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: 669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714
Shown digest: 669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714

Complete shown candidate text:
```text
Herdr's Rust implementation (`herdr-dashboard/src/`) names several of its own
types with "orchestrator" in Rust-identifier casing: the `PaneOrchestrator`
trait (`ports.rs`) governing pane open/reuse/focus, and the
`OrchestratorSettings` (`packages/herdr-fgos-common/rust/src/settings.rs`) and
`HerdrOrchestratorToggles` (`herdr-dashboard/src/main.rs`) govern the
`herdrOrchestrator` configuration namespace. These
are Rust port terms describing Herdr's own pane-lifecycle and toggle
mechanics — a different vocabulary from this document's own "orchestrator"
glossary entry above (§5.1: the T0 composition layer that manages N units of work and stays attached). Do not
rename `PaneOrchestrator` or its sibling identifiers to align with that
glossary sense, and do not read a `PaneOrchestrator`/`OrchestratorSettings`
citation elsewhere in the repo as evidence fgOS's own dispatch layer is
being described.
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_093256d8e4834a042c5d3bca090debfa

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd
Shown digest: f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd

Complete shown candidate text:
```text
Current `herdr-spawn` keeps CLI-shaped invocation but requires configured
`interactiveMode`; non-interactive dispatch is rejected
(`transport.mjs:913-921`). It starts a fresh interactive agent pane through
`herdr agent start`; the prompt is delivered through a disk artifact rather
than typed as a multiline shell command.
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_22c21e333a3e28ce4157a3a8ecb45cc0

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: d5487f392710c3185e9446c6b531670e0c39d51c1975c337f3d1d9cb9a7067a4
Shown digest: d5487f392710c3185e9446c6b531670e0c39d51c1975c337f3d1d9cb9a7067a4

Complete shown candidate text:
```text
Completion is a worker-written `outbox/result-<round>.json`, not pane status,
stdout sentinels, `[DONE]` or a screenshot. A failed dispatch's pane stays open
by default and its error identifies the pane; a separately configured sweep
may close failed-round panes, not provider-limit pauses
(`transport.mjs:748-814`).
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_04708da0808dc431babd8703bca2f6f5

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: 783d0f691c229b5e3167bad2a846d06ffea7cc7180943b63149286a4e7d48a62
Shown digest: 783d0f691c229b5e3167bad2a846d06ffea7cc7180943b63149286a4e7d48a62

Complete shown candidate text:
```text
The old non-interactive temporary-script/sentinel/echo-strip/timeout-kill
recipe is removed and must not be used as current instructions. Result files
still require their own contract/evidence validation; terminal visibility
does not decide Work lifecycle.
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_bd150b090a443355048d83d8fe69502e

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: cf4282de7c03e113012ec5beb85a426e24d35078f3a3f04ae8bb8f7d2d1a32aa
Shown digest: cf4282de7c03e113012ec5beb85a426e24d35078f3a3f04ae8bb8f7d2d1a32aa

Complete shown candidate text:
```text
AgentMessage/mailbox transport remains an unimplemented design target.
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_2c7ca6512f1870baa15c6be84b52c0eb

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56
Shown digest: ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56

Complete shown candidate text:
```text
| Status | Required fields |
|---|---|
| `done` | `summary`; read-only acceptance requires a companion worker report artifact, not just `evidenceRefs`; mutating acceptance requires appropriate external delta evidence. See run-result.mjs:1276-1285 and assignment.mjs:881-898. |
| `blocked` | `summary`; `blocker`. This protocol asks workers to attach `evidenceRefs` when evidence exists; the validator only checks that field when supplied (`agent-result-claim-contract.mjs:70-79`). |
| `failed` | `summary`; `error`. |
| `no-evidence` | Non-empty `summary`; there is no additional reason field in the validator (`agent-result-claim-contract.mjs:9-15,67-85`). |
```


Cited file: src/runner/operation-choice.mjs
Old: 7ccfd74c289cc74fb7f7122ea4a7b545a9101156:747-761
New: 24f523dbfb0290b451491ba0b98f9b4672e20e7a:749-763
Unchanged excerpt SHA256: 44267679a2b2c75c3f768bfd9fefc222eb651c1adf43c3aeb95c497e78a0b72a

```text
  const explicitRequestedOp =
    (typeof contextSignals.nextOperation === 'string' && contextSignals.nextOperation.trim() ? contextSignals.nextOperation.trim() : null) ??
    (typeof work?.nextOperation === 'string' && work.nextOperation.trim() ? work.nextOperation.trim() : null) ??
    (typeof contextSignals.secondaryOperation === 'string' && contextSignals.secondaryOperation.trim() ? contextSignals.secondaryOperation.trim() : null) ??
    (typeof work?.secondaryOperation === 'string' && work.secondaryOperation.trim() ? work.secondaryOperation.trim() : null) ??
    (typeof work?.operation === 'string' && work.operation.trim() ? work.operation.trim() : null);

  if (explicitRequestedOp && !ops.some((o) => o.id === explicitRequestedOp)) {
    return Object.freeze({
      operation: explicitRequestedOp,
      reason: `undeclared-stage-operation-${explicitRequestedOp}`,
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
```

### Re-pin claim_1c0c3cdd5486263d84af20ce969ece4c

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0
Shown digest: ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0

Complete shown candidate text:
```text
Optional `nextRecommendedOperation` may name another legal stage operation, but
it is only a recommendation. The driver must verify legality before acting.
The current [driver boundary](../contracts/workflow-stage-operation.md#driver-boundary)
and undeclared-operation refusals enforce legal selection
(`src/runner/operation-choice.mjs:747-761`,
`src/runner/dispatch/assignment.mjs:328-345`); they do not implement a consumer
for the proposed field.
```


Cited file: src/runner/operation-choice.mjs
Old: 7ccfd74c289cc74fb7f7122ea4a7b545a9101156:747-761
New: 24f523dbfb0290b451491ba0b98f9b4672e20e7a:749-763
Unchanged excerpt SHA256: 44267679a2b2c75c3f768bfd9fefc222eb651c1adf43c3aeb95c497e78a0b72a

```text
  const explicitRequestedOp =
    (typeof contextSignals.nextOperation === 'string' && contextSignals.nextOperation.trim() ? contextSignals.nextOperation.trim() : null) ??
    (typeof work?.nextOperation === 'string' && work.nextOperation.trim() ? work.nextOperation.trim() : null) ??
    (typeof contextSignals.secondaryOperation === 'string' && contextSignals.secondaryOperation.trim() ? contextSignals.secondaryOperation.trim() : null) ??
    (typeof work?.secondaryOperation === 'string' && work.secondaryOperation.trim() ? work.secondaryOperation.trim() : null) ??
    (typeof work?.operation === 'string' && work.operation.trim() ? work.operation.trim() : null);

  if (explicitRequestedOp && !ops.some((o) => o.id === explicitRequestedOp)) {
    return Object.freeze({
      operation: explicitRequestedOp,
      reason: `undeclared-stage-operation-${explicitRequestedOp}`,
      dispatch: null,
      stop: true,
      canAdvanceEdge: false,
    });
```

### Re-pin claim_013abd94027531328ddccf8b8ea8a056

Original: a1fd2136a16dce642cc202a10b585efcf040fd3b:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-main-repin.json
Class: candidate-native-content
Unit digest: 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f
Shown digest: 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f

Complete shown candidate text:
```text
A Workflow operation/TaskSpec, Unit or validated inline contract supplies the
applicable execution contract. Inline validation is implemented in
`src/runner/dispatch/execution-contract.mjs:180-240,295-340`; it is not still an
undecided schema. Unit and generic inline admission are distinct current paths.
```


Cited file: src/runner/execution/run.mjs
Old: 42707f1437959d95744aff709b61a461f166ff71:348-357
New: bbd27a832254880dd76ca71acdadc2e16c585d2b:349-358
Unchanged excerpt SHA256: c342412e8bfcfd827b25c3acbe23e02b5720070b0159481a35487b4b931f3d6b

```text
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
```

### Re-pin claim_3630c07c84787b011a0af5ea0f3d11c5

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: ff44d4f17dba913cc93f2718a79394d5baface8f4825c940c57c625284c678cd
Shown digest: 75e01a81313a7186bf222668aa46ab2a5cf4767f48eeeda9dcb813d6be746cfa

Complete shown candidate text:
```text
### Job

Reserved vocabulary for a possible future scheduler, not a third dispatch
target or an already implemented queue entity. A Run is one concrete attempt;
it is not a Job. See the retained
[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

### Re-pin claim_3adcdb2c2ecf7b170f811db859ee7dd3

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0
Shown digest: eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0

Complete shown candidate text:
```text
Reserved vocabulary for a possible future scheduler, not a third dispatch
target or an already implemented queue entity. A Run is one concrete attempt;
it is not a Job. See the retained
[dispatch-job reservation](../decisions/ADR-004-reserve-job.md).
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

### Re-pin claim_8d1098aad227478a4ecfba67e29f6a69

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a
Shown digest: 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a

Complete shown candidate text:
```text
Status: implemented in the reviewed candidate.
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

### Re-pin claim_b36b3352394e5987921d8ca3fab02023

Original: 2269f2d2790f5bcef0a9ea4838cf27954619feda:plans/260925-documentation-authority-unification/ledger/candidate-classifications-agent-coordination-recovery.json
Class: candidate-native-content
Unit digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546
Shown digest: 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546

Complete shown candidate text:
```text
Implemented behavior:
```


Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:748-790
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:748-790
Unchanged excerpt SHA256: b679003cd19161a05914a0adbfae3d83da9a5854d59b81cb92e5c61e2a91799b

```text
/**
 * The `herdr-spawn` executor adapter: run the worker as a real interactive
 * agent in a pane a person can watch, and conclude nothing about the work
 * from anything except a file the worker itself wrote.
 *
 * Three things this adapter refuses to do, each because doing it failed in
 * production:
 *
 * 1. It never types the prompt as a shell command. The old path quoted the
 *    prompt into an argv string and let `herdr pane run` type it as
 *    keystrokes, which corrupts every multi-line prompt there is -- and a
 *    real implementation prompt is always multi-line. The prompt goes to
 *    disk; one line pointing at it goes through the terminal.
 *
 * 2. It never treats `agent_status` as completion. That reading was wrong
 *    twice in measured production: `idle` before the agent had started at
 *    all, and an `idle`-looking dip between two tool calls of one turn.
 *    Completion is `outbox/result-<round>.json` existing, nothing else.
 *
 * 3. It never closes the pane on failure. A failed dispatch's pane is the
 *    only place the reason is still legible, so it stays open and the error
 *    carries its id.
 *
 * HARD CONSTRAINT (tsk-1nih, live evidence): always a FRESH pane, never a
 * reused one. Delivering a dispatch into a finished worker's pane sends it
 * as chat to an idle REPL.
 *
 * Startup goes through `herdr agent start`, which returns only once herdr
 * has confirmed a ready agent in the pane -- that is what absorbs the shell
 * boot race the old path had to poll around, and it fails by name
 * (`agent_not_ready`) instead of hanging.
 */
function herdrSpawnInteractiveAdapter(invocation, opts) {
  const { command, args, argsTemplate, prompt, env: rawEnv, interactiveMode, promptDelivery, permissionMode, confinement } = invocation;
  const { exitCommand, kind, usageLimitPatterns, trustStore } = interactiveMode;
  const {
    cwd, timeoutMs, idleTimeoutMs, workId, tier, model,
    herdrBin: optsHerdrBin, onChunk, runDir: optsRunDir,
    // An automated sweep may close the panes of failed rounds. It never
    // closes one paused on a provider limit -- that screen is the only place
    // the reset time is written.
    closeAlways = false,
    // A pane already sitting in the caller's own tab (one lead's coding panel
```

Cited file: src/runner/dispatch/transport.mjs
Old: 24a527e8a3e90806185d441ca6a599fa6c34a43b:913-921
New: acd13397a165d98cf3b5ef3d55b90ce9cf05db93:915-923
Unchanged excerpt SHA256: a8d68b734f0a5656c2187d8542146814c7394b144b74b1a22842a530d294ea12

```text
export function herdrSpawnAdapter(invocation, opts) {
  if (invocation.interactiveMode) {
    return herdrSpawnInteractiveAdapter(invocation, opts);
  }
  return Promise.reject(new DispatchError(
    'invalid-config',
    `executor for work "${opts?.workId}" refused: herdr-spawn adapter requires interactiveMode to be configured -- it no longer supports a non-interactive dispatch path.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
```

## Batch-report notes and effort

Class counts remain Mirror 0, Unit-exact 0, Weak-exact 0, Judgment 431. Dispositions: 408 move, 12 reviewed partial-carry with explicit restored remainder, 11 supersede. No Host holds. The checkpoint’s 14 reworks and later five native-count groups/six rationale nits have been resolved and independently accepted; this turn introduces no content rework outside the main conflict.

Six distinct documented Host execution sessions are visible in progress: initial author (431 rows), two zero-row blocked continuations, the limited rework continuation (33 source rows + 35 successors), the follow-up (6 source rows + 5 successors), and this boundary close attempt (3 current source rows, 18 native gaps, 43 machine re-pins). The three committed source review rounds read 431 + 33 + 6 = 470 row instances. This records available session evidence, not token use. Final batch closure/report remains deferred until the A31 review.

The final draft-alias validation has zero schema/owner findings; all 102 distinct destination headings pass list-doc-anchors --check. Thirty-two draft destinations use the containing browser heading while retaining the reviewed native unit anchor in decisionBindings. These draft data changes do not edit a consumer.

## Verdict binding format

Current source verdicts use an ordinary report with Reviewer, Author session (codex-session:5@2026-10-13), Review mode: ordinary and the five columns Claim | Verdict | Note | Source digest | Target digest. Gap verdicts name all 18 old IDs and the shown same-file successor digest; notes must be committed before any approval fields are copied. Do not duplicate the old code-fence ID in a source verdict table: it is a registry gap, while its native new source ID is a separate current source row.

The 43 machine re-pins require a separate classification report with Reviewer, Author session: codex-session:1@2026-10-11 (preserved original receipt authorship), Receipt commit: b6cdda81b333a375ebfb72141e962e1feac724f0. Columns: Claim | Class | Verdict | Unit digest | Shown digest | Note | Evidence digest. Every note is the Lead’s own exact machine-comparison verdict. The table below supplies the immutable new evidence digests; do not re-review code truth.

| Claim | Class | Unit digest | Shown digest | New evidence digest |
|---|---|---|---|---|
| claim_39e4f58e68986802a16d978b42f5a1db | candidate-native-content | 38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8 | 38517e6c917bb4e21624a0e07b496579d6190b6adb9983f5fe18e16c3526eeb8 | 178193acbde20dc38ca9b8c504bf078f24eaa6c8c0825462fdb5641a416d751b |
| claim_e134b71a09a0a8fd7c62eef87959daf4 | candidate-native-content | 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9 | 45eb2c3f056d30141e5d53b6c349a7b8d46092bfc87346e0b2dd841f8b2081b9 | 900ff288ef4e2ae0f57127ea9680dab2799e3789ad8617895a8e0587f1e2f5d5 |
| claim_c7c1506a1c8d6e7bfe85935c0868d924 | candidate-native-content | 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b | 76d215590439cb81c3b2cf2c436f9232b4e67a3670186038b25c43c774f80d0b | 900ff288ef4e2ae0f57127ea9680dab2799e3789ad8617895a8e0587f1e2f5d5 |
| claim_95d630cee33a4aee7d6a44e1e0a3c4a9 | candidate-native-content | 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad | 35ebb378e8d447d5f996404dad8eec4626b4f00311d2221a450ee6eb418c21ad | 900ff288ef4e2ae0f57127ea9680dab2799e3789ad8617895a8e0587f1e2f5d5 |
| claim_7731fbd40c6c0d51f94c7e55b93c0925 | candidate-native-content | eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e | eaec6dc020fab8b2c62e171dce457ad67da1e92ed6d7310280c9a18593db508e | 900ff288ef4e2ae0f57127ea9680dab2799e3789ad8617895a8e0587f1e2f5d5 |
| claim_4ec4e0906acc7fb09ca51129030e7230 | candidate-native-content | dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785 | dda2de3ff221e2646b7a686c931fe6dfeb234cfd913cd8a7487bf437415f7785 | cd1174867a85532741a63449a1a34ec44f3b7a04a354768f031663397ceafa88 |
| claim_c38104d8972032b3b20db9bca5321871 | candidate-native-content | f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be | f058552f4b52d313e8f86aca9c70ac756a42145757a31ba6b58099f5945534be | cd1174867a85532741a63449a1a34ec44f3b7a04a354768f031663397ceafa88 |
| claim_3c55901c64cdf2f99a36062302427fcb | candidate-native-content | 40e8420ecedfdc8389c27e6a3e7b8446da8062301b6a306fd601f59de579c8fd | d6dfa94679cf29d1dc8f8f53e24f9560ed39967f74c7d05120b737507bad33f7 | d6b04439c4f32d3c2d8cd7cbdbaf1bbd0f2f9dc3dea3572c26eccccda10a53cd |
| claim_edf9b5d6a4118579e66fcdedf2a0e66a | candidate-native-content | 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad | 36446e8234df1d9b71b5689bee83d41fa25dd3ef34eb8e6ea79c31641a74b4ad | d6b04439c4f32d3c2d8cd7cbdbaf1bbd0f2f9dc3dea3572c26eccccda10a53cd |
| claim_c4ccebca77d2e1f1240fb4a3588803bd | candidate-native-content | 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6 | 92cf91fdafe6f647dcb2221e43f4ce687a88415b3a75437899771b413d16bcd6 | d6b04439c4f32d3c2d8cd7cbdbaf1bbd0f2f9dc3dea3572c26eccccda10a53cd |
| claim_67592e838ebefa5d77fb98b4af14e367 | candidate-native-content | b54abb5801b4e539ddd8dc29f1135d06a751a9833cd45a7fd27e72aff7b63cd6 | 097936745e3bd24722d05d5c02697903f13d2e8a95e1e7c7cee804833dfdaf68 | 448af6ae1113e5f34bc627055cfac1b1d612fe91804dd82990a89c09eda340de |
| claim_eb8aa75ad4ff996ab1f5f477c6bbb630 | candidate-native-content | fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4 | fdec51c73bc036c0e680a60d482fb1ecc9e81e0b092639d33b9e5974833f1ad4 | 343668540487df15d6a0325d3c9b21757dfa8af9dca928b97bd68cfd26cffd6d |
| claim_260feeee6a60be662bdda8b9b7666412 | candidate-native-content | 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92 | 716b58c5f151140195596e7539a793527c003faf50948f0fb0193233398f1d92 | 343668540487df15d6a0325d3c9b21757dfa8af9dca928b97bd68cfd26cffd6d |
| claim_6b9d77ea4dcd08cde0c9003939ebc000 | candidate-native-content | 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1 | 27ed3816193e24b624b27dc8db157ce4b0becb3b6647ae1604414ea1e44b35e1 | 0add47601e56346b6561c53276fe5f64844a5ffbcc73c8e3482a000f506a6766 |
| claim_d375b290e2ac560a3ea02781d5715e7b | candidate-native-content | d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b | d4d6dd64727d26d9281be53d026bb9158f9e3a28661cd019f7af6232ba23e57b | 8b859d7c7ff2017ab0d4a598242f2783490b94bc4aa40f8cbe67401c11fbb03b |
| claim_c7d3e8ef6acdffb1b08e61d5b5bd4d9a | candidate-native-content | 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65 | 8305af07b5cc1dfb4abafe35643b56651fee378610fe1722422cafde6213fb65 | d46436e5f6ca1ba5d41f5432003aebe9ec7d15986082c13812f5a2da0b3e1b25 |
| claim_456ad50a7253122ec3610059e0779e03 | candidate-native-content | 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09 | 9fe7fb81663c9b4a1776063cb5507a962b567dfeb4abfc56cf9568bfb82f9e09 | d46436e5f6ca1ba5d41f5432003aebe9ec7d15986082c13812f5a2da0b3e1b25 |
| claim_59f6314467565caef24f13c7338a59be | candidate-native-content | fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21 | fdf16c7b6c6e97fb86f217bd1c120f4eaaaa2b7b3f94eafe45b19952f6240c21 | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_041ac1009b965096340a81e9c4503cdc | candidate-native-content | de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c | de49f21a79c2e1210ce53e02a812a1543bebc2c44330ee9bb80b3ac90c957f5c | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_da2ae48948793578312ac28653ea94a1 | candidate-native-content | fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2 | fd7534633ff32b3b169a69223159dae4a84f85f6e60e7a5c47e9f582678c63e2 | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_322d2c6df8da103a227d25767f5db2dd | candidate-native-content | 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e | 92b7fc3962d8526dffe7d9828551775e3475c88042d386d34e125d9ef0bf663e | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_1566bd6207fd7d92e2df1af41f8d6282 | candidate-native-content | 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a | 56204f37d31709c9f12dae208cf709ee21a707c9d8c79bc959832227fcbe079a | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_92334b1c898f23a57c6d60f3c737f4d9 | candidate-native-content | 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5 | 1aa07833512c49fad7980356d992800a57bf2bac63398a662f1b5b595e3bf3d5 | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_2d967da655fb640e62cbbc74cc394b89 | candidate-native-content | 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de | 9251008d29a480cf3aa8ff30eb72389256c4963c7e7677e1f075f55256f0c0de | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_ce9cf7041e0794dd190740863312964a | candidate-native-content | 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698 | 5e464682f0c67ba75942629eaf249ac37f2273e88fdf76b79c6e3510fd684698 | bdecc864bb2996a48a8014ad0d36af9ed41f81659f59c51f5feb2619da743a75 |
| claim_9e78656a9656a956d8d18436eb513951 | candidate-native-content | 0f92ff45e3f725fe4903ac850e30385d1199d6278c8a8ec2afd54232cce813bd | e98157308c83f0bd05e096838a8a7127087b57f0be4f3be32e1a91fc8d024c33 | 42b1428bd8813b3ccdd4cc7ec212080066b0d53edd43cfc09acc6dbf4d0901e2 |
| claim_25a8cfce7bd6938196e6b4ef2e4c02d9 | candidate-native-content | 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de | 71a2d0b002b69d549be7a107e175e1dd8c54903c28734e84dbf75218eb5319de | 42b1428bd8813b3ccdd4cc7ec212080066b0d53edd43cfc09acc6dbf4d0901e2 |
| claim_9950fd6826b0086a4413fdb3d1834075 | candidate-native-content | c91b14b9a4ae7b59bba753d6cb386d9d883a3ddd59a3abcd0da593e34d1c6029 | 25391265a6f3b3016c824d8719c913fb1ebb17538de38a49cb13dc91c524e564 | bcc3a712cec655fed8b081d6ef88b857e45ff74e8d5eb8a2bb2fe9b6d42b0f96 |
| claim_a8344e1a43226394f04114d9f4270ce2 | candidate-native-content | 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604 | 0e13876e4a761e17e1a93c5a254d556e8dddabefcd233e548e78bbf825030604 | bcc3a712cec655fed8b081d6ef88b857e45ff74e8d5eb8a2bb2fe9b6d42b0f96 |
| claim_5a220e0966cb9c6872f42b471150726b | candidate-native-content | 5622c06276f32ad74efed999035410c8d752835bbe3f671d5ac3368f4555384c | 860625505af248f5e4da75b5c8abbf0ca2d3732123931ab1947a70daa834164a | c25f115bd2dc61fa6da64163322308be796a3811698f0af96d32b3be1b0e2d42 |
| claim_1a0fd8e46885b7343da2f7c6cae17f2d | candidate-native-content | 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237 | 997fca8d11fa5a0c89d56f91a578fd3c10ea4aeffdca29e97643c7d9d8fbd237 | c25f115bd2dc61fa6da64163322308be796a3811698f0af96d32b3be1b0e2d42 |
| claim_ad5d6c50833838b291a8afa244710000 | candidate-native-content | 669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714 | 669f5ebe000ba02c27c5d0a823869ff52225521d129d840c7eef336ce7cb9714 | 6eb5324a2ab7faf05ed353fe0255357adc075de0fb0dff492d99f2e2e46638e0 |
| claim_093256d8e4834a042c5d3bca090debfa | candidate-native-content | f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd | f3ea3f7469efb8a1d17340e69d5f005ebc28b137a1a8236837abdfd673d27cdd | 6eb5324a2ab7faf05ed353fe0255357adc075de0fb0dff492d99f2e2e46638e0 |
| claim_22c21e333a3e28ce4157a3a8ecb45cc0 | candidate-native-content | d5487f392710c3185e9446c6b531670e0c39d51c1975c337f3d1d9cb9a7067a4 | d5487f392710c3185e9446c6b531670e0c39d51c1975c337f3d1d9cb9a7067a4 | 6eb5324a2ab7faf05ed353fe0255357adc075de0fb0dff492d99f2e2e46638e0 |
| claim_04708da0808dc431babd8703bca2f6f5 | candidate-native-content | 783d0f691c229b5e3167bad2a846d06ffea7cc7180943b63149286a4e7d48a62 | 783d0f691c229b5e3167bad2a846d06ffea7cc7180943b63149286a4e7d48a62 | 6eb5324a2ab7faf05ed353fe0255357adc075de0fb0dff492d99f2e2e46638e0 |
| claim_bd150b090a443355048d83d8fe69502e | candidate-native-content | cf4282de7c03e113012ec5beb85a426e24d35078f3a3f04ae8bb8f7d2d1a32aa | cf4282de7c03e113012ec5beb85a426e24d35078f3a3f04ae8bb8f7d2d1a32aa | 6eb5324a2ab7faf05ed353fe0255357adc075de0fb0dff492d99f2e2e46638e0 |
| claim_2c7ca6512f1870baa15c6be84b52c0eb | candidate-native-content | ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56 | ceff29b5e89f139a1e246e71440ba41ad5e6b3d46d1297c8cedbdd671ceb3d56 | 9c9f400e0f95daaeeea23d06abf029411034a6580f0778662ac0d23bd7c67937 |
| claim_1c0c3cdd5486263d84af20ce969ece4c | candidate-native-content | ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0 | ced47404abe27dcf3984b8d1b62c02e37787e2654eeb7af864d3272a2b9284e0 | 9c9f400e0f95daaeeea23d06abf029411034a6580f0778662ac0d23bd7c67937 |
| claim_013abd94027531328ddccf8b8ea8a056 | candidate-native-content | 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f | 9f86c10b3db679c6b1e77b8adbe126822d323fa1b106dcf3b90a6d8bf4e1a68f | 6eeb126746e452c0e34aad0a7e7aaa90d9318ea768d598dc966816fc9a302215 |
| claim_3630c07c84787b011a0af5ea0f3d11c5 | candidate-native-content | ff44d4f17dba913cc93f2718a79394d5baface8f4825c940c57c625284c678cd | 75e01a81313a7186bf222668aa46ab2a5cf4767f48eeeda9dcb813d6be746cfa | aa3d588fbd6bfe5f8a0af65eb032d93ebdb4c9d63a4b3736d9f55ed9929e766c |
| claim_3adcdb2c2ecf7b170f811db859ee7dd3 | candidate-native-content | eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0 | eb6de12a0a4f891ebd4bd7d4b93acb7a10385fa245cc6366abbec829d102dda0 | 1bdfa9f4ee03b9a200c9cdf48b5842a41bda079f67b6bbda8e3415a072d47486 |
| claim_8d1098aad227478a4ecfba67e29f6a69 | candidate-native-content | 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a | 003c1b2a63f116cca3436c0e115d7c9252520c7f5d36634483efdd5428381e3a | f9b16bac2c910a6fd36615e67efe9085b9bf28ad9d90e745f4687abdbe09a219 |
| claim_b36b3352394e5987921d8ca3fab02023 | candidate-native-content | 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546 | 320e0ee20283f6f05f4296c40ae7077e943deffd6d41f49c7069c673f0a7b546 | f9b16bac2c910a6fd36615e67efe9085b9bf28ad9d90e745f4687abdbe09a219 |

## Proof and stop

Final both-prior D/E, full native tuple equality and the persisted working registry are recorded in host-invocation-boundary-verification.json. Host reverse list remains 588 exact tuples, zero pending Host source rows, zero holds and one reviewed two-member identical-unit group. The 12 already reviewed partial carries remain explicit strict open data; no strict closure is claimed or relabelled. Pending source/gap/re-pin judgments created by this merge are the reason for this bounded review request.

STOP at this request. After Lead’s committed A31 verdicts, apply notes verbatim, regenerate from the persisted working registry, rerun both-prior D/E/native equality and assess final batch closure. Step 4, promotion and push remain unstarted.

