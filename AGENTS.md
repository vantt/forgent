# forgent

**The Foundation for Generative Agents.**

Forgent (fgOS) is the platform layer for building and running agent applications — the infrastructure, skills, and automation that sit beneath every agent app, so developers can forge new agents instead of building everything from scratch.

- README.md — product description + documentation index
- docs/platform/platform-foundations.md — L1-L10 locked design laws; L5 is this repo's definition of done (six questions, below)
- docs/platform/system-overview/spec.md — area map, shared entities, cross-area flows
- docs/reading-map.md — where every doc and source path in this repo lives
- docs/backlog.md — product backlog (PBI rows: proposed / in-flight / done)
- plans/261017-1313-fgos-platform-program-board/plan.md — platform program board (lanes, waits, shared-file collisions). Do not read it by default. Open it only when you start, finish, block or land a platform lane (lock/git/state/config/runner): read the "Các luồng" and "File chung dễ va" sections, update your own lane's row, and add one line at the top of its `log.md`. Never read `log.md` whole; grep it by lane ID, date or commit.
- docs/platform/runner/contracts/routing-handoff.md — agent-to-agent handoff contract + trust boundary
- docs/decisions/index.md — generated projection of platform/repo-wide decisions (`fgos decision-index`); narrative lives in each area's spec.md "Lịch sử quyết định" section and in decisions/ where present; resolve renamed/split scopes through docs/platform/governance.md#decision-scope-to-holder-table
- domains/<domain>/AGENTS.md — domain-specific doctrine (e.g. domains/coding/AGENTS.md for fgos-coding-* workflows), read dynamically by fgos-routing

## Product priority order (D-ADR0030, docs/platform/runner/decisions/h-36d872fbb0e5.md#0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm)

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi.
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ hỏi người khi thật sự cần, và khi hỏi thì gom thành bộ để mỗi lần người quay lại trả lời được nhiều nhất rồi đi tiếp; mỗi câu theo mẫu câu hỏi quyết định (`core/skills/_shared/decision-question.md`). Tự quyết trong khung đã duyệt (phạm vi + ngân sách ghi lúc duyệt); sắp vượt khung thì dừng và hỏi theo mẫu. Một câu hỏi treo không được nghẽn phần việc khác của cùng item còn tiến được — stage/skill vì vậy phải chia nhỏ, mịn, mỗi mảnh park/tiến độc lập.
   Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng.
3. **DoD** — reproducibly verifiable result + evidence-linked documentation.
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope.

Tốc độ ở mục 1 là tốc độ ship của **project đang DÙNG fgOS** (fgOS không loại trừ khi tự dogfood) — không phải tốc độ tự thân team fgOS build một tính năng của chính fgOS. Đừng chọn phương án rẻ để fgOS tự triển khai nếu nó làm project dùng fgOS chậm hơn.

Thứ tự cố định — bậc dưới không ghi đè bậc trên. Chi tiết: docs/platform/runner/decisions/h-36d872fbb0e5.md#0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm's "Lịch sử quyết định" § D-ADR0030 (mở rộng D-ADR0025; narrative đầy đủ, docs/decisions/*.md corpus đã retired tsk-1lv-4).

## Ranh giới sứ mệnh (D-ADR0035, docs/platform/platform-foundations.md#0035-xác-lập-ranh-giới-sứ-mệnh-fgos-phục-vụ-project-khácbusiness-workflow-không-tự-phát-triển-chính-nó-mặc-định)

fgOS tồn tại để: 
 1. phát triển các project khác 
 2. làm nền vận hành các business base workflow 
 
fgOS KHÔNG phải để (3) tự phát triển chính nó. Mission #3 là dogfood cần thiết trong lúc xây, không phải lý do fgOS tồn tại.  Khi làm việc trong chính repo (nơi fgOS tự-host trên chính source của mình), đừng mặc định coi "sửa fgOS" là mục tiêu chỉ vì đó là việc trước mắt — hỏi việc đang làm có phục vụ mission #1/#2 (năng lực fgOS mang lại cho project/workflow khác) hay chỉ tiện cho chính đội fgOS (mission #3). fgOS đã cài global và đang vận hành thật trên nhiều project khác ngoài repo này — mission #1/#2 không phải lý thuyết. Chi tiết + bằng chứng: docs/platform/platform-foundations.md's "Lịch sử quyết định" § D-ADR0035 (docs/decisions/*.md corpus đã retired tsk-1lv-4).


## Before touching code

Read `docs/reading-map.md`, then the area or subcomponent spec under `docs/platform/` for whatever
you're about to change. Specs are the state layer — BA-grade, tech-agnostic — read
the spec before the code.

