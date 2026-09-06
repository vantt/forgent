# Upstream Beegog Herding Design Distillation

**Context:** fgOS (this repo's host project) has a `herdr-spawn` adapter that launches interactive agents and polls status. It suffers from false idle at startup, mid-turn dips, multi-line prompt corruption, no readiness handshake, no persisted pane/process identity, no contact channel. The lead is designing "visibility + contact" and wants to know exactly what upstream beegog learned.

---

## 1. LIVENESS / STATUS

**Signal ladder (herding-liveness-signals D1):** The poll decides on a tiered ladder, not one signal:
- **Tier 0 — truth:** `result-N.json` with valid round (bee-herding-ref_operational-invariants:405). Well-formed result outranks everything.
- **Tier 1 — liveness:** `herdr pane process-info`'s `foreground_processes` (herding-liveness-signals D1). **Agent-present** = at least one `pid != shell_pid`. No result AND no agent process = new typed `died` outcome. Debounce N=3 consecutive absent observations, read every 10th tick (~2s, ~6s total). Unknown read resets counter to zero (D3).
- **Tier 2 — progress:** `log.txt` mtime OR `agent_status == "working"` (herding-liveness-signals D1). Measured `log.txt` revision counter fails hang detection (D6 parked).
- **Tier 3 — classification:** Runs on-demand when tier 2 goes stale; `pane read` matches patterns for `paused_limit` vs `timed_out_idle`.

**Herdr lifecycle contract (bee-herding_agent-resolution-and-spawn-commands:224–256):** Four states, verbatim from `herdr --skill`:
> `idle` — ready for input AND tab seen in focused UI. `done` — same underlying ready state, unseen background work. `blocked` — approval/question UI. `unknown` — agent present, cannot classify.

Bee's critical reading: since bee splits with `--no-focus` and reads only via CLI (which don't mark seen), `done` is the **normal resting state**, not `idle` (herding-prompt-stall D2; narrows herding-run-ready-wait D1:241–242). A sample taken inside agent's boot window is not trustworthy (herding-prompt-stall D1:66–68).

**Activity hook (herding-activity-hook D1–D3):** Under `BEE_HERDING_WORKER=1`, exactly ONE hook runs — `activity`. It writes `.bee/mailbox/<job-id>/activity.json`, tmp-then-rename, stamped with job id and round (D2). At ready gate, pointer delivery, and round poll, if fresh `activity.json` exists, bee reads it BEFORE screen classifier: `blocked`/`waiting_input` ends wait as blocked; `working` satisfies submit-observed check (D3). Screen classifier stays fallback for hookless agents. Record shape: `{state, event, tool_name?, tool_use_id?, at, job_id, round}` (herding-activity-hook:42).

**Unsolved hang case:** CPU-based hang detection was tried and parked. `/proc` CPU delta fails because a TUI agent's event loop or a hung agent's spinner both burn CPU identically, measurable but unreliable (herding-liveness-signals D6). **Parked without mechanism.** Pane `revision` counter fails the same way. Result: a legitimately blocked agent (blocked on LLM API call) would be killed by a CPU threshold. The feature shipped the death verdict (D1 tier 1) and `pane read` economy (D4) without it.

---

## 2. READINESS / DELIVERY

**Ready-wait rules (herding-prompt-stall D2; bee-herding-ref_operational-invariants:465–467):** The ready gate accepts `idle` OR `done`. Bee defers to `herdr agent wait <job> --until idle --until done --timeout <ms>` over hand-rolled poll. **`blocked` ends wait immediately** at every point — ready gate, pointer delivery, round poll (D3:476–492) — with typed error naming pane id, text tail, and remedy. This is how a per-workspace trust prompt is covered without bee carrying any agent-specific pattern table.

**Submission verification (herding-prompt-stall D4, herding-receipt-state D1):** The delivery receipt is a STATE transition, not text. After pointer send, poll `agent_status` plus round-1 result presence for short per-attempt window; `working`/`done` (or `result-1.json`) IS the receipt. `idle` past window drives resend. Pane-text needle check dropped — live smoke showed false positives during agy boot (herding-receipt-state:8–10: agent idle forever despite echoed pointer). Herdr lifecycle state **never** becomes success signal.

**Stall salvage (herding-prompt-stall D1):** Bee stops hand-rolling receipt; send becomes `herdr agent prompt <job> <text> --wait --until working --timeout <ms>` (D1:470–479). Herdr's `agent_prompt_stalled` IS delivery failure, surfaced at once. **Boot window hazard retired** — sampling right after `agent start` reads agy's TUI flapping through unknown/working/idle/done; boot flap satisfied the old transition test and receipted a pointer the TUI discarded (D1:67–68). Herdr's own five-second stall detector is switched on.

