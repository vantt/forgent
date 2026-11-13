# Research: how agent projects confine agent processes on Windows

Date: 2026-11-13 (Asia/Saigon). Requested by: HARDEN lead forgent-6a. Read only, nothing committed.
Background: `plans/reports/research-261113-1821-windows-runtime-support.md` §3.6 and D3 on `origin/research/windows-runtime-support`.

Markers: **[V]** read in source code or official docs. **[S]** secondary source (blog or directory). **[I]** my inference.

## 1. Bottom line

1. **The owner's plan offers two options. Shipped projects use a third and a fourth.** No shipped agent tool confines developer tools with plain AppContainer or LPAC. Codex, sandbox-runtime and Microsoft's own MXC all *explicitly exclude* AppContainer tiers. The two designs that ship today are:
   - **(A) MXC "ProcessContainer" (BaseContainer, PSEC).** This is a new Windows 11 OS tier from 2026. It is AppContainer-family, but it adds allow-list reads and writes, WFP egress rules and a kill-on-close job. It needs no admin rights, no extra user and no ACL edits. Codex ships it as `windows.sandbox = "mxc"`, its recommended mode where supported. sandbox-runtime ships it as an experimental backend. **[V]**
   - **(B) Dedicated sandbox user + write-restricted token + additive ACEs + WFP/firewall keyed on that user's SID.** This needs one-time elevated setup. Codex "elevated" uses it, and so does sandbox-runtime's default Windows backend (alpha). Because it runs as a different user, it also gives **read isolation of the caller's profile**, which a token alone cannot give. **[V]**
