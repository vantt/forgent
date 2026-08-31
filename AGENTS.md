# forgent

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

- README.md — product description + documentation index
- docs/platform-foundations.md — L1-L8 locked design laws; L5 is this repo's definition of done (six questions, below)
- docs/specs/system-overview.md — area map, shared entities, cross-area flows
- docs/specs/reading-map.md — where every doc and source path in this repo lives
- docs/backlog.md — product backlog (PBI rows: proposed / in-flight / done)
- docs/routing-handoff-contract.md — agent-to-agent handoff contract + trust boundary
- docs/decisions/index.md — generated projection of platform/repo-wide decisions (`fgos decision-index`); narrative lives in docs/specs/<area>.md's own "Lịch sử quyết định" sections (tsk-1lv-4)
- domains/<domain>/AGENTS.md — domain-specific doctrine (e.g. domains/coding/AGENTS.md for fgos-coding-* workflows), read dynamically by fgos-routing

## Product priority order (D-ADR0030, docs/specs/runner.md)

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi.
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ hỏi người khi thật sự cần, và khi hỏi thì gom thành bộ để mỗi lần người quay lại trả lời được nhiều nhất rồi đi tiếp. Một câu hỏi treo không được nghẽn phần việc khác của cùng item còn tiến được — stage/skill vì vậy phải chia nhỏ, mịn, mỗi mảnh park/tiến độc lập.
3. **DoD** — reproducibly verifiable result + evidence-linked documentation.
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope.

Tốc độ ở mục 1 là tốc độ ship của **project đang DÙNG fgOS** (fgOS không loại trừ khi tự dogfood) — không phải tốc độ tự thân team fgOS build một tính năng của chính fgOS. Đừng chọn phương án rẻ để fgOS tự triển khai nếu nó làm project dùng fgOS chậm hơn.

Thứ tự cố định — bậc dưới không ghi đè bậc trên. Chi tiết: docs/specs/runner.md's "Lịch sử quyết định" § D-ADR0030 (mở rộng D-ADR0025; narrative đầy đủ, docs/decisions/*.md corpus đã retired tsk-1lv-4).

## Ranh giới sứ mệnh (D-ADR0035, docs/specs/platform-foundations.md)

fgOS tồn tại để: 
 1. phát triển các project khác 
 2. làm nền vận hành các business base workflow 
 
fgOS KHÔNG phải để (3) tự phát triển chính nó. Mission #3 là dogfood cần thiết trong lúc xây, không phải lý do fgOS tồn tại.  Khi làm việc trong chính repo (nơi fgOS tự-host trên chính source của mình), đừng mặc định coi "sửa fgOS" là mục tiêu chỉ vì đó là việc trước mắt — hỏi việc đang làm có phục vụ mission #1/#2 (năng lực fgOS mang lại cho project/workflow khác) hay chỉ tiện cho chính đội fgOS (mission #3). fgOS đã cài global và đang vận hành thật trên nhiều project khác ngoài repo này — mission #1/#2 không phải lý thuyết. Chi tiết + bằng chứng: docs/specs/platform-foundations.md's "Lịch sử quyết định" § D-ADR0035 (docs/decisions/*.md corpus đã retired tsk-1lv-4).


## Before touching code

Read `docs/specs/reading-map.md`, then the area spec under `docs/specs/` for whatever
you're about to change. Specs are the state layer — BA-grade, tech-agnostic — read
the spec before the code.

## Definition of done (platform-foundations L5)

A stranger agent with no chat history should be able to answer, for any change:

1. **What to read first?** `docs/specs/reading-map.md`, then the relevant area spec.
2. **What kind of work is this?** Check it against the area's spec and
   `docs/backlog.md`; a new product area gets a spec before it gets code.
3. **What contract does it touch?** `docs/routing-handoff-contract.md` for
   agent-to-agent boundaries; the area spec's Shared Entities table for
   in-process contracts.
4. **How much risk?** Does it change a locked law in `docs/platform-foundations.md`,
   or existing covered behavior in the test suite? Either raises the bar.
5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) green;
   new or changed behavior gets a matching test.
6. **What learning gets left behind?** A settled decision goes into
   `docs/decisions/`; a settled spec fact goes into the relevant
   `docs/specs/<area>.md`.

## Install/setup/doctor gate