**Prior art before design.** Before designing a mechanism, find out what already existed
and why it went away: `git log -S'<symbol>'` / `-G` on the symbol, config key and spec term,
also under the executor ids and names the thing had before the renames (ids were renamed and
dormant ones deleted), and read the area spec's "Lịch sử quyết định" and settled-facts
sections. A plan's facts phase answers "what existed before, and which change removed it,
and was that intended?" next to its questions about current code. Reuse or extend what is
found; say in the plan what was reused and what was missing.
**Convention paths.** For report, plan, and journal names and locations—including paths placed in briefs for other agents—use `fgos convention name|path --json`, never construct them; parallel agents MUST choose distinct slugs, and pre-commit `convention check` warnings do not block commits.

## Definition of done (platform-foundations L5)

A stranger agent with no chat history should be able to answer, for any change:

1. **What to read first?** `docs/reading-map.md`, then the relevant area spec.
2. **What kind of work is this?** Check it against the area's spec and
   `docs/backlog.md`; a new product area gets a spec before it gets code.
3. **What contract does it touch?** `docs/platform/runner/contracts/routing-handoff.md` for
   agent-to-agent boundaries; the area spec's Shared Entities table for
   in-process contracts.
4. **How much risk?** Does it change a locked law in `docs/platform/platform-foundations.md`,
   or existing covered behavior in the test suite? Either raises the bar.
5. **What proof means done?** `npm test` (state + cli + runner + e2e suite) and
   `cargo test --workspace` green. Every behaviour has one owning proof, at the
   lowest layer that can observe it; a boundary above it gets at most one wiring
   proof, never a second copy of the cases (design principle 8). Before adding a
   test, find the behaviour's owning proof and extend it; deleting or replacing a
   mechanism retires its tests in the same change. Green must come from real
   behavior: never add an env switch, flag, or test-only code branch that skips
   checks to make tests pass; fix production code or the fixture instead.
6. **What learning gets left behind?** A settled decision narrative goes into
   the area's `spec.md` decision-history section, or `decisions/` where present; a settled fact goes into the exact area or
   subcomponent `spec.md`. Resolve both through
   `docs/platform/governance.md#decision-scope-to-holder-table`.

## Scratch artifacts

Keep draft scripts, logs, patches and dumps out of the repository root. Use
`.fgos/runtime/tmp/`, falling back to `${TMPDIR:-/tmp}/fgos-work/`.
`.githooks/pre-commit` owns the single root-file allowlist and refuses new root
files outside it, including linked worktrees. Legitimate root additions require
an allowlist change in a separate commit, landed on main before the addition.
The hook runs only when wired via `npm run setup:hooks`; `fgos doctor` checks
that wiring with `main-checkout-hook-wired`. `MERGE_HEAD` skips the root
guard, and the `.fgos` deletion and worker guards accept only a staged entry
equal to the merge parent's where that parent changed it since the merge base;
no other data-loss guard is skipped.

## Destructive cleanup

Never hand-roll deletion of ignored or untracked files or directories (`git status --ignored | xargs rm`, `git clean -x`, `rm -rf` on a computed list).
Use `fgos worktree remove --discard-ignored`, or `git -C "$W"` after asserting `$W` is a registered linked worktree (`git worktree list`).
Never chain a destructive step after `cd` with `;` or `&&` from a failed create; the main checkout holds the active release and run history.
If the main checkout lost ignored paths, follow `docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`.

## Legacy-Node CLI Ownership Boundary

Rust `fgos` is the standard door for every verb. `bin/fgos.mjs` is the
`legacy-node` payload entry, staged whole under a release's
`components.legacyNode.root` and exec'd by the Rust host at
`components.legacyNode.entry` — never relocated or renamed in the source tree.
The host resolves it only through those manifest fields, never PATH, cwd or
hardcoded locations outside the manifest. Global npm `bin.fgos` and
`node bin/fgos.mjs` call this entry directly but are unsupported for the
process, lock and identity verbs: the in-process door loads only the addon of
the activated release whose payload is running, so from a checkout those verbs
refuse by name (`process-door-not-shipped`, `lock-driver-unavailable` with
reason `addon-not-shipped`, `host-missing`). Run working-tree code through
`npm run fgos:dev -- <verb>` instead. Every state write resolves the writer
identity through the Rust host (`docs/platform/identity/spec.md`), so these
channels write only inside an activated project or with `FGOS_HOST_BIN` set to
a host binary. The git hook is a cold client of the activated host and is
unaffected.

Plain `fgos` runs the activated release recorded in
`.fgos/installation/activation.json`, not newly edited `bin/` or `src/` bytes.
Use `npm run fgos:dev -- <verb> [args]` to run working-tree code through the Rust
host. It preserves caller cwd via `INIT_CWD`, honors `CARGO_TARGET_DIR`, and
materializes confined per-invocation artifacts under `.fgos/runtime/dev-host/`,
removing only its own directory after the child exits unless a process (such
as a detached run supervisor) still runs from it; a later invocation prunes
such directories once nothing runs from them. Serialize invocations
across worktrees only where their Cargo target is actually shared.