2. **Restricted token + Low integrity (the owner's option b) ships only in Gemini CLI.** It isolates writes only, and the label it leaves on granted directories persists. Codex's equivalent "unelevated" mode says outright that it cannot do deny-read. **[V]**
3. **Recommendation: probe MXC ProcessContainer first (via the `mxc-sdk` Rust crate, MIT). Use the sandbox-user design (B) as the fallback probe. Drop raw AppContainer/LPAC as a probe target.** Evidence and caveats are in section 4.
4. **The project the owner called "maus bot" is almost certainly MausBot / OpenMausBot** (high confidence, section 2). It has **no Windows confinement**. It boxes bot turns with bwrap only on its Linux cloud home, and on the desktop, Windows included, it relies on approvals and on each engine's own sandbox (for example Codex `workspace-write`).

## 2. Which project is "maus bot"

| Candidate | Fit | Evidence |
|---|---|---|
| **MausBot / OpenMausBot** (`milind-soni/OpenMausBot`, Supamaus Software) | **High.** The name matches exactly. It is in the same product space as fgOS: it runs Claude Code, Codex, OpenCode and Grok CLIs as persistent bots. About 22k stars, created 2026-08-11, active today. It boxes with bwrap, like fgOS. | GitHub API: Apache-2.0, desc "Open-source Grok Bot alternative with a virtual machine that bots can use" **[V]**; [everydev.ai listing](https://www.everydev.ai/tools/mausbot) **[S]** |
| Moltbot / Clawdbot / OpenClaw | Medium-low. The sound is similar ("Molt-bot"), but this is a chat-gateway agent, not a CLI-seat runner. | Covered below anyway. |
| Manus | Low. The name has no "bot". It is a cloud agent on E2B microVMs, and its "My Computer" desktop gates commands with approvals. | Covered below anyway. |

Confidence that the owner meant MausBot: about 80%. All three are covered below.

## 3. Per-project findings

### 3.1 MausBot / OpenMausBot (Apache-2.0)
- **Mechanism (Linux cloud only):** the "bot box" is unprivileged bubblewrap per bot turn. It covers the engine CLI, every shell command, MCP servers and helper proxies. It uses a private PID namespace and a netns with loopback only. Two unix-socket bridges lead out: an egress HTTP proxy that refuses private, metadata and LAN addresses, and a harness gate that only allows `/api/internal/`. The environment is an allow-list. Source: `docs/bot-box.md`, `server/bot-box/` (first commit `73d1a4383f`, 2026-10-21, "feat(cloud): the bot box, every bot turn in bubblewrap on a Cloud home") **[V]**.
- **What it protects:** reads (the data folder is replaced by an empty folder, and other bots' folders are absent), writes (only the turn workspace, the bot folder and HOME are RW) and network (proxy-only, no route out). It self-checks 23 probes at boot and supports mutation testing (`--mutate=bind-data,share-pid,...`) **[V]**. This is very close to fgOS's falsification-probe approach.
- **Windows:** `server/bot-box/detect.ts:67` returns `{box:"off", reason:"not-linux"}` on any non-Linux platform **[V]**. Desktop builds (Windows, macOS) run engines unboxed. Codex is started with its own `sandbox: "workspace-write"`, and the turn is refused if Codex does not echo back the requested policy (`server/drivers/codex.ts:181-199`) **[V]**. "Local VM" computer use is a Docker container (`trycua/xfce-cua`), hardened in `server/container-isolation.ts` **[V]**.
- **Lesson for fgOS:** they ship *delegation to the engine's native sandbox* plus a check that the engine applied it. That is a cheap middle tier between "unconfined" and "fgOS-owned confinement" **[I]**.

### 3.2 OpenClaw (formerly Clawdbot, then Moltbot) (MIT)
- **Mechanism:** sandboxing is off by default. Backends are `docker` (default), `podman`, `ssh`, `openshell` and `crabbox`. Modes are `off|non-main|all` (`docs/gateway/sandboxing/modes-scope-and-backend.md`) **[V]**. Docker network defaults to `none`, and workspace access is `none|ro|rw` (`supported-capability-matrix.md`) **[V]**.
- **Windows:** no native primitive. The recommended Windows Hub app provisions an app-owned `OpenClawGateway` **WSL distro** (`docs/platforms/windows.md`) **[V]**. The docs state: "This is not a perfect security boundary", and `tools.elevated` is an explicit escape hatch that runs outside the sandbox ([docs.openclaw.ai](https://docs.openclaw.ai/gateway/sandboxing)) **[V]**.

### 3.3 Manus
- **Mechanism:** a cloud agent in E2B Firecracker microVMs ([E2B case study](https://e2b.dev/blog/how-manus-uses-e2b-to-provide-agents-with-virtual-computers)) **[S]**. The "My Computer" desktop app (Windows, macOS) runs CLI commands on the host with per-command approval ([Manus blog](https://manus.im/en/blog/manus-my-computer-desktop)) **[S]**. I found no documented OS sandbox on the local side. Not open source.

### 3.4 OpenAI Codex CLI (Apache-2.0), the most mature Windows design
Source crates: `codex-rs/windows-sandbox-rs` (alpha landed `87cce88f48`, 2025-10-30, PR #4905; still active, last commit 2026-11-12) and `codex-rs/mxc-sandbox` (added `60888d0868`, 2026-09-04, PR #42841) **[V]**. Official docs: [learn.chatgpt.com/docs/windows/windows-sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox) **[V]**. Engineering post: [openai.com/index/building-codex-windows-sandbox](https://openai.com/index/building-codex-windows-sandbox/) (returned 403 to WebFetch, so read via secondary sources) **[S]**.

| Mode | Mechanism | Reads | Writes | Network | Setup |
|---|---|---|---|---|---|
| `mxc` (recommended where supported) | Microsoft MXC BaseContainer via PSEC. "It never invokes MXC's AppContainer dispatcher, edits host ACLs, creates sandbox users, runs setup, or requests elevation" (`mxc-sandbox/README.md`) | allow and deny paths, enforced by the OS | allow-list | loopback and proxy only; direct non-loopback egress denied | none. Needs Win11 24H2/25H2 build x.9278+ |
| `elevated` (legacy, preferred fallback) | two local users (`CodexSandboxOffline`/`Online`) + restricted token + ACEs for synthetic SIDs + firewall rules on the Offline user | `read_roots` allow-list and deny-read supported (`elevated_impl.rs:18-21`) | only where an ACE grants the synthetic SID | firewall deny on the Offline user | admin, once |
| `unelevated` (fallback) | `CreateRestrictedToken(DISABLE_MAX_PRIVILEGE \| LUA_TOKEN \| WRITE_RESTRICTED)` from the *current* user, with random `S-1-5-21-…` "capability SIDs" as restricting SIDs (`token.rs:42-44,500`; `cap.rs`) | **full read only**. `lib.rs:746-754`: "WRITE_RESTRICTED tokens consult restricting SIDs only for writes, so this backend cannot make capability-SID deny-read ACLs authoritative" | ACE-granted roots | env-level only ("weaker") | none |

- **Why not AppContainer** (secondary source, paraphrasing OpenAI): its default-deny reads would need so many exceptions for repos, toolchains, git config and caches that the boundary would become meaningless ([danielvaughan.com](https://codex.danielvaughan.com/2026/07/18/codex-cli-windows-sandbox-architecture-powershell-ast-safety-elevated-unelevated-appcontainer-restricted-tokens/)) **[S]**. `mxc-sandbox/src/lib.rs:98` "deliberately excludes MXC's older AppContainer fallback backends" **[V]**.
- **Limits:** under mxc, child processes die when the foreground command exits, and deny-read globs are evaluated at process start. Windows 10 is best effort. Error 1385 means a logon right was denied by enterprise policy **[V]**. Open bug: `codex exec` falls back to the unelevated path despite `elevated` being selected ([#40158](https://github.com/openai/codex/issues/40158)) **[V]**.
- **Inside:** the sandbox wraps the *commands Codex runs* (PowerShell, cmd, node, git). The Codex agent process itself is not inside it.

### 3.5 Claude Code / anthropics/sandbox-runtime (Apache-2.0)
- **Claude Code itself:** "On native Windows, Claude Code runs commands unsandboxed. To use the sandbox on a Windows machine, run Claude Code inside a WSL2 distribution." WSL2 uses bubblewrap. Caveat: Windows binaries (`cmd.exe`, `/mnt/c/...`) launched from WSL2 escape the sandbox unless the unix socket is blocked ([code.claude.com/docs/en/sandboxing](https://code.claude.com/docs/en/sandboxing)) **[V]**. `sandbox.failIfUnavailable` makes it refuse to start instead of falling back **[V]**.
- **sandbox-runtime (`srt`) Windows backend, alpha:** Rust helper `vendor/srt-win-src/` (`acl.rs`, `logon.rs`, `job.rs`, `sam.rs`, `runner.rs`; CI smoke scripts in `ci/smoke-*.ps1`) **[V]**. The README "Windows" section describes the design **[V]**:
  - One elevated `windows-install` creates the `srt-sandbox` local user and the `sandbox-runtime-users` group, and stores the password DPAPI-encrypted under HKLM.
  - Launch takes two hops. The broker calls `CreateProcessWithLogonW` to start a runner as `srt-sandbox`, and the runner starts the target under a **write-restricted token** inside a **job object**. Restricting SIDs are the sandbox user, Everyone, RESTRICTED, and one SID per `allowWrite` root.
  - **Reads:** the sandbox user has no rights on the caller's files by default, so the profile is unreadable unless granted. An optional profile-read grant opens tool directories but denies credential stores.
  - **Writes:** `allowWrite` roots only. ACEs are additive and never replace an existing descriptor. Write grants persist between sessions; other ACEs are reset with a refcount and crash recovery.
  - **Network:** machine-wide WFP `ALE_AUTH_CONNECT` filters block the sandbox SID except loopback to the proxy port range. `initialize()` proves the fence each session.
  - **Why a separate user:** it "structurally closes the surrogate-spawn class of escape (Task Scheduler, PARENT_PROCESS attribute, BITS, out-of-process COM)".
- **Known limits [V]:**
  - **Schannel fails under a restricted token**, which breaks `curl.exe`, .NET HttpClient, winget, cargo and git with schannel. Node, Python, Go and OpenSSL git work.
  - WFP gaps: tokens derived with `CreateRestrictedToken` (deny-only user SID) or impersonating the anonymous token are not fenced, and neither is traffic that system services carry for the process.
  - Shared multi-user machines can let another user write kept grants.
- **MXC backend (experimental), `windows.backend: 'mxc'`** **[V]**:
  - No install, user or ACL changes, and "MXC's AppContainer tiers are never used".
  - Works: the network fence, cmd, PowerShell, `git.exe`, node.
  - Limits:
    - **MSYS2 programs crash (`0xC0000005`)**, which covers Git Bash, `sh.exe` and git hooks run through `sh`.
    - UI must stay on, or user32/gdi32 loaders fail with `0xC0000142`.
    - `%TEMP%`/`%LOCALAPPDATA%` are per-command scratch.
    - The environment is sealed.
    - Host I/O stalls with several concurrent containers.
    - Inbound loopback is unavailable.

### 3.6 Gemini CLI (Apache-2.0)
- **Mechanism:** `packages/core/src/sandbox/windows/GeminiSandbox.cs`, a C# helper compiled at install, does the following **[V]**:
  - `CreateRestrictedToken(DISABLE_MAX_PRIVILEGE)` with no restricting SIDs, then `SetTokenInformation(TokenIntegrityLevel = S-1-16-4096 Low)` (lines 247-263).
  - A job object with KILL_ON_JOB_CLOSE.
  - `icacls /setintegritylevel Low` on writable paths and deny ACEs on "forbidden" paths, applied by `ApplyBulkAcls`.
  - The sandbox doc: "Integrity level changes remain after the session ends… reset with `icacls <path> /setintegritylevel Medium`" ([docs/cli/sandbox.md](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/cli/sandbox.md)) **[V]**.
- **Protects:** writes (Low IL cannot write Medium objects) and explicitly listed secret files (deny ACE). **Reads are otherwise open.** **Network is not blocked**: "no network" sets `JobObjectNetRateControl` MaxBandwidth = 1 (lines ~292-305), which is a throttle, not a fence, and only a warning is printed if that fails **[V]**.
- Other backends: Docker/Podman (cross-platform), Seatbelt (macOS), gVisor and LXC (Linux) **[V]**.

### 3.7 Cursor
- "On Windows, we run our Linux sandbox inside WSL2. Building an equivalent native Windows sandbox is significantly harder because most existing sandboxing primitives are tailored to browsers and do not support general-purpose developer tools… working with Microsoft to ensure the necessary primitives become available" ([cursor.com/blog/agent-sandboxing](https://cursor.com/blog/agent-sandboxing), 2026-02-18) **[V]**. Linux uses Landlock + seccomp, and macOS uses Seatbelt. Forum reports show `spawn EPERM` for node/esbuild on Windows, with the workaround "Legacy Terminal Tool", which disables the sandbox ([forum](https://forum.cursor.com/t/cursor-agent-terminal-spawn-eperm-on-windows/150268)) **[S]**. Closed source.

### 3.8 Microsoft MXC (`microsoft/mxc`, MIT, about 3.1k stars, created 2026-02-06)
- One SDK (Rust crate `mxc-sdk` 1.0.1, plus .NET and Node) over these backends: Windows `processcontainer` (default), `windows_sandbox`\*, `wslc`, `microvm`\*, `hyperlight`\*, `isolation_session`; Linux `bubblewrap`/`lxc`; macOS `seatbelt` (README) **[V]**. \* = experimental.
- `processcontainer` = "Windows process-level isolation through native PSEC (BaseContainer). Requests the host cannot fully enforce are rejected before container creation; … do not enable an AppContainer fallback" (`docs/schema.md:564`) **[V]**.
- The filesystem policy has `readonlyPaths`, `readwritePaths` and `deniedPaths`, plus an implicit `ALL_APPLICATION_PACKAGES` ACL baseline, which is AppContainer heritage (`docs/backends/process-container/filesystem.md`) **[V]**. The network policy uses WFP egress rules per container, with AppContainer capabilities `internetClient`/`privateNetworkClientServer` (`networking.md`) **[V]**.
- **OS floor:** Windows 11 24H2/25H2 build 26100/26200.9278 (KB5120998, Aug 2026). **Windows 10 and Windows Server are not listed** (`os-version-support.md`) **[V]**.
- `wxc-exec.exe --audit` is a "learning mode" that records denied accesses and drafts a policy **[V]**. That is useful for tuning a seat policy.
- **Telemetry:** the `1.1.0-alpha` request contract sends Required diagnostic data with no consent and no admin block. The `1.0.0` contract keeps optional, off-by-default telemetry (README) **[V]**. fgOS must pin 1.0.0 requests or accept this.

### 3.9 Container and microVM sandboxes, Windows Sandbox, WSL2
| Option | Mechanism | Windows host? | Fit for fgOS seats |
|---|---|---|---|
| Docker Sandboxes (`sbx`) | microVM per sandbox with its own kernel and Docker daemon; only the project dir is shared. Needs Win11 x64 + Windows Hypervisor Platform ([docker blog](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents/)) **[S]** | yes | Strong isolation, but the agent runs Linux in a VM, so Windows-native toolchains are not available. |
| E2B | Firecracker microVM, cloud. Infra repo `e2b-dev/infra`, Apache-2.0 **[S]/[V licence]** | no (remote Linux) | Remote only. |
| Daytona | OCI containers by default, Kata microVM optional. AGPL-3.0 per third-party; GitHub reports no SPDX ([northflank](https://northflank.com/blog/daytona-vs-e2b-ai-code-execution-sandboxes)) **[S]** | no (remote/self-host Linux) | Remote only. |
| Windows Sandbox | disposable Hyper-V VM. Win10/11 Pro, Enterprise or Education only (not Home). `wsb exec` CLI on 24H2. Docs say "doesn't allow multiple instances to run simultaneously" ([MS Learn CLI](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-cli)) **[V]** | yes | **Single instance means no parallel seats.** It boots a fresh VM, so the agent CLI and its logins must be re-provisioned each time. Unfit as a per-seat backend **[I]**. |
| WSL2 | Linux VM; Claude Code and Cursor run bwrap/Landlock inside it **[V]** | yes | Reuses fgOS's bwrap driver unchanged. But the agent works on Linux, not Windows, and Windows interop (`*.exe`, `/mnt/c`) escapes unless blocked **[V]**. This is a fallback tier, not Windows parity. |

## 4. Trade-off matrix and recommendation

Columns map to fgOS postures: hostRead **blind**, **write-limited**, **network**.

| Rank | Mechanism | blind reads | write-limited | network | admin | host residue | Node / git / agent CLI proven | OS floor | Shipped by |
|---|---|---|---|---|---|---|---|---|---|
| **1** | **MXC ProcessContainer** | yes (allow-list) | yes | yes (WFP per container) | no | none | node, git.exe, PowerShell, cmd: yes. **MSYS2/Git Bash: crashes** | Win11 24H2+ with Aug 2026 update | Codex (recommended), srt (exp.) |
| **2** | Sandbox user + write-restricted token + ACEs + WFP | yes for user data (separate user); system drive readable | yes | yes (with documented WFP gaps) | yes, once | kept ACEs, a local user, machine-wide WFP filters | node, Python, Go, OpenSSL git: yes. **Schannel clients: fail** | Win10/11 | Codex elevated, srt default |
| 3 | Restricted token + Low IL (owner's option b) | **no** | yes | **no real fence** (Gemini throttles) | no | persistent Low labels | yes (Gemini ships it) | Win10/11 | Gemini CLI; Codex unelevated is a variant |
| 4 | Raw AppContainer/LPAC (owner's option c) | yes | yes | yes | no | ACL grants to the container SID | **no shipped agent tool**. Codex, srt and MXC consumers exclude it. Cursor: "primitives tailored to browsers" | Win8+ | none found |
| — | WSL2 + existing bwrap | yes (inside the Linux view) | yes | yes | no | none | Linux toolchain only | WSL2 | Claude Code, Cursor |

**Recommendation: probe rank 1 first, rank 2 second, and skip rank 4.**
- **Why MXC first:** it is the only Windows primitive that reaches all three fgOS postures, including `blind`, without admin rights or host ACL residue. Two independent shipped consumers (OpenAI, Anthropic) have each validated node, git.exe and PowerShell inside it. It is the primitive Cursor said it was waiting for from Microsoft **[I]**.
  - **Architectural fit:** the `mxc-sdk` crate is Rust and MIT. It fits design principle 4 (Rust-first foundation components) and principle 3: a `mxc` confinement driver sits beside `bwrap` behind the same port. The SDK also wraps bubblewrap on Linux, but swapping fgOS's proven bwrap driver for it is out of scope (RUL104) **[I]**.
- **Why the owner's two options rank lower:**
  - Option b (Low IL) cannot meet `blind` and has no network fence. Two shipped projects document that ceiling: Codex `lib.rs:746-754`, and the Gemini helper uses only a throttle.
  - Option c (raw AppContainer) has no shipped precedent for developer tools. Its known failure, default-deny reads needing endless grants, is the stated reason Codex and Cursor avoided it. MXC exists to put a usable policy layer over that heritage.
  - A 2-3 day probe of raw AppContainer would mostly rediscover this **[I]**.
- **Why rank 2 is the fallback:** it covers Windows 10, Server and pre-Aug-2026 Windows 11, where MXC is absent. Two shipped implementations with detailed public threat notes exist to learn from (srt README "Known limitations"; Codex `windows-sandbox-rs`). The cost is admin setup and host residue, which conflicts with fgOS's "doctor never repairs" rule. Setup would need its own verb **[I]**.

**Probe scope (2-3 days, MXC first):**
1. Run the `node`, `git.exe`, `codex` and `claude` binaries under `wxc-exec.exe` (or `mxc-sdk`) with: workspace RW, run-output dir RW, agent home (`~/.claude` or `~/.codex`) RW, `readonlyPaths` for the toolchain, everything else unlisted, and egress allowed only to a loopback proxy.
2. Check Claude Code with Git Bash absent. It must fall back to its PowerShell tool, because MSYS2 crashes inside BaseContainer ([setup docs](https://code.claude.com/docs/en/setup): "If Git for Windows is not installed, Claude Code uses PowerShell") **[V]**. Also check whether the Bun-compiled `claude.exe` itself starts **[unknown]**.
3. Port 3-4 of the 9 bwrap falsification probes: host write outside grants denied, a peer run dir unreadable, the private machine dir hidden, direct egress blocked.
4. Note the CI gap: GitHub `windows-latest` is Windows Server, which is not on MXC's support list, so the proof needs a self-hosted Win11 runner **[I]**.

## 5. Open-source code to learn from

| Project | Path | License | What to learn |
|---|---|---|---|
| openai/codex | `codex-rs/mxc-sandbox/` (README + `src/lib.rs`) | Apache-2.0 | how a production Rust host drives MXC: probe, strict selection, no fallback, env/LOCALAPPDATA handling, path-precedence pitfalls (hard links, junction aliases) |
| openai/codex | `codex-rs/windows-sandbox-rs/src/` (`token.rs`, `cap.rs`, `acl.rs`, `deny_read_acl.rs`, `wfp.rs`, `elevated_impl.rs`, `no_reparse_dir.rs`) | Apache-2.0 | write-restricted token with synthetic SIDs, ACE planning with reparse-point canonicalization, WFP filter install, two-user elevated design |
| anthropics/sandbox-runtime | `vendor/srt-win-src/src/` (`logon.rs`, `job.rs`, `acl.rs`, `sam.rs`, `probe.rs`, `self_protect.rs`), `ci/smoke-*.ps1`, README Windows section | Apache-2.0 | separate-user two-hop launch, refcounted ACE reset with crash recovery, a self-probe of the egress fence at every init, the best written threat list (WFP gaps, Schannel), and the MXC backend's measured limits |
| microsoft/mxc | `src/mxc-sdk/`, `docs/schema.md`, `docs/backends/process-container/*`, `docs/learning-mode.md` | MIT | the BaseContainer policy model and audit-mode policy authoring |
| google-gemini/gemini-cli | `packages/core/src/sandbox/windows/GeminiSandbox.cs`, `WindowsSandboxManager.ts` | Apache-2.0 | the minimal Low-IL + job pattern, and what *not* to copy (throttle-as-network-block, persistent labels) |
| milind-soni/OpenMausBot | `server/bot-box/` (`box.ts`, `detect.ts`, `egress-gate.ts`, `self-check.ts`, `box-probe.ts`), `docs/bot-box.md`; `server/drivers/codex.ts:181-199` | Apache-2.0 | a bwrap seat box with a mutation-tested self-check (Linux), and checking that the engine echoed back the sandbox it was asked for (all OSes) |
| openclaw/openclaw | `docs/gateway/sandboxing/*` | MIT | the policy surface only (mode, scope, backend, required-by-role). No Windows primitive. |

## 6. Limitations of this research
- OpenAI's engineering post returned 403. Codex's AppContainer rationale comes from a secondary blog. The mechanism itself is verified in source.
- No code was run on Windows. Every "works or crashes" claim comes from the projects' own docs or measurements, not from fgOS testing.
- I did not check whether MXC ProcessContainer runs on Windows Server or Windows 10 beyond the support table, which lists only Win11. MXC's own AppContainer fallback tiers were not evaluated, because every consumer excludes them.
- Cursor, Manus and Docker Sandboxes are closed source, or I did not read their source. Their claims are as stated in their docs and blogs.
- I did not verify whether `claude.exe` (Bun) or `codex.exe` start inside BaseContainer. srt notes a Bun `fs` issue on the *host* side only.

## 7. Unresolved questions
1. Does fgOS's Windows target include Windows 10 or Server? If yes, rank 2 (sandbox user) is mandatory, not a fallback.
2. Is one elevated setup step acceptable for fgOS on Windows (rank 2)? This touches the install/setup/doctor gate: setup would need its own verb, and doctor would only point to it.
3. Is MXC 1.1.0-alpha's no-consent Required telemetry acceptable, or must fgOS pin the 1.0.0 contract?
4. Should a cheap interim tier be adopted now? It would delegate to the engine's native Windows sandbox (Codex `mxc`/`elevated`) and verify the policy it echoes back, as MausBot does, between "unconfined + warn" and fgOS-owned confinement.
5. Can the fgOS seat (the agent CLI process, not per-command) live inside one long-running BaseContainer? Codex notes that children die when the foreground exits, and srt reports I/O stalls with concurrent containers.

Status: DONE
Summary: The owner's "maus bot" is most likely MausBot/OpenMausBot, which has no Windows confinement (bwrap on its Linux cloud only). Shipped tools use Microsoft MXC ProcessContainer or a dedicated sandbox user with a write-restricted token, not raw AppContainer or Low IL. Recommendation: probe MXC first, with the sandbox-user design as the fallback.
Concerns/Blockers: MXC needs Windows 11 24H2+ with the Aug 2026 update, crashes MSYS2/Git Bash, and is absent on GitHub windows-latest (Server). Nothing was run on Windows.
