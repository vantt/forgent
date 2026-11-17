# Discussion: secretary role (Miu)

discussion: open

## 1. Trạng thái hiện tại

Round 2 (2026-11-17). Point 1: draft persona presented (does / never does, see §5); owner chose that Miu orders
topics itself by the product priority list and reports the order (candidate D-ID, holds one more round). Rotation:
owner rejected "owner types /clear"; accepted automatic rotation with two thresholds (soft at rest, hard with verbatim
carry-over), replacing the claude process either way. Owner also wants a user-invoked `/handoff` shortcut and asked
for deep research on existing handoff skills (research done, report
`plans/reports/research-261117-1624-handoff-skills-research.md`). Point 3: owner chose a domain-free shaper in core (A); unsure domain -> ask
owner one line, never default to coding. Minted SM-D1 (topic ordering), SM-D2 (automatic rotation). Miu then raised
"auto-compaction + reload from files" as a cheaper alternative (Amp's choice); owner kept B (automatic rotation), asked
for the best possible quality, and widened it: the rotation/handoff mechanism is generic for every kind of long-lived
session, not limited to Miu. Name "session rotation" accepted; scope provisionally accepted; handoff files live in
gitignored `.fgos/runtime/session-rotation/<persona>-<name>/` (agreed round 9). Minted SM-D3 (core shaper). Point 5: owner chose
A (no own topic list; backlog row per request, read status from backlog / discussion marker / plan status). Owner then
raised: (1) discussions should leave messy `docs/history` -> `docs/discussions/*` or `docs/shaper/*` (Miu proposed
`docs/discussions/<slug>.md` via a Convention kind, awaiting answer); (2) session/head identity must come from Identity,
not mailbox (accepted; design corrected). No D-ID minted yet.

## 2. Mục tiêu & đề bài

Define the **secretary** role (id **Miu**) as a core, domain-free fgOS persona: the owner's single front session in
the driving chain boss → secretary → shaper / planner / supervisor → leader → worker (+ watcher). It routes every
request to the right domain's shaper/planner, keeps topic status, reports short, batches decision questions, and
does no detail work, so the owner's front chat stays cheap in tokens. Settled inputs (owner 2026-11-17): name
secretary / id Miu; domain-free, lives in core; portfolio files are the source of truth (D-ADR0079), Work is a
replaceable UX layer; plans follow `core/skills/_shared/plan-contract.md`; discussions happen in per-topic shaper
sessions, not in the secretary's chat.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State |
|---|---|---|
| 1 | Persona content and protocol (does / never does) | discussing. Provisionally clear: Miu orders topics itself and reports (owner, round 2). Provisionally clear: automatic rotation at turn end (Stop hook), soft ~40% only at rest, hard ~70% with verbatim last message + pending question; process replaced (new+close or in-pane replace); plus user `/handoff`. Open: handoff method (research pending) |
| 2 | Placement and activation (`core/agents/secretary.yaml`, `claude --agent secretary` in herdr, opening shaper tabs) | open |
| 3 | Domain classification without Work | provisionally clear: Miu calls `fgos-clarifying` directly (verdict-only); no shaper -> core domain-free shaper (owner chose A); unsure domain -> ask owner, no `coding` default. Open: registry vs `domains/` mismatch (marketing, council) |
| 6 | Generic session rotation | provisionally clear: name `session-rotation` (owner); covers every head session run with a persona (persona yaml declares soft/hard thresholds and state files, core defaults otherwise), not `fgos run` seats (run supervisor owns them) nor subagents; Claude first behind a port, other CLIs via adapters reusing mailbox `hookFacts`; spike the two unproven mechanics first; two-step replacement (new answers before old closes); files under `.fgos/runtime/session-rotation/<persona>-<name>/<yymmdd-hhmm>-<sid8>.md` immutable + `latest.json` pointer written atomically, keep last 10, redacted. Session and head identity come from Identity (owner: mailbox only consumes; `docs/platform/identity/spec.md` §3), pane from herdr; idea: lineage = Identity role alias taken with `--take`. Open: which core component owns it (point 2) |
| 4 | Token saving (3x always-loaded rules, model choice, short agent results, peer mail only on decisions) | open, needs owner approval |
| 5 | Topic list | provisionally clear (owner chose A): no separate list; each actionable request = one backlog row (`fgos identity mint backlog`); discussions and plans carry that id; status read from backlog Status, `discussion:` marker, plan `status`. Open: where pending owner questions live |
| 7 | Discussion file location: out of `docs/history` (owner). Proposed `docs/discussions/<slug>.md` through a new Convention kind `discussion`; moving needs all consumers (shaping/discovering/plugin skills, plan-contract, `src/report/context-render.mjs`, `src/report/authoritative-match.mjs`, `src/state/work.mjs`, `src/state/frontier.mjs`, `src/state/worker-slots.mjs`, `plugins/fgOS/skills/terminal/rename.sh`) and the 40 existing files moved in one change (L10) | awaiting owner |

## 4. Quyết định đã chốt

| D-ID | Decision | Rationale | Date |
|---|---|---|---|
| SM-D1 | Miu orders topics itself by the AGENTS.md product priority list and reports the order; asks the owner only on a real tie or when a reorder delays something already promised | Product priority #2: decide inside the approved frame; owner "Miu tự xếp thứ tự rồi báo lại anh" (round 2, unrevised since) | 2026-11-17 |
| SM-D2 | Miu's session rotates automatically, never by the owner: checked at turn end; soft threshold (~40% context) only when at rest (no pending question, no in-process background work); hard threshold (~70%) at any turn end, carrying the last Miu message and pending question verbatim; the claude process is replaced (new+close or in-place, either is fine); the owner also gets a user-invoked `/handoff` | Owner forgets `/clear`; owner "ổn, dùng hai ngưỡng ... cách nào cũng được" (round 4, unrevised); method per research report `plans/reports/research-261117-1624-handoff-skills-research.md` | 2026-11-17 |
| SM-D3 | A domain with no shaper of its own is shaped by one domain-free shaper in core, which reads the domain's doctrine from `domains/<d>/AGENTS.md`; coding keeps only its own overlay. When the domain is unclear Miu asks the owner one line instead of defaulting to `coding` | Owner "chọn A, shaper dùng chung ở core" (round 5, unrevised); the no-item shaping path holds nothing coding-specific; one door (L10) | 2026-11-17 |

## 5. Q&A log

- 2026-11-17 — session opened from `.fgos/runtime/tmp/secretary-brief.md`; scouted `core/agents/planner.yaml`
  (persona shape: role, persona, decision_boundary, tool-scope, skills), `core/skills/_shared/decision-question.md`,
  `plans/261117-1430-portfolio-driving-draft/plan.md`, audit `plans/reports/audit-261117-1545-supervisor-watcher-audit.md`
  (main checkout).
- 2026-11-17 — Miu proposed the point-1 draft: does = classify domain, answer inline only what portfolio files
  answer, open shaper for >1-2 rounds or detail reading, planner on `settled`, supervisor on `ready`, keep topic list,
  report <=10 lines, batch five-part questions, rotate own session via handoff; never = read diffs, edit code/docs
  (except topic list), run tests, land, discuss a topic in depth itself, know any domain's steps. Asked who orders
  topics. Owner: "Miu tự xếp thứ tự rồi báo lại anh." (Miu orders by product priority, reports; asks only on a tie or
  when a reorder delays something promised.)
- 2026-11-17 — Miu asked when to rotate (milestones / every N topics / never). Owner asked what the right method is.
  Miu scouted: SessionStart hook matcher `startup|resume|clear|compact` in `.claude/settings.json`; herdr
  `tab`/`pane run`/`pane close`; Miu cannot type `/clear` itself. Proposed (A) owner `/clear` + handoff updated
  every state-changing turn, (B) self-rotation via herdr later. Owner: "không đồng ý, anh còn quên miết, đưa thêm
  thảo luận: thời điểm phù hợp để đổi phiên." -> rotation must not depend on the owner.
- 2026-11-17 — Miu proposed: check at turn end (`Stop` hook reads context tokens from `transcript_path`), signals =
  context size / session age / owner idle / `PreCompact` fallback. Owner asked what breaks when rotating mid-chat.
  Miu listed: unwritten nuance, short answers losing their question, in-process background work killed, keystrokes
  during restart, cold cache; proposed soft (rest only) + hard (verbatim carry-over) thresholds.
- 2026-11-17 — Owner: "ổn, dùng hai ngưỡng, mỗi khi handoff có thể thay thế claude hiện tại bằng claude mới (tạo mới +
  đóng hoặc replace, cách nào cũng được)... research sâu xem có ai làm sẵn skill dạng handoff... muốn có shortcut
  dạng /handoff được gọi chủ động bởi user." Prior art found locally: `ak-handoff` (continuation contract, never
  launches a runtime unless `--dispatch`).
