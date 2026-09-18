Role: Context Investigator | Cell: P01.2 | Requested: `codex-readonly`, tier `analytical` | Derived: provider `openai-codex`, model `gpt-5.5` (tier immaterial on this executor, per P00.1's own routing table)
Dispatch: `codex exec -s read-only -C /home/vantt/projects/mdview "<prompt>"` (direct, no bwrap needed — native sandbox flag)
Prompt: `proofs/P01.2/prompts/context-investigator.md`
Raw run: `proofs/P01.2/runs/1-context-investigator-raw.log`
Reads: intake.md, role doctrine section 2

---

**Scout report — mdview / Context Investigator**

CASE (the person's own words, do not rephrase): "decide whether the experimental native desktop shell should remain a thin client of the existing single-daemon registry/render/search authority or acquire local ownership"

**Scope and provenance.** Read-only investigation of `/home/vantt/projects/mdview`, HEAD `7477f0a7d6804e2b9960a56a615c4cca4844c2ee`, dated September 5, 2026. No files changed; no builds, tests, or application processes launched.

**Hypothesis recorded before investigation:** "the current daemon-thin-client architecture is straining under the desktop shell's real needs, and local ownership would measurably help."

**Result:** I found concrete launcher drift and shared indexing/lifecycle problems. I found no desktop-specific performance measurements, duplicated desktop renderer/search implementation, or implemented workload demonstrating that local ownership would help. More fundamentally, "single-daemon registry/render/search authority" does not accurately describe all current process boundaries.

**Evidence against the hypothesis — the stronger finding**

The shell is a native window loading the daemon's existing website. [main.rs:47](/home/vantt/projects/mdview/crates/mdview-desktop/src/main.rs:47) creates `WebviewUrl::External(url)`. Its entire application source is 144 lines, with no `Engine`, `SqliteStore`, renderer, indexer, search implementation, document cache, or Tauri command bridge.

The shared web interface has gained capabilities without corresponding shell edits:

- `203911e`, September 3: background indexing, post-login return navigation, and folder landing pages.
- `4ba589d`, September 5: short-link resolution before background indexing finishes.
- `7477f0a`, September 5: in-place editing with daemon-side atomic save, conflict detection, and reindexing.

These changes touch `crates/mdview-core/src/engine.rs`, `crates/mdview/src/server.rs`, and shared web assets. None touches `crates/mdview-desktop`. This establishes implementation reuse; it does **not** establish successful native-window execution or measured scalability.

One historical duplication defect was addressed while preserving that split. The July 16 architecture review identified desktop spawning without process detachment. July 20 commits `dd4bc64` and `83a17f1` extracted and adopted `mdview_core::process::apply_detach`. The current shell calls it before spawning. The historical claim that desktop still lacks detach flags is therefore obsolete, including its surviving appearance in `docs/history/learnings/critical-patterns.md`.

**What actually owns what**

| Responsibility | Observed implementation |
|---|---|
| Native window, tray, focus, close-to-tray, Linux display detection | `crates/mdview-desktop/src/main.rs:19-101` |
| Locate executable, discover/spawn daemon, readiness polling | Desktop `main.rs:104-144`; a separate implementation exists in `crates/mdview/src/runtime.rs` |
| Shared daemon record and health probe | `crates/mdview-core/src/daemon.rs` |
| HTTP service, page/search/save endpoints, WebSocket delivery | `crates/mdview/src/server.rs` |
| Registry and search storage | `crates/mdview-core/src/repository.rs`: SQLite, FTS5, `Mutex<Connection>` |
| Registry/index/render/search use cases | `crates/mdview-core/src/engine.rs`; rendering in `render.rs`, indexing in `indexer.rs` |
| Filesystem watching and cleanup | `crates/mdview/src/watch.rs` and `cleanup.rs`, started by `server.rs` |
| Client interaction state | Shared `crates/mdview/assets/app.js`: theme persistence, Mermaid interaction, editor draft/dirty state, reload filtering |

There is already client-local state, but it belongs to the shared web frontend rather than a separate native domain implementation. Search requests use `/_jump`; saves use HTTP `PUT`; reload notifications arrive over WebSocket. The desktop also contains a 26-line local HTML asset, but startup points directly to the external daemon URL. I could not establish that this asset is actually displayed as the "connecting" splash described in appearance documents.

**The framing's assumed authority boundary fails a source check**

The desktop is a daemon client; CLI and MCP are not exclusively daemon clients:

- [runtime.rs:13](/home/vantt/projects/mdview/crates/mdview/src/runtime.rs:13) opens `registry.db` and constructs an `Engine`.
- `crates/mdview/src/cli.rs` calls that helper for registration, opening, searching, refreshing, and unregistering.
- [mcp.rs:15](/home/vantt/projects/mdview/crates/mdview/src/mcp.rs:15) independently opens the same database and creates its own `Engine`.
- `runtime.rs::spawn_refresh_detached` launches a separate `mdview refresh` process.
- [repository.rs:34](/home/vantt/projects/mdview/crates/mdview-core/src/repository.rs:34) explicitly documents concurrent database access by daemon, CLI, MCP, and detached refresh, and configures a 15-second busy timeout.

Thus one shared registry and shared domain implementation coexist with multiple process-local engines and database connections. Registry mutation and CLI search are already outside the HTTP daemon process. "One daemon" and "one process owns every registry operation" are different claims here.

**Evidence supporting strain — concentrated in launcher coordination**

Four observable differences remain between desktop `ensure_daemon()` and CLI `ensure_bind()`:

1. **Cold-start serialization.** CLI gained an atomic spawn gate in `5887583`, July 16. Desktop does not use it. Its single-instance plugin initializes only after `ensure_daemon()`. The spawned `serve` command checks for an existing daemon, but that check is not atomic with startup. A concurrent-start race remains plausible from source; not reproduced.
2. **Readiness and error reporting.** Desktop ignores the spawn result and sleeps 30 x 150ms before falling back to configuration. CLI sleeps 20 x 100ms and reports spawn/readiness failures. These are 4.5s and 2s sleep budgets, not measured startup times.
3. **Bound-port fallback.** CLI gained lock-preferred fallback in `7e697fe`, July 16, because the server can increment an occupied port. Desktop still falls back directly to configured host/port after unsuccessful polling. The same precondition can therefore produce a URL for the wrong port.
4. **Bind address versus WebView URL.** Desktop returns `DaemonInfo::base_url()`, which interpolates the raw bind host. The default host is `0.0.0.0` in `crates/mdview-core/src/config.rs:81`. Health checking substitutes loopback, but desktop URL construction does not. CLI has separate URL conversion logic.

These mechanisms explain potential attachment failures without establishing a need for desktop-owned registry, rendering, or search.

**Other seams exposed by the investigation**

The September 3 indexing change moved full scans out of the requesting CLI/MCP process into detached refresh. Two days later, `4ba589d` fixed short links returning 404 before the index caught up, using a filename scan and on-demand indexing in `Engine::resolve_short_code`. This is evidence of a readiness/consistency problem spanning shared registry producers and HTTP consumers, rather than a native-shell API workaround.

Watcher enrollment also has a boundary: `watch.rs::spawn_watchers` installs watches for projects present at daemon startup. A newly registered, unrelated project root is not dynamically enrolled by the inspected code. Its user-visible frequency was not measured.

**Magnitudes and trends**

Counts use commits reachable from HEAD, excluding merges for the monthly comparison.

| Path | July 2026 | August 2026 | Sept 1-6 |
|---|---:|---:|---:|
| `crates/mdview-desktop` | 6 | 0 | 0 |
| `crates/mdview/src` | 43 | 12 | 4 |
| `crates/mdview-core/src` | 16 | 7 | 4 |

Desktop `main.rs`: 3 touching commits (introduction + headless handling July 15, detachment July 20). 126 lines at introduction, 144 now.

| File | Lines | Test attributes |
|---|---:|---:|
| Desktop `src/main.rs` | 144 | 0 |
| CLI `src/runtime.rs` | 416 | 11 |
| HTTP `src/server.rs` | 1,358 | 20 |
| Core `src/engine.rs` | 777 | 6 |
| Core `src/repository.rs` | 1,072 | 16 |
| Core `src/render.rs` | 675 | 15 |

12 tracked desktop files (incl. generated schemas, lockfile, icon, config). No desktop changes after July 20 — cannot distinguish satisfied users from an unexercised experiment.

**Existing decisions and documentation drift**

`PRD.md` §§7.1/7.5 explicitly specifies a thin desktop client and rejects a separate desktop registry. `docs/specs/daemon.md`, `docs/specs/system-overview.md`, and `crates/mdview-desktop/README.md` repeat that intent. No separate ADR evaluating desktop-local domain ownership was found.

These documents are not uniformly current:

- PRD §7.5 says tray Quit stops a daemon started by the app. Current code only calls `app.exit(0)` and retains no child ownership handle.
- System overview still calls desktop "planned," despite its implementation.
- Its non-goals still say no authentication, editing, or user-file writes, despite current authentication and September 5 editing code.
- The July daemon spec's "single process owns registry" language omits the explicitly supported multiprocess database access.

**Absences checked**

- No TODO/FIXME markers in desktop code, `runtime.rs`, `daemon.rs`, or `process.rs`.
- No desktop tests or desktop invocation in the inspected integration test file.
- No desktop build in `.github/workflows/ci.yml` or `release.yml`.
- No desktop latency benchmark or measured local-vs-daemon comparison found.
- Bundling disabled in `tauri.conf.json`. Desktop package version `0.1.0`; workspace version `0.7.6`.

**Could not determine — and what would determine it**

- **Whether desktop users experience latency or missing capabilities:** actual native-session traces, reproduction cases, required workflows.
- **Whether local execution improves performance:** comparable render/search/startup measurements with representative projects and contention. PRD targets exist (startup <2s, render 1MB <100ms, search 50k files <200ms) but they are targets, not results.
- **How often launcher drift fails:** native runs covering simultaneous cold starts, occupied ports, wildcard binding, missing executables, daemon restart.
- **Whether database concurrency is operationally costly:** registry size, lock-wait/error measurements, concurrent CLI/MCP/refresh workloads.
- **What "local ownership" specifically includes:** durable registry, indexing, rendering, search, lifecycle, or interaction state. The CASE leaves these together; the inspected system already assigns them to different boundaries.

## Coordinator's note on this finding

`PRD.md` already states a thin-client decision and rejects desktop-local
registry ownership. This does NOT trigger the playbook's "already decided"
stop condition on its own: the person was told this exact question (from
`plan.md`'s own framing) and explicitly re-confirmed on 2026-09-06 that it
remains genuinely undecided, after the investigation's own finding surfaced
real documentation drift (the PRD's other claims about this boundary are
independently shown stale — tray-quit behavior, "planned" status, non-goals
list). The credible reading: the person may be treating the PRD's original
call as unsettled BECAUSE the surrounding assumptions it rested on have
shifted, or wants the panel to weigh the real launcher-drift/concurrency
evidence against re-affirming it. This is carried into Phase 5 as something
every shaper must explicitly address, not smoothed over.