**Brief file (herding-brief-file D1; herding-run-prompt-delivery D1):** Multi-line briefs are silently dropped by at least one agent kind (agy: live smokes 4/5 lost brief with agent idle/ready). Rendered brief is written to `<mailbox>/brief-N.txt` atomically (tmp then rename); agent receives **one-line pointer prompt** naming absolute path. Applies spawn AND `--continue` rounds. Multi-line injected prompts are unreliable per kind; file + pointer encoding-proof.

**Pointer delivery & resend (herding-receipt-source D1–D2):** Delivery window widens to **30 attempts, ~1s apart (~30s)**. Receipt source reads `herdr pane read <pane_id>` (plaintext), not `herdr agent read <job_id>` — live smoke 7 showed agent read returns empty for agy while pane read shows text (herding-receipt-source D1:12). Pointer is idempotent; repeats harmless (D2:13). 5 quick sends in ~3s proven inside deaf window (live smoke).

**Start retry (herding-start-retry D1):** `agent start` retries when herdr refuses with `agent_pane_busy` — bounded 10 attempts, ~1s apart. Live dogfood hee-1: pane split raced shell boot; warm retry passed. Exhaustion keeps spawn-failure behavior (close pane, typed error).

**Split-serialize:** Wave ledger (bee-herding_waves-and-occupancy D10) **writes at spawn moment, not at end**, capturing worker pane id even if agent never names itself — the ledger is the cap (D18, retiring per-pane-count model that left unnamed agents looking free). This survives herdr restart/reattach. One unresolvable target stops whole run before any brief sent (wave-runs.md:55–62).

---

## 3. RECEIPTS / RESULTS

**Mailbox shape (bee-herding-ref_operational-invariants:403–422; pi-result-mailbox D1–D3):**
- `.bee/mailbox/<job-id>/`:
  - `job.json` — stamped at spawn (dispatch D9)
  - `brief-N.txt` — rendered brief, atomic write before prompt
  - `ack-N.json` — **worker writes first**, tmp-then-rename (herding-prompt-stall D4; hps-3). Fields: worker nickname, cell id when exists, job id, round, agent name, `received_at` timestamp.
  - `result-N.json` — worker final result, atomic write. Round N. **Result presence IS done signal** — screen stays advisory (operational-invariants:405–406).
  - `report-N.md` — worker's full digest body (pi-result-mailbox D1). Result gains `report_path` field.
  - `log.txt` — mtime for heartbeat
  - `activity.json` — agent's state (fresh per round)

**Fields in result-N.json:** Exact schema defined by run verb; workers are bee-ignorant (herding-prompt-stall D4: "worker stays bee-ignorant; orchestrator owns bee's bookkeeping"). Result-path appearance under final name IS done signal — "no screen-scraping, one exact schema-checkable shape across all herdr-supported kinds" (operational-invariants:405–406).

**N semantics:** N = round number (launch-id fence). Fresh `activity.json` with older round is ignored (herding-activity-hook D2). Two concurrent runs in same millisecond = job-id collision latent defect (herding-prompt-stall, Explicitly out of scope).

**Receipt decisions:**
- **herding-receipt-source D1:** Receipt reads `herdr pane read`, not `herdr agent read`.
- **herding-receipt-state D1:** Receipt is state transition (`working`/`done`/result), not text needle.
- **herding-prompt-stall D4, hps-3:** Ack file IS receipt — worker writes `ack-N.json` before any other step (hps-3:107–112). Herdr lifecycle stops being success signal; `agent_prompt_stalled` and `blocked` stay **failure detectors only**.

**Pi-result-mailbox (D1–D3):** Synchronous path: `bee herding run` returns report inline (≤ size cap) or path. **Worker writes report-N.md** beside result (atomic), matching mailbox philosophy (pi-result-mailbox D1:30). Async half (Pi only): background job's envelope injected into orchestrator as typed message — `.processing` claim held through turn, requeue on failed injection, orphan reclaim at session_start (D4). Injected content wrapped in fence with fixed info tag and one-line header (job id, cell id) (D5).

**Worker contract (operational-invariants:424–427):** "The worker stays bee-ignorant beyond following its brief. The brief is fully self-contained — task, absolute paths, file constraints, result schema, tmp-rename gesture — so a worker that has never seen bee can complete it."

