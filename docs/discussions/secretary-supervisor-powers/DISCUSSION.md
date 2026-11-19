# Discussion: powers of the secretary (Miu) and the supervisor

discussion: open

Backlog: `p-xnu3jnds2u` (docs/backlog.md, "Define the powers of the secretary (Miu) and the supervisor"). Domain:
fgOS platform (core personas, domain-free). Related: `docs/discussions/secretary-miu/` (settled, SM-D*),
`docs/discussions/supervisor-review/` (settled, SR-D*), plan `plans/261118-1045-project-supervisor`, lane
`plans/261119-1615-secretary-capabilities` (lead:SECRETARY-CAPS, branch `lead/secretary-caps`).

## 1. Trạng thái hiện tại

Round 0 (2026-11-19 16:2x). Scout done; nothing settled. Starting picture: Miu and the supervisor are the owner's two
hands. Miu is always on, does little herself, but must be able to coordinate anything (delegate, queue) and have a fast
route for small urgent chores. The supervisor is woken, not always on, and covers the large cyclic coordination.
Round 1: the owner asked why the supervisor can do anything; it is the interim unconfined session, not the designed head (§3 row 9). Open next: which reach is the target (§3 row 9), then the urgent-chore route (§3 row 1).
Round 2: owner gave a provisional picture of the supervisor (§3 row 10): observe, wake, open, ask, help every session; never do a session's work unless it is stuck. Row 9 deferred by the owner. Round 3: owner described Miu (§3 row 11): cognitive-load reducer at the owner's side, large authority over priority and order, life-and-death over sessions used rarely; the supervisor carries on what Miu arranged. Round 4: channel agreed as C (§3 row 12); SP-D1, SP-D2 minted. Next: the urgent-chore route (§3 row 1) in the light of SP-D1 (Miu rarely orders directly).

## 2. Mục tiêu & đề bài

The owner wants a written split of reach between Miu and the supervisor, so each can act without waiting for a person
and without stepping on the other. Today each head's reach is one frozen table, `src/session-host/head-grants.mjs`
`GRANTS`: Miu writes `plans/`, `docs/discussions/` and (through `session write`) `docs/backlog.md`, holds
`session start`, `session write`, the question verbs including `questions answer`, `land`, `request result`, mailbox
and peers (SendMessage), but no `session stop`, no `run` and no supervisor reads. The supervisor holds `session
start|stop|write`, `land`, `supervisor queue|plans|handled|done` and `slots`, but no `run`, mailbox or peers; it runs
only when the watcher wakes it (`docs/platform/supervision/spec.md` §1). Live windows 1-5 of plan 261118-1045 showed the
supervisor half working end to end once (window 3) and heads drifting into investigation; acceptance 8 is not proven.
Miu's own sandbox gaps (role binding, backlog write races, shaper start, TMPDIR, grant audit) are being fixed by the
secretary capabilities lane. The output here is the split, the urgent-chore route with its limits, and for each power
the door it goes through and how it is proven from the sandbox. Code and plans are not changed here.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State |
|---|---|---|
| 1 | Urgent-chore fast route for Miu: what it is, its limits, how its result reaches main | open |
| 2 | Miu delegating/queuing work to the supervisor: a door to enqueue and wake (today Miu can only start sessions or message peers) | open |
| 3 | Miu stopping sessions she started (no `session stop` in her grant) | settled SP-D1: needs `session stop` in her grant |
| 4 | Miu reading the portfolio the supervisor reads (`supervisor plans`, `slots`, queue) for status | open |
| 5 | Mismatches between persona text and grant: Miu's skill says "never lands work" but her grant has `land`; persona says "hands a ready plan to a supervisor" while the skill says the watcher does | open |
| 6 | Supervisor reach beyond plans: owning backlog rows, mailbox/peers, waking on Miu's request | open |
| 7 | Who wins when Miu and the supervisor touch the same thing (a session, a plan, a backlog row) | leaning (round 3): Miu sets priority and order, the supervisor carries out what Miu arranged; a direct Miu order overrides. Not yet stated as a rule by the owner |
| 9 | Two supervisors exist today: the interim hand-started one (`forgent-1d`, Claude opus, unconfined, role `lead:SUPERVISOR`, brief `.fgos/runtime/tmp/supervisor-brief-portfolio.md`) does anything a person can; the designed head (`head:supervisor-<handle>`, confined, grant table, woken by the watcher) does only its grant verbs and has not yet carried a plan ready to done. Which one is the target reach for "the supervisor" | open |
| 10 | Supervisor reach, owner's provisional picture (round 2, "anh cũng chưa rõ trong đầu"): high-level executive, authority without hands-on. It observes and wakes every session, opens new ones, asks an existing one, even helps it; it never does a session's work unless that session is stuck. Door map today: observe = `fgos identity list --project` (who, role, liveness only; no door reads what a session is doing or whether it is stuck beyond watcher events `head-gone`, `plan-no-progress`, `supervisor-stuck`); wake = no fgos door (mailbox reaches a session only during a turn; idle sessions are woken by herdr `pane send-text` or SendMessage, neither in the supervisor grant); open = `session start` (held); ask/help = mailbox or SendMessage (secretary grant only, not the supervisor); take over a stuck one = `session stop` + successor start or `session rotate` (held). Provisional; reversal trigger: the owner's own list of what `forgent-1d` does that must not be lost | provisional |
| 11 | Miu's role, owner's provisional picture (round 3): always runs alongside the owner; reduces the owner's cognitive load: makes clear what is the priority, gives context and explains the problem so the owner chooses and decides. Large authority over priority and plan order, and life-and-death over sessions, but rarely gives direct orders unless truly needed. The supervisor usually carries on what Miu arranged. They work very closely, as the owner's right and left hands, both cross-domain. Implication found: the supervisor head has no channel back to Miu today (no mailbox, no peers), and Miu has no door to wake the supervisor (`supervisor wake` is not in her grant; only plan/discussion events wake it) | provisional |
| 12 | Miu-supervisor channel: how what Miu arranges reaches the supervisor at once, and how the supervisor reports back | agreed round 4 (option C): every decision is written to portfolio files, which stay the truth; messages only wake and point ("read file X"); Miu gains `supervisor wake`; the supervisor gains a back channel to Miu for results, stuck work and decisions only. Mint after it holds one more round |
| 8 | Proof: each power named with its door and a sandbox proof (ties to supervisor-review T2 head-start preflight, `p-2wb2lfgky3`, and caps phase 6 grant audit) | open |