- 2026-11-17 — Research done (report above). Findings: Amp dropped `/handoff` for auto-compaction (2026-05-06);
  `ak-handoff` upstream `davidondrej/skills` (MIT), reuse redaction + verify-before-act, not its 9-section schema;
  Stop payload has no context metric, last non-sidechain assistant entry in the transcript gives input + cache
  tokens (dedupe by message.id); window size only via statusline `context_window_size` (sidecar file); no documented
  way for a hook to restart claude, safest = external new+close via herdr; cheap spike = `/clear` via
  `herdr pane send-text` + SessionStart `source=clear`; `/handoff` = skill with `disable-model-invocation: true`
  calling the same script. Untested: statusline timing, `/clear` via send-text.
- 2026-11-17 — Point 3 scout: `fgos-clarifying` is verdict-only, callable without Work; domain list from
  `src/state/domain-registry.mjs` misses `domains/marketing` and `domains/council`; it defaults to `coding`. Asked:
  domain with no shaper -> (A) core domain-free shaper, (B) council business-discussion, (C) park.
- 2026-11-17 — Owner: "chọn A, shaper dùng chung ở core".
- 2026-11-17 — Owner: "rốt cuộc việc handoff có nên làm tự động không hay để tự nén?" Miu laid out (A) auto-compaction
  + SessionStart(compact) reload from files, (B) automatic rotation (SM-D2), (C) compaction only; recommended A.
  Owner: "không, handoff đã làm thì nên nghĩ đến việc dùng cho mọi thể loại luôn, đừng giới hạn trong miu" then
  "anh muốn B. nhưng hãy làm tốt nhất có thể." -> SM-D2 stands; mechanism becomes generic. Prior art scouted:
  `src/state/handoff.mjs` (team-harness call legality) and `src/workflow/unit-handoff.mjs` (Unit outputs) use the word
  "handoff" for other things; no session-rotation mechanism exists in src/apps/packages.