`fgos doctor` check `active-release-matches-checkout` compares the owned source
checkout's working-tree Node payload with its activation; it does not certify
Rust freshness. Dependencies do not count as drift, but symlink/unsafe manifest
entries still fail. It skips activation owned by main from a linked worktree
and the same-checkout dev manifest. To update plain `fgos`, build/stage/activate
the intended tree, then verify doctor through the installed shim. Old-release
`fgos setup` can overwrite generated render headers until that release is
restaged; activation never refreshes itself merely because source was edited.

## Install/setup/doctor gate

`docs/platform/packaging-distribution/history/distribution-vision.md` sets the direction for this repo's own
cài đặt/setup/doctor story. Before any change is done, check:

- A new config key goes into `core/config-standard` and `core/config-schema`;
  nothing registers a default anywhere else (`fgos setup` is deprecated).
- A new runtime dependency (a tool it shells out to, a file or directory it
  expects, a platform capability) needs a readiness row in doctor
  (`src/setup/registrations.mjs`), and a registered fix only when the repair
  is safe and about readiness.
- A new runtime state or incident class must be reportable and repairable
  through its component's own verb, on that component's normal path, never
  only through doctor. Doctor may carry one read-only pointer row for it
  ("N open, run <verb>"): it warns, never repairs, and never fails except the
  cases `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md`
  section 3 names.
- A rule about the fgOS repo's own files goes into `npm test`, CI, pre-commit
  or the release check, never into doctor.
- Never hardcode an assumption about which install level (global vs
  project) is active — per the vision doc, project config always
  overwrites global, and fgOS stays aware of both without conflict.
- If the change touches how fgOS gets installed, upgraded, or diagnosed at
  all, read `docs/platform/packaging-distribution/vision.md` and `docs/platform/packaging-distribution/spec.md`
  first — a new module gets a spec/config-registry entry before it gets
  code, same bar as a new product area (question 2 above).
- Does this change something a user of fgOS would see? If yes, add a line
  to `## [Unreleased]` in `CHANGELOG.md`.

## Changing a locked law

Laws in `docs/platform/platform-foundations.md` are fixed until their named review
threshold is hit. Changing one supersedes its decision ID — never edit it in place.

## RUL11 — tùm lum, không phải nặng (D-ADR0054, supersedes D-ADR0036, docs/platform/platform-foundations.md#0054-rul11-tùm-lum-không-phải-nặng-gom-trong-phạm-vi-việc-đang-làm-supersede-0036)

Việc trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của
tình trạng đó là tùm lum, không phải nặng. Khi thấy tùm lum trong phạm vi
việc đang làm, gom lại — gom tới khi hết; quy mô không bao giờ là lý do miễn
trừ. Tùm lum thấy ngoài phạm vi thì ghi thành item riêng; gom mà phải xây
công cụ mới là một câu hỏi quyết định. Đích của mọi lần gom
là một hình dạng duy nhất: ranh giới rõ, contract tường minh, đổi và biến
hình dễ, không chắp vá.

khong phai no nang ma no tum lum

## RUL104 — tốt hơn, không to hơn (D-ADR0062, supersedes D-ADR0061, docs/platform/platform-foundations.md#0062-rul104-tốt-hơn-không-to-hơn-thêm-clean-code-và-hexagonal-supersede-0061)

Khi audit, soát lại hay làm cứng phần đã có, mỗi thay đổi phải làm thứ đang
có tốt hơn: ổn định hơn, nhanh hơn, nhẹ hơn, code đơn giản hơn theo các
nguyên tắc clean code và kiến trúc hexagonal (ports và adapters) khi áp dụng
được; API, signature và contract rõ ràng, tường minh, dễ dùng và uyển chuyển
hơn — trong phạm vi code đang có. Không làm nó to ra: không thêm tính năng,
lớp hay cơ chế mới; đổi một contract thì chuyển mọi caller và xoá đường cũ
trong cùng đợt (L10). Một tính năng chỉ được thêm khi thật sự đáng: gom mọi
ý tưởng thêm vào một mục riêng của báo cáo, mỗi ý ghi lý do (vấn đề thật,
bằng chứng) và lợi ích, và chỉ làm sau khi owner chọn.

tốt hơn, không to hơn

## Dispatch — routing work to an executor

`fgos run` is the primary door for executing new work in the execution core.

**Two doors, one runUnit — the preferred path for new work.** One task: `fgos run "<prompt>" [--provider <id>] [--writes <paths> --worktree <path>]` builds a Unit from the prompt (read-only without `--writes`; `--writes` needs a linked worktree; `--provider` is a soft preference, not a pin). Planned work: `fgos workflow start <preset>|--units <file>`, one step per Unit. Both bind through `bind()`; the runner commits only the Unit's declared `writes` after a passing round, and the worker never runs `git add`/`git commit`. These two doors are the only ones that execute work; `fgos dispatch` keeps only the lower-level reads (`decide`, `inspect`, `reconcile`, `probe-account`).

For routing checks, `fgos dispatch decide` computes the execution mechanism and executor via `bind()` (`src/runner/execution/bind.mjs`). herdr is the default transport when present in the session/environment.