**Poll end (herding-liveness-signals D1 outcome table:54–64):**
| result | agent process | progress | outcome |
|---|---|---|---|
| present | — | — | `done` / `blocked`, per result |
| absent | absent (×N debounce, D3) | — | `died` — **new** |
| absent | present | fresh | continue |
| absent | present | stale + text matches limit patterns | `paused_limit` |
| absent | present | stale | `timed_out_idle` |
| absent | unknown (D2) | — | treated as present — never `died` |
| — | — | — | `timed_out_ceiling` caps regardless |

---

## 4. CONTACT / INTERVENTION

**Supervisor delivery (bee-herding_supervisor-observer:75–95; herding-prompt-stall D1):** When supervisor decides to speak, it writes **intervention**: one open question, addressed to one target session. Record is mechanism — **NEVER injected mid-turn**. Target session picks it up at **NEXT turn boundary**, where prompt hook appends and stamps delivered (c80debd7). Persistent record only thing surviving between cold ticks; turn boundary only moment to hand something without mid-thought interruption (bee-herding_supervisor-observer:84–86).

**Frequency cap (bee-herding_supervisor-observer:88–91):** Each intervention carries **point key** and frequency cap. First record on point = question. Second hit on same point = **escalate** (never repeat). No third state where observer nags.

**Danger class (bee-herding_supervisor-observer:113–121):** One class breaks quiet: **danger-class alert**. Exempt from frequency cap. Notifies **immediately, once**, on best-effort channel. Notification fails **open** — if channel missing/broken, alert still recorded, flow continues. Supervisor silenced by dead notifier worse than none. Notification can be switched off by config, suppressing notice but not record.

**Advisor-nudge (slp-advisor-nudge 3cfd9980, 9e5eda5b):** Supervisor writes `recommend-advisor` intervention on poor-work signals (struggling-loop, budget overrun, same-region resubmits). Recommends only — supervisor decides nothing, acts nothing (constraint 704b691c). Target lead reads nudge at next turn boundary, either runs consult or records reasoned decline (slp-advisor-nudge D1:30). Nudge is **response debt** enforced existing debt-door way: consult ran or decline recorded before cap/close. Unanswered nudge targeting cell refuses cap, refuses close. Silence on same point twice escalates into human's report (never repeat).

**Awaiting-human (awaiting-human D1–D5):** State marks every moment agent waits on human — gate, interview question, decision. **ONE state + field naming what waited on** (D1). Clears three ways: `UserPromptSubmit` hook on human message, agent explicit, mark expiry (dual-condition: session heartbeat stale AND stale marker, D4). Session-scoped (default record) when no feature active (D3). Mark ends three ways, all live at once (D2).

**Message channels:** Supervisor → session: intervention mailbox read at turn boundary, injected via `UserPromptSubmit` hook. Agent → human: awaiting-human mark + hook delivery. No coordinator → worker besides job mailbox (bee-ignorant worker contract). No worker → coordinator besides result/ack files.

---

## 5. IDENTITY / ADDRESSING

**Pane id (operational-invariants:283–286):** Pane id is position not name — herdr: workspace:pane string (e.g. `w4:pB`). Tmux: pane id (e.g. `%1`), or pane **TITLE** (select-pane -T) when looked up by label. Neither transport is auto-detected; one config key `herding.transport` picks `"herdr"` or `"tmux"` (absent = herdr default) (operational-invariants:153–160).

**Labels & pane-id lookup (bee-herding-ref_role-dispatch.md:29, operational-invariants:284–286):** Pane label is optional. `bee herding pane-id --label <label>` looks label up in pane label (herdr) or pane title (tmux). Miss = exit 1, `not_found`. Dispatch role self-names: `bee herding pane rename <pane_id> dispatch` (role-dispatch:29).

**Occupancy ledger (bee-herding_waves-and-occupancy D10, D18):** Append-only wave ledger written at spawn moment. One row per wave, one entry per worker: name, pane, worktree, brief, outcome. Occupancy = cross wave ledger's **unresolved pane ids** against live pane list. Real crossing OR degraded timer fallback (1-hour timer when live list unreachable). Dispatch refuses fallback — never guess (waves-and-occupancy:62–73). Cap is 4 runtime slots.

**Wave ledger & session identity (bee-herding_waves-and-occupancy D10, role-dispatch:71–84):** Ledger knows pane even when pane doesn't name itself (agent fails to self-name). Ledger survives occupancy cap model — cap now rests on ledger not pane count. Session identity: `bee herding run` carries `--job-id` (user-named or `job-<epoch-millis>`). Job.json records pane_id, kind, model, cwd, stamped at spawn. Report/ack files keyed by job id. Wave ledger rows by pane id.