- 2026-11-17 — Miu proposed scope (head sessions with a persona; not `fgos run` seats or subagents; Claude first) and
  quality bar. Owner: "đồng ý session-rotation. tạm chấp nhận phạm vi ... ghi đè nguyên khối là sao, ghi lên file nào,
  đặt tên file ra sao? sao không ghi vào một folder và gitignore?" Miu explained atomic write (temp + rename),
  proposed `.fgos/runtime/session-rotation/` (already ignored, beside `.fgos/runtime/mailbox`), lineage folder per
  persona + name, immutable timestamped files + `latest.json`, keep 10. Owner: "đồng ý, đặt theo persona + tên phiên".
- 2026-11-17 — Miu: topic list options (A) derive from backlog + discussion marker + plan status, (B) own file,
  (C) wait for portfolio council. Owner: "Đồng ý A. Mà khoan: 1) discussion ... không nên bỏ vào history ... shaper ghi
  vào docs/discussions/* hoặc docs/shaper/* 2) về mailbox mà cung cấp identity thì có vẻ là hơi bị sai authority ...
  identity mới là nơi cung cấp, mailbox chỉ dùng." Scout: `docs/history` has 882 dirs, 40 DISCUSSION.md; Identity spec
  says it is the only authority deriving full ids, handles and liveness (head = highest terminal-holding ancestor).
  Mailbox's own head finder (`adapters::claude_head::find_head`, `hookFacts`) may duplicate it -> separate backlog item.

## 6. Thiết kế đã chốt {#design}

Not yet.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