`docs/distribution-vision.md` sets the direction for this repo's own
cài đặt/setup/doctor story. Before any change is done, ask:

- Does this add a config default, env var, or infra dependency (a new
  file it expects to exist, a tool it shells out to, a directory it
  assumes is writable)? If yes, it must register into `fgos setup`'s
  config-merge and `fgos doctor`'s check registry (`src/setup/checks.mjs`)
  — not stand alone, undiscoverable by `doctor`.
- Never hardcode an assumption about which install level (global vs
  project) is active — per the vision doc, project config always
  overwrites global, and fgOS stays aware of both without conflict.
- If the change touches how fgOS gets installed, upgraded, or diagnosed at
  all, read `docs/distribution-vision.md` and `docs/specs/distribution.md`
  first — a new module gets a spec/config-registry entry before it gets
  code, same bar as a new product area (question 2 above).
- Does this change something a user of fgOS would see? If yes, add a line
  to `## [Unreleased]` in `CHANGELOG.md`.

## Changing a locked law

Laws in `docs/platform-foundations.md` are fixed until their named review
threshold is hit. Changing one supersedes its decision ID — never edit it in place.

## RUL11 — tùm lum, không phải nặng (D-ADR0036, docs/specs/platform-foundations.md)

Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của
tình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum, gom lại — gom
tới khi hết; quy mô không bao giờ là lý do miễn trừ. Đích của mọi lần gom
là một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến
hình dễ, không chắp vá.

khong phai no nang ma no tum lum

## Dispatch — routing work to a executor

**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `node src/runner/dispatch.mjs decide` first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it runs `decide` for you and refuses the call when the answer comes back as anything other than `in-process`.

Four ways to call `decide`, for four different situations:

- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).
- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.
- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.
- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name.

Add `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed.

Three possible `mechanism` results, each needing a different response:

- **`"unavailable"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.
- **"in-process"** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.
- **`"out-of-process"`** — run `node src/runner/dispatch.mjs execute`. Never run the resolved command yourself through Bash: `execute` invokes the adapter and hands back the real result. (For a worktree-backed item, if passing explicit directory flags, pass `--cwd <worktree path>` and `--repo-root <main checkout path>` as two separate flags — never pass the main checkout as `--dir` alone).

Every result also carries `configured: true|false` — `false` means nothing is configured for that name or job, and the answer came from the default.

A skill that dispatches should not re-derive any of this. Point its reasoning step at the shared fragment `.agents/skills/_shared/executor-dispatch-fallback.md` (mirrored byte-identical at `plugins/fgOS/skills/_shared/`). `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own.

## Starting the herdr gateway — one door, never a raw process

**If a task needs the herdr-fgos gateway (REST API + web dashboard) running, run `fgos gateway start` — never a hand-rolled `cargo run`/`nohup`/`tmux`/systemd invocation.** (tsk-31v) This is the one place that builds the release binary and spawns it detached, so the process outlives the CLI call. `fgos gateway status` reports real liveness plus an actual `/v1/contract` reachability check; `fgos gateway stop` sends SIGTERM and clears the registry. The gateway's own MCP surface (`search`/`execute`, `herdr-plugin/src/mcp.rs`) is mounted on this SAME process — it cannot bootstrap itself, so starting the gateway is always a `fgos` CLI call, never an MCP tool call.

<!-- mdview:START -->
## Documentation Viewing (MDView)

After creating or updating any markdown file, make it viewable in ONE call —
no project registration step needed:

### Using MCP (preferred)

Call `mdview_view_file` with:

- `project_root`: absolute path to the project root
- `relative_path`: the file path relative to that root

It returns a browser `url`. Tell the user: "You can view this at: `<url>`".
The server auto-registers the project on first use and indexes the file
immediately.

### Using CLI fallback

```sh
mdview open <absolute-path-to-file.md>
```

### When to render

Spin up a preview for long docs, tables, Mermaid diagrams, multi-file document
sets, or when the user asks to "preview"/"render". Skip it for short, trivial
snippets.
<!-- mdview:END -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **forgent** (26672 symbols, 36902 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/forgent/context` | Codebase overview, check index freshness |
| `gitnexus://repo/forgent/clusters` | All functional areas |
| `gitnexus://repo/forgent/processes` | All execution flows |
| `gitnexus://repo/forgent/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