## 4. Quyết định đã chốt

| ID | Decision | Basis | Date |
|---|---|---|---|
| SP-D1 | Miu sits at the owner's side to reduce the owner's cognitive load (what is the priority, the context, the problem) so the owner chooses. She has large authority over priority and plan order and life-and-death over sessions (start and stop any), and rarely gives direct orders unless truly needed. Both Miu and the supervisor are cross-domain | Owner round 3 (quoted in §5), held unrevised through round 4 | 2026-11-19 |
| SP-D2 | The supervisor usually carries on what Miu arranged; the two work very closely as the owner's right and left hands | Owner round 3, held unrevised through round 4 (the channel choice in round 4 builds on it) | 2026-11-19 |

## 5. Q&A log

- 2026-11-19 16:2x — Round 0. Shaper opened from `.fgos/runtime/tmp/shaper-brief.md`. Scouted: core/agents
  secretary|supervisor|lead.yaml, core/skills/fgos-secretary|fgos-supervisor, `src/session-host/head-grants.mjs`,
  `docs/platform/supervision/spec.md` §1/§7, supervisor-review §1-§2 and hand-off, plan 261118-1045 integration report
  windows 1-5, caps plan `plan.md` (origin/lead/secretary-caps aa2490723), secretary-miu hand-off and SM-D1..SM-D6.

- 2026-11-19 16:4x — Owner: "hiện supervisor đang cấu thành ra sao mà việc gì nó làm cũng được." Answered from
  scout: the supervisor the owner works with is the interim hand-started session `forgent-1d` (pid 1020432, `claude
  --dangerously-skip-permissions --model opus`, no bwrap, Identity role `lead:SUPERVISOR`), driven by a by-hand brief
  (read plans, herdr tabs, worktrees, briefs, restart leads, may lead a plan itself). Its reach is full Bash as the
  owner. The designed supervisor head is confined (bwrap, `FGOS_CONFINED=1`), reaches only its `head-grants.mjs` verbs
  through the request socket, and is started by `fgos supervisor wake`. Miu, by contrast, already runs as a confined
  head (pid 36166 bwrap, sonnet). Opened §3 row 9.

- 2026-11-19 16:5x — Owner (row 9 not answered yet: "chưa trả lời được lúc này. thấy nó làm mượt quá, mà có nhận ra
  gì đâu"): "nó phải có khả năng quan sát và đánh thức được mọi phiên cũng như mở được phiên mới, hỏi phiên cũ, thậm
  chí giúp phiên cũ gì đó. tuyệt nhiên nó sẽ không làm việc của phiên cũ trừ khi phiên đó kẹt. kiểu điều hành cấp cao,
  có thẩm quyền nhưng không nhúng tay." Recorded as provisional §3 row 10 with today's door map.

- 2026-11-19 17:0x — Owner on whether Miu shares the supervisor's reach: "miu là một đứa lúc nào cũng phải chạy theo
  anh. nó giúp anh giảm tải nhận thức. phải giúp anh rõ cái gì đang ưu tiên, giúp anh hiểu bối cảnh, hiểu vấn đề từ đó
  mà anh chọn lựa và ra quyết định. nó có quyền rất lớn trong việc ảnh hưởng đến ưu tiên, thứ tự kế hoạch, cũng có
  quyền sinh sát nhưng nó sẽ ít khi ra lệnh trực tiếp trừ khi thật sự cần. thường supervisor sẽ lo tiếp phần mà miu đã
  sắp xếp. miu và supervisor sẽ làm rất gần. 2 đứa nhu tay phải và trái của anh và làm cross domain." Recorded as §3
  row 11 (provisional); rows 3 and 7 now lean; opened row 12 (the channel between them).

- 2026-11-19 17:1x — Asked the channel question (A files only, B direct two-way messages, C files are the truth and
  messages only wake and point). Owner: "C". §3 row 12 agreed; SP-D1 and SP-D2 minted from round 3 (held unrevised).
  Local ids follow the SM-D*/SR-D* precedent.

## 6. Thiết kế đã chốt {#design}

Not yet.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