**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` (or compatibility alias `node src/runner/dispatch.mjs decide`; `--work` only through `fgos dispatch decide`) first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it delegates to `bind()` and refuses the call when the answer comes back as anything other than `in-process`.

Four ways to call `decide`, for four different situations:

- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).
- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.
- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.
- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name.

Add `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed.

Three possible `mechanism` results, each needing a different response:

- **`"unavailable"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.
- **`"in-process"`** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.
- **`"out-of-process"`** — run `fgos run "<prompt>" --provider <executorId> --capability <purpose> [--writes <paths> --worktree <linked-worktree>]` (or `fgos run --unit <file>`), passing the same capability `decide` was asked for (left out, it defaults to the writing capability `execute`). `--provider` takes agent executors only: when the decided executor is a `kind: "tool"` executor, `fgos run` refuses it, so call that tool directly instead. Never run the resolved command yourself through Bash: `fgos run` binds, runs and settles the Unit and records its provenance under `.fgos/assignments/<unitRunId>/`, so there is nothing to log by hand. With `--writes` the runner commits only those paths after a passing round; with `--json` read the result at `data.results[-1].runResult.agentClaim.summary` and `data.results[-1].commit`.

Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.
A skill that dispatches should not re-derive any of this. Reference `../_shared/executor-dispatch-fallback.md` from the skill; its canonical source is `core/skills/_shared/executor-dispatch-fallback.md`. `.agents/skills/` and `plugins/fgOS/skills/` are generated render surfaces carrying source headers, rebuilt with `npm run build:skills`; never edit them by hand. For fgOS thin wrappers, `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own.

## Starting the fgos gateway — one door, never a raw process

**If a task needs the fgos gateway (REST API + web dashboard, binary `fgos-gateway` built from `apps/fgos-gateway`) running, run `fgos gateway start` — never a hand-rolled `cargo run`/`nohup`/`tmux`/systemd invocation.** (tsk-31v) This is the one place that builds the release binary and spawns it detached, so the process outlives the CLI call. `fgos gateway status` reports real liveness plus an actual `/v1/contract` reachability check; `fgos gateway stop` sends SIGTERM and clears the registry. The gateway's own MCP surface (`search`/`execute`, `apps/fgos-gateway/src/mcp.rs`) is mounted on this SAME process — it cannot bootstrap itself, so starting the gateway is always a `fgos` CLI call, never an MCP tool call.

<!-- mdview:START -->
## Impact-analysis capability gate

The GitNexus "Always Do" / "Never Do" rules below assume GitNexus is
present on this machine. Before treating them as binding — and before
`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`
decide how much
impact-analysis evidence a plan's verify/test scope needs — query the
capability instead of assuming the tool:

```bash
fgos tool query --capability impact-analysis --status present
```

- **0 providers registered** — Inactive: skip impact-analysis evidence in
  verify/test scope; note `impact-analysis: inactive` in the plan/verify
  note. Not a gap.