**Herdr restart / reattach (operational-invariants:273–283):** Herdr panes carry persistent `pane_id`, `label`, `workspace_id`, `tab_id` (recovered via `herdr pane list`). Tmux: pane survives via tmux server state; `select-pane -T` sets title for label recovery. Wave ledger entries by pane id. Occupancy re-crosses ledger pane ids against fresh live list — no special "reattach" recovery needed. Pane becomes agent name via derivation (uppercase letter safe: pane Z → slug z, uppercase uppercase always exists, no case collision risk).

**Tmux mapping (operational-invariants:273–283):**

| Cockpit noun | herdr | tmux |
|---|---|---|
| workspace | workspace | caller's current session |
| tab | tab | window (`cockpit`, `runtime`) |
| pane label | pane label | pane TITLE (select-pane -T) |
| chat pane | split from bootstrap | split from bootstrap |

---

## 6. PRESENCE / WAKE REPORTS

**Away/back mark (bee-herding_presence-wake-reports D1, 9f5cd250):** Presence is mark, not permission. Human says *away* (stop watching) → *back* (return). **Exactly two effects only:**
1. Sets **report window** — current window opens on *away*, closes on *back*.
2. Stamps non-urgent asks **queued** — no notification while away.

Nothing else moves. Gates, bypass levels, permission posture stay unchanged. Urgent class exempt from quiet queue.

**Single bounded wake report (bee-herding_presence-wake-reports:35–45):** `back` only door renders report. **One per window**. Second *back* on same window returns report already stored — never adds second. Report: **four headings, at most six content lines, floor 9, ceiling 10** lines. Sections: what happened, what decided, what needs you, next action. Ordered by **impact-if-wrong descending** (urgent alerts → waiting gate → escalations → ordinary interventions). When content exceeds ceiling, ends on **"+N more"** — nothing silently dropped. One push notification, same best-effort channel as urgent alert.

**Health counters (bee-herding_presence-wake-reports:67–92, D2, 66c4c251):** Seven derived counters, recomputed at report time from existing stores (cells, decision log, mailbox, observation store). No persisted counter. Each reports: **two-sided band** (too-low and too-high are findings), sample count, verdict from `below-band`/`in-band`/`above-band`/`not-measurable`. **`not-measurable` first-class** — never renders as `in-band`. Empty window not healthy. Blocked-rate denominator = union of claimed + blocked (not claimed-over-claimed, can exceed 100%). 2x-estimate skip-until-present (ea02cb68): overrun only where estimate exists, otherwise *no estimate recorded* — never zero. Metrics line is reason report floor moved from 8 to 9 lines.

**Silence-is-consent gating (bee-herding_presence-wake-reports D3, c706053e):** Narrow opt-in mode, defaults safe:
- **Off** unless config explicitly enables with ≥1s timeout. Missing/malformed = **off** (opposite of notification channel, which fails **open**).
- Eligibility refused **by named reason** — gate, urgent, escalation, one-way low-confidence (a8f4b8ab), unknown kind, item never queued, already consented. Boolean would leave none able to say why.
- **Gates always wait.** One-way door at low confidence always waits. No timeout reaches either.
- Auto-proceed written to decision log first. Write fails → item stays queued (112–113).
- Each auto-proceed rendered **prominently** in wake report.

Widened by slp-human-up 83baf03f into delegated-decision tier: supervisor may decide matter on human's behalf only when all four hold — small scope, reversible, proven observation, inside protocol — one decision per message with recorded rollback path; unclear escalates.

---

## 7. DECISIONS, REJECTED ALTERNATIVES & MEASURED FAILURE MODES