- **Registered but not `present`, or `present` but flagged `stale`** —
  Degraded: run every other required check, mark that proof weak, and name
  the gap plainly (e.g. "GitNexus registered but not present on this
  machine — blast radius not confirmed", or "GitNexus present but its
  index is behind the current HEAD — blast radius may be stale"). A
  `present` status only means the tool is installed, never that its index
  is fresh or intact (tsk-j7y) — a suspicious zero-result or "not found"
  answer from an impact-analysis tool is worth a quick grep/rg cross-check
  before being trusted, regardless of what `fgos tool query` reports.
- **`present`, freshly checked** — Full: the MUST rules below apply exactly
  as written. A `full` posture still is not a guarantee of complete
  per-file coverage: a genuinely fresh, non-stale index can still carry
  zero indexed symbols for one large/complex file (tsk-38h — confirmed on
  `bin/fgos.mjs`, 5000+ lines, zero indexed `Function` symbols even
  immediately after a fresh reindex), a distinct mechanism from staleness
  that the cross-check line above already covers unconditionally.

**Multi-target resolution:** if the active impact-analysis providers tool errors because more than one target/repo is registered and needs disambiguation (e.g. "multiple ... indexed" / "not found"), never guess and never reuse any display string quoted in that error -- it is not guaranteed to be a valid value to pass back in. Instead, look at that same MCP servers own tool list for a listing/discovery tool (name suggests enumeration -- list/search/discover), call it to read back the exact registered identifiers, and match this project by a stable field it reports (an absolute path/scan-root, never a human-readable label) before retrying with that exact identifier (tsk-5nz).

This gate is prose the agent reads, never compiled logic — GitNexus is
the first registered provider for `impact-analysis`, not the only one
this gate can ever recognize. The block below regenerates from
GitNexus's own template on `gitnexus analyze`; edit this gate section
when the policy changes, never the rules inside the block.

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

This project is indexed by GitNexus as **forgent** (58821 symbols, 81138 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

<!-- fgos:instruction-projection:start -->
<!-- generated by fgos instruction projection; edit canonical instruction sources, not this block -->
<!-- effective-set: .fgos/instructions/effective/repo.json; key=repo; host=* -->

## fgOS Effective Instructions

### law

#### Decision Question Template

- id: `decision-question-template`
- source: `core/instructions/decision-question.md`

# Decision Question Template

Every question asking the owner to choose a direction carries five parts: what is happening, cause, options with cost, recommendation, and scope of the answer. Full template: `core/skills/_shared/decision-question.md`. Inside the approved frame (scope + budget set at approval) decide and report; about to leave it, stop and ask in this template.

#### Platform Operating Laws

- id: `platform-operating-laws`
- source: `core/instructions/platform-laws.md`

# Platform Operating Laws

Platform laws L1-L10 are locked in `docs/platform/platform-foundations.md#luật-nền-platform-forgent-phase-0-compound-learning-stack` and define immutable platform invariants for fgOS:

- **L1 — Hai vật lý của tri thức: Log vs State** (`docs/platform/platform-foundations.md#l1-hai-vật-lý-của-tri-thức-log-vs-state`)
- **L2 — Kiến trúc memory hai tầng** (`docs/platform/platform-foundations.md#l2-kiến-trúc-memory-hai-tầng`)
- **L3 — Luật store: truth ở JSONL, db là view** (`docs/platform/platform-foundations.md#l3-luật-store-truth-ở-jsonl-db-là-view`)
- **L4 — Routing model theo audience của từng interface** (`docs/platform/platform-foundations.md#l4-routing-model-theo-audience-của-từng-interface`)
- **L5 — Definition of done: sáu câu hỏi** (`docs/platform/platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi`)
- **L6 — Maturity ladder F0–F5** (`docs/platform/platform-foundations.md#l6-maturity-ladder-f0f5`)
- **L7 — Durability ladder** (`docs/platform/platform-foundations.md#l7-durability-ladder`)
- **L8 — Doctrine placement rule (always-loaded layer)** (`docs/platform/platform-foundations.md#l8-doctrine-placement-rule-always-loaded-layer`)
- **L9 — Thang hoàn tất của MỘT việc: run ≠ merge ≠ durable** (`docs/platform/platform-foundations.md#l9-thang-hoàn-tất-của-một-việc-run-merge-durable`)
- **L10 — Add-through-not-alongside: mở rộng QUA cửa, không đắp CẠNH cửa** (`docs/platform/platform-foundations.md#l10-add-through-not-alongside-mở-rộng-qua-cửa-không-đắp-cạnh-cửa`)

Authoritative statements, rationales, evidence sources, and review thresholds are defined exclusively in `docs/platform/platform-foundations.md#luật-nền-platform-forgent-phase-0-compound-learning-stack`. Changing any locked law requires superseding its decision ID rather than editing in place.

### procedure

#### Design Principles

- id: `design-principles`
- source: `core/instructions/design-principles.md`

# Design Principles

These apply to every change. Each line says what to do; where a mechanical
check exists it is named, otherwise the reviewer checks it.

1. **One door.** Before adding a function, module, helper or mechanism, search
   for one that already does the job (`rg` its name and the primitive it
   touches, such as `/proc/`, `renameSync` or `.fgos` path resolution) and
   reuse or extend it; say in the plan or commit what you reused. When you
   replace a mechanism, move every consumer and delete the old path in the
   same change; if you cannot, open an item for the rest (L10).
2. **Strict bottom-up layering.** A lower layer defines its own conventions and
   never knows the layers above it; upper layers adapt to it. Shared primitives
   (process identity, liveness, atomic writes, path resolution) live in the
   lowest layer that needs them, not in a feature or adapter module. When an
   import guard blocks you, import the shared leaf module it names; never copy
   the code. Checked by `test/architecture.test.mjs` against
   `docs/architecture-manifest.json`.
3. **Hexagonal and pluggable.** Keep shared logic independent of any one tool;
   the CLI, herdr, tmux and each agent CLI are thin, replaceable drivers behind
   a port.
4. **Independent foundation components, Rust first.** Platform-wide foundations
   (session identity, terminal control, and the like) are separate components,
   built in Rust and used across the whole system.
5. **Correctness and stability first.** Decide from the real OS and system
   state, not from an in-memory copy that can drift; control concurrency and
   guard every boundary.
6. **KISS and DRY.** Keep the algorithm small, remove duplicated code, and add
   no file or intermediate layer you do not need.
7. **One authority, one source of truth.** Each component owns exactly one kind
   of decision. Code and its documentation agree at one source; generated text
   is regenerated from its source, never copied by hand.
8. **One proof.** A behaviour, not a line, is what a test preserves. Each
   behaviour has one owning proof at the lowest layer that can observe it, and
   each boundary above it (Node route over a Rust port, CLI over a use case, e2e
   over CLI) has at most one wiring proof. A new test names its behaviour in plain
   words in its title, says why no existing test proves it, and lands in the file
   that owns that module unless the module or boundary is new. Weakening means
   asserting less about a behaviour that still exists, and it is forbidden;
   retiring a proof whose behaviour is gone, or whose cases another named test
   owns, and moving or merging proofs are not weakening. A change that retires a
   test names the test that now owns the behaviour, or says the behaviour was
   removed. Reports never count "all N assertion lines kept" as success.

#### Id Minting

- id: `id-minting`
- source: `core/instructions/id-minting.md`

# Id Minting

Every id that travels between machines (a work item, a backlog row, a `D-ADR####` decision number, a decision file number) comes from `fgos identity mint <kind>` (`work`, `backlog`, `d-adr`, `decision-file`; `--json` for machine output). Never read the highest number and add one, never derive an id from a title. The mint door owns the rule (`docs/platform/identity/spec.md`, section 4a); a `d-adr` or `decision-file` claim needs the network and fails clearly without it, and the format never changes to work around that.

<!-- fgos:instruction-projection:end -->

<!-- AGENTKIT-OMP:START:engineer -->
# Development Rules

Use this file when editing code, tests, scripts, or configuration.

## Baseline

- Follow project docs in `docs/` and existing local patterns.
- Apply KISS and DRY. Deliver the full requested scope — do not trim, defer, or
  simplify away features the user explicitly asked for. Add nothing beyond the
  request. When the user passes `--yagni`, additionally apply YAGNI (You Aren't
  Gonna Need It): challenge and cut any scope not needed for the stated outcome.
- Implement real behavior. Do not add fake data, mocks, or temporary shortcuts just to satisfy a check.
- Keep changes scoped to the request and the affected contracts.
- Use descriptive kebab-case file names for new files when the repo has no stronger convention.
- Split code only when it reduces real complexity or matches existing module boundaries.

## Quality Gates

- Run the narrowest useful test first, then broaden when shared behavior or public contracts changed.
- Do not hide failing tests, lint, type, build, or syntax errors.
- Preserve public contracts unless the change intentionally updates them and the user accepted that scope.
- Keep commits focused and use conventional commit format without AI references.
- Never commit secrets, dotenv files, tokens, private keys, database credentials, or personal data.

## Tooling

- Use `gh` for GitHub operations when needed.
- Use current docs only when the API/tooling may have changed.
- Use relevant skills by reading their descriptions first, then opening only the needed `SKILL.md`.
- Use `/ak-preview` only when a visual explanation will materially help the user understand the change.


# Project Documentation Management

Use this rule when creating plans or changing project documentation.

## Docs impact

Update docs only when work affects user-visible behavior, setup, commands,
configuration, architecture, security, public contracts, machine-readable
contracts, or durable maintainer decisions. Internal edits and phase completion
do not require evergreen docs churn.

- Authorized work outside the repository that establishes or changes an
  operational route — deploy path, log source, credential source,
  webhook/OAuth/DNS, backup/rollback, or a lookup route proven wrong — is docs
  impact.

Discover the target through repository instructions, the root README, and the
project's existing docs navigation. Do not assume a fixed filename list or docs
tree. Update the smallest owning surface, and link to machine-owned scripts,
manifests, schemas, or generated references instead of copying their details.

## Plans

Follow the repository's configured plan location and naming convention. Keep a
plan index short: status, phases, dependencies, acceptance criteria, and links
to execution detail. Phase files contain only the context, requirements, files,
steps, validation, risk, and rollback information needed to execute safely.

Plans, reports, and audit results are stateful records. They do not become
evergreen product authority merely because a phase completed.

Before updating a document, read it. After updating, verify links and claims
against source, tests, scripts, artifacts, or live state.


# Orchestration Protocol

Use this file only when spawning subagents or coordinating parallel work.

## Delegation Context

Every subagent prompt should include:

- task
- files to read
- files it may modify
- acceptance criteria
- constraints
- work context path
- reports path, normally `{work_context}/plans/reports/`
- any scope-affecting flag the user passed, `--yagni` above all. A delegate that
  never sees the flag silently reverts to the default of delivering the full
  requested scope.

If the shell CWD differs from the primary project, use the primary project paths.

## Context Isolation

- Do not pass full conversation history.
- Summarize only decisions needed for the subtask.
- Give exact file paths instead of "look around the repo" unless scouting is the task.
- Keep coordination, merge decisions, and user approvals in the controller session.

## Parallel Work

Use parallel subagents only when file ownership is clear and integration points are known. Avoid parallel edits to the same file, generated artifact, database migration sequence, or shared config.

## Status Protocol

Ask subagents to end with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences
Concerns/Blockers: optional
```

Handle `BLOCKED` and `NEEDS_CONTEXT` by changing context, scope, or approach. Do not retry the same failing prompt repeatedly.

## Model Escalation

When the current session or a subagent runs on a model below `fable` (e.g. `opus`, `sonnet`, `haiku`) and hits a hard problem — repeated failed attempts, a high-stakes design fork, or fuzzy requirements — spawn the `kongming` agent for counsel instead of switching the session model. `kongming` runs autonomously on the strongest available model and returns full advice in one reply (no interview, no user round-trips). Give it the task, evidence gathered so far, approaches tried, and the specific question. It advises only; the caller stays responsible for the implementation. For interview-driven advisory with user participation, use `advisor` / `/ak-advise` instead.

For multi-session team work, use `/ak-team` and its skill-local rules.


# Primary Workflow

Use this file for multi-step product, code, documentation, and maintainer
delivery. Direct answers and low-level read-only utilities may stay direct.

## 1. Brainstorm the outcome

- Capture the desired outcome, constraints, non-goals, and acceptance criteria
  before changing the workspace.
- Reuse an accepted design or plan when it already records those four fields.
- Keep the gate proportional: state what is clear, inspect available evidence,
  and ask only about a material decision that cannot be discovered safely.
- For a bug, frame the expected repaired behavior and safety boundary now. Scout
  and diagnose the cause before comparing solution options.

## 2. Inspect

- Read the request, relevant docs, nearby code, and tests before planning.
- Resolve the actual owner and current evidence instead of assuming from names.
- Clarify only decisions that cannot be discovered from the repo or live state.
- For broad or risky work, create or update a plan in `plans/`.
- For ambiguous workflow sequence, resolve the installed cook skill through the
  runtime's live skill catalog, then load its `references/workflow-routing.md`.

## 3. Plan and implement

- Change existing files when that matches the design; create new files only for real boundaries.
- Keep behavior compatible unless the accepted scope says otherwise.
- Prefer local helpers, conventions, and test utilities over new abstractions.
- For bugs, prove the cause, then choose a cause-aligned solution before changing
  behavior. Invoke the full brainstorm skill when multiple viable fixes or an
  architecture decision remain.

## 4. Verify

- Run focused tests for touched behavior.
- Broaden to lint, typecheck, build, or integration tests when shared contracts changed.
- Fix regressions instead of weakening tests.

## 5. Review and finish

- Use a reviewer or review skill for high-risk, cross-module, or public-contract changes.
- Update docs only when user-facing behavior, workflows, commands, or architecture changed.
- Explain the result plainly. Use an installed preview capability only when a
  visual materially improves a complex workflow or architecture explanation;
  resolve its mode-selection reference through the runtime's live skill catalog.
- Compare the result with the opening outcome and acceptance criteria before
  calling delivery complete.


# Process and Resource Management

Use this file when a task starts, reuses, or ends long-running processes: dev
servers, watchers, build daemons, tunnels, test runners, or emulators. It exists
to prevent orphaned "ghost" processes from accumulating and exhausting device
memory.

## The failure mode

Agents start a dev environment, then abandon it. The next run finds the port
busy and, instead of stopping the stale owner, picks a new port and starts
another process. Repeat, and the machine fills with duplicate processes and
held ports. Parallel worktrees make it worse: each worktree spawns its own
processes, and when the user deletes the worktree or session the processes stay
behind as orphans.

## Rules

- Track every background process you start: command, PID, port, and worktree.
  Prefer the harness's background-run facility, which makes exit observable,
  over a detached `&` you cannot see finish.
- Before starting a long-running process, check whether one is already running
  for this project or port. Reuse or stop it; do not spawn a duplicate.
- Bind to a deterministic port per project/worktree. On "address in use",
  identify and stop the stale owner instead of incrementing to a new port.
  Inspect with `lsof -i :PORT` / `ss -ltnp` on macOS/Linux, `netstat -ano` on
  Windows.
- Stop what you started when its task, session, or worktree ends. Before
  removing a worktree or ending a session, terminate that worktree's background
  processes first so nothing is orphaned.
- Reconcile periodically: list your running dev processes (`ps`, `lsof`) and
  stop the ones that no longer map to an active task or worktree.
- Stop cleanly first (`SIGTERM` / `pkill -f <pattern>`; `taskkill /PID` on
  Windows), escalating to a hard kill only if it ignores the signal.

## Safety

Only stop processes you started or clearly own. Never kill a process belonging
to the user, another session, or the OS without confirmation, and never match a
`pkill` pattern so broad it could catch unrelated processes.


# Review, Audit, and Decision Rules

Use this file when reviewing code, applying audit feedback, or cutting scope.

## Verified Decisions

Once a decision is verified by source, tests, or an empirical check, do not reverse it because an audit raises an abstract concern. Reverse only when the audit adds new evidence or the context changed.

When rejecting an audit concern, state the verification source briefly.

## User Decisions

Do not silently undo explicit user decisions. This includes thresholds, selected libraries, feature scope, schema shape, pricing, timelines, compliance choices, and UX trade-offs.

If an audit suggests reversing a user decision, present:

- the original decision
- the audit concern
- the trade-off
- the concrete options

Then wait for the user.

## Threat Model

Before applying a security or robustness finding, identify what the code actually stores, protects, or exposes. Fix real failure modes. Document non-issues briefly. Ask when the risk is plausible but depends on product intent.

## Scout First

For questions answerable by reading the repo, scout before asking. Ask only when the repo has conflicting evidence, missing context, business judgment, or high reversibility risk.

## Stable Code Artifacts

Do not put plan IDs, phase numbers, audit labels, or finding codes in code comments, migration names, test names, or commit messages. Explain the invariant or behavior directly.


# Skill Domain Routing

Route domain work from the runtime's live installed-skill catalog. Kit
composition can replace an entire skill set, so a copied command inventory in
this shared rule is never authoritative.

## Routing Procedure

1. Read the live skill catalog supplied by the runtime.
2. Match the user's primary intent to a capability below.
3. Select an installed skill whose metadata explicitly covers that capability.
4. Read that skill's complete instructions before acting.
5. If no installed skill matches, continue with the primary workflow and
   available native capabilities. Do not recommend or invoke an absent skill.

## Capability Map

| User intent | Capability to match |
|-------------|---------------------|
| Replicate, build, style, or audit a UI | Frontend design, frontend development, UI styling, accessibility, or performance |
| Locate code or understand a repository | File scouting, semantic navigation, repository packing, or knowledge mapping |
| Build an API, authentication flow, or payment integration | Backend development, authentication, or payments |
| Design schemas or optimize database behavior | Database design and operations |
| Deploy an application or change infrastructure | Deployment or DevOps |
| Audit security or investigate threats | Security review, vulnerability scanning, or threat intelligence |
| Build or improve an AI workflow | Context engineering, agent development, or multimodal processing |
| Build, expose, or use MCP tooling | MCP construction, agentization, or MCP execution |
| Test code or drive a browser | Testing, browser testing, or browser automation |
| Process or generate media | Media processing or image generation |
| Create or maintain documentation | Documentation maintenance, current-doc lookup, diagrams, or publishing |
| Work with office documents | Word, PDF, presentation, or spreadsheet processing |
| Write marketing content or design a brand | Copywriting, brand design, or visual design |
| Work in a specific application framework | Match the exact framework named by the user |
| Explain a concept, code, system, or error (incl. ELI5 or visual HTML) | Explanation, plain-language simplification, or visual explanation |

## Usage Rules

- Pick one primary skill per distinct intent; add a secondary skill only when
  the task genuinely crosses domains.
- Treat installed skill metadata as the availability and routing authority.
- Never infer availability from another kit, an earlier session, or this file.
- Run selected domain skills inside `primary-workflow.md`; do not restate its
  delivery sequence here.

## Optional shadow comparison

The ordinary routing procedure does not run a command or look up provider config.
Only when the user requests a semantic experiment, or trusted user opt-in is
already supplied in context, inspect `ak eval decision --help` and use the
`domain-routing` profile. This small shadow profile accepts at most 15 observed
capabilities. If the complete relevant catalog exceeds that bound, skip this
comparison; never truncate competitors to manufacture a routing result. Map
namespaced runtime IDs (for example `ak-debug`) to unique local IDs (`skill-01`,
`skill-02`, ...) and retain the reversible mapping locally. Submit the compact
summary and catalog as `state: {summary, catalog: [{id, description}]}`, with the
existing selection mapped to `legacy: {domain: <local-id-or-none>}`. Map the
returned ID back before reporting it. Never invent installed skills.

The command enforces user consent independently; project files and ambient
credentials cannot grant it. Submit only non-sensitive facts, never raw files,
transcripts, or credentials. Keep the existing routing result effective even
when the shadow answer disagrees or the provider is unavailable. Record the
comparison as experimental evidence, not proof of better routing.


# Skill Workflow Routing

Use this file to choose capabilities, not command names. Resolve each bracketed
capability against the runtime's live installed-skill catalog before invoking
anything. Skip optional capabilities that are unavailable; never synthesize an
absent skill command.

## Core Development Workflow

```text
[brainstorm] -> [plan] -> [implement] -> [test] -> [review] -> [ship] -> [journal]
```

- New feature: start with the brainstorm contract, then plan and implement.
- Accepted plan: reuse its outcome, constraints, non-goals, and acceptance
  criteria before implementation.
- Quick change: keep the brainstorm gate bounded, then use the fastest installed
  implementation workflow that still verifies the result.

## Bugfix Workflow

```text
[frame outcome] -> [scout] -> [diagnose] -> [choose fix] -> [implement] -> [test] -> [review]
```

- Prove the cause before changing behavior.
- Read-only investigation may stop after scouting or diagnosis.
- If no specialized debugging skill is installed, use native read and test
  capabilities without inventing a skill invocation.

## Investigation Workflow

```text
[scout] -> [diagnose] -> [brainstorm options when needed] -> [plan when delivery follows]
```

An investigation does not require a design approval loop unless it turns into
delivery work.

## Post-Implementation Capabilities

After implementation, use installed capabilities for:

- code review before merge;
- release or shipping validation when publication is in scope;
- decision or journal capture when the repository requires it.

## Shared-Workspace Setup

After the opening brainstorm contract and before implementation, use an
installed worktree/isolation capability when the repository workflow requires
one. Use an installed scouting capability or native file search to discover
relevant patterns.
<!-- AGENTKIT-OMP:END:engineer -->