| Decision | Rationale | Evidence / Rejection |
|----------|-----------|----------------------|
| **Tier-1 liveness: process identity, not name match** (herding-liveness-signals D1:46) | Pane liveness ≠ agent liveness; exited agent leaves live pane at shell prompt | Name match reads agent's own `cargo`/`git` child as death, kills healthy agent in seconds |
| **Tier-1 fail-open on herdr unreachable** (D2:47, opposite of pane_alive) | Liveness check is kill decision; herdr hiccup must never end multi-hour job | Refusal gate (pane_alive) safe; liveness kill needs opposite direction |
| **Died debounce: N=3 consecutive absent, read every 10th tick (~2s, ~6s total). Unknown read resets counter.** (D3:48) | Without reset rule, `Absent → Unknown → Absent` fires `died` on non-consecutive, violating D2's fail-open | Debounce = difference between "agent exited" and "one read flaky" |
| **Screen `pane read` on-demand tier-3, not every tick** (D4:49) | Per-tick pull (200ms) unconditional, text consumed only in idle-timeout branch — ~4,500 discarded spawns per 15m idle | Measured: herding-liveness-signals evidence, run.rs:915-928 |
| **Socket event stream refused** (D5:50) | Edge-triggered (missed edge wrong forever); silent indistinguishably from "working"; says nothing about result-N.json | Poll level-triggered, self-correcting, 200ms already low latency |
| **CPU hang detection parked** (D6:52) | `/proc` CPU delta fails: TUI event loop and hung spinner both burn CPU identically; threshold kills legitimate API-blocked agent | No calibration traces; picking threshold needs evidence repo lacks. Feature ships death verdict + pane-read economy without it. |
| **Brief pointer one-line, not multi-line** (herding-brief-file D1:16) | At least one kind silently drops multi-line (agy: smokes 4/5) | Live smokes agy-delivery-1/-2: multi-line lost during boot echo race; single-line pointer landed instantly (herding-receipt-state:8–10) |
| **Herdr agent prompt --wait --until working, not hand-rolled poll** (herding-prompt-stall D1:66) | Boot window sampling misread agy's TUI flap; boot flap satisfied transition test, receipted discarded pointer | Smoke 7 three concurrent runs, two completed; third stalled with pane idle, job.json marked delivered, but pane input empty 60s+ |
| **Done = normal resting state, not idle** (herding-prompt-stall D2, narrows ready-wait D1:241) | Bee splits `--no-focus`, reads CLI-only (never mark seen); normal resting = `done` not `idle` | Live spawn-proof ho2-spawn-rt (spawn-proof:125–135): second turn reported `done` not `idle` even though tab active |
| **Blocked fails wait immediately at every point** (herding-prompt-stall D3:492) | Fast, loud failure on question nobody answers (trust, approval, auth) without agent-specific pattern table | Live trust-dialog miss: three concurrent agy runs all sat at "Do you trust?" while reported idle (Probe C:23–26) |
| **Ack file IS receipt, not herdr lifecycle** (herding-prompt-stall D4, hps-3:107) | File worker wrote unambiguous; not faked by boot flap, doesn't depend on tab focus, names WHO took job | Herdr state only failure detector; ack counts first heartbeat, "was work picked up" answerable from mailbox alone |
| **Start retries agent_pane_busy, bounded 10 ~1s** (herding-start-retry D1:12) | Pane split and shell boot race | Live dogfood hee-1: cold start failed; warm retry passed |
| **Wave cannot confirm finish** (bee-herding_waves-and-occupancy Open Gap:147–157) | Only completion signal available tracks pane attention, not work; two workers finished correctly but wave reported unverifiable | **Measured live Linux 2026-08-19, first D6 run:** two workers answered correctly; wave still reported unverifiable because only signal is pane focus attention. Ledger and pane output are what owner reads, not verdict. |
| **Presence exactly two effects only** (bee-herding_presence-wake-reports D1:19–31) | Presence flag quietly widening machine authority would hide permission control in convenience switch | Two effects enumerated exhaustively; gates/bypass/permission untouched; urgent exempt from quiet queue |
| **Autonomy earned, human still flips switch** (bee-herding_presence-wake-reports D2, 66c4c251:127–128) | Widening silence-is-consent is not automatic, never self-granted | Bar: clean run (zero reversed one-way decisions across 40–60 tasks). Change is human gesture; counters make case, never cast vote. |

---

## Explicit Unresolved Questions

1. **Hang detection on busy output.** Parked, no proposed mechanism yet.
2. **Wave completion certainty.** No signal beyond pane attention; workers do job correctly but still classified unverifiable.
3. **Job-id collision.** `job-<epoch-millis>` with no check; two runs in same millisecond share mailbox. Latent defect, not urgent (1.6s+ spacing observed live).
4. **Agent-specific permission/auth patterns.** Covered by `blocked` fast-fail + remedy line, not pattern table; but per-agent trust stores need pre-seeding (herding-prompt-stall D5 workspace_trust).
5. **Multiplexer JSON shape versioning.** No version probe; failure degrades to loud refusal (good), not silent stall, but still unversioned (operational-invariants:281–288).

---

**Status: DONE**

**Summary:** Upstream beegog herding has solved interactive pane transport through layered signal verification (process-identity liveness, state-transition delivery, file-proven receipt), turn-boundary intervention delivery with frequency caps, and separated observer/decision roles. Key unsolved: hang detection on busy output; wave completion certainty limited by pane-attention signals. Every design decision carries measured failure modes from live runs (smoke tests, dogfoods, production runs 2026-08-19 onward).

