# Gate mechanisms today - facts (read-only scout, 2026-10-29)

Scope: what exists before a two-level gate redesign (low layer decides/enforces; Work layer only stores questions/approvals). Facts only.
Note: skills live as source under `core/skills/*` and `domains/coding/skills/*`; `.claude/skills/*` and `.agents/skills/*` are generated copies.

## 1. Mechanisms (who decides / where enforced / where stored / layer)

### M1. Skill-embedded auto-approve gate ("gate-bypass")
- Decider: Node pure functions in `src/state/gate-bypass.mjs`.
  - `LEVELS = ['off', ...SIZES]` (:35), default `off` (:37). `isSizeCovered(size, level)` (~:95): `off` covers nothing; a level covers its own size and lighter ones.
  - `hasOpenItems(text)` (~:118): `TODO:`/`FIXME(` marker, or missing/non-"None" `## Outstanding questions` section -> true (fail closed).
  - `canAutoApprove(item, artifactText, level)` (~:150): risk-keyword floor (`HEAVY_KEYWORDS`/`matchesKeyword` from `src/intake/risk-keywords.mjs`, over title+description with citations stripped) -> size coverage -> no open items. Only caller: gate `contextApprove`.
  - `canAutoApproveMergedGate(item, planText, childSpecs, costVerdict, level)` (:253-263): same floor over a widened structured haystack (title, description, footprint, child title/verify/action/footprint; NOT plan prose, measured 83.6% false-trigger), size ceiling, open items, and `costVerdict === 'REVERSIBLE'` (self-reported by the session, monotone toward asking). Gate `validateApprove`.
  - `readGateBypassLevel(dir)` (:55-68): reads config facade `gateBypass.level`; if the effective layer is `standard` (nothing set), falls back to legacy `<dir>/gate-bypass.json` (:74-93). Fails closed to `off`.
- Entry points (production):
  - `fgos gate-check <id> --gate contextApprove|validateApprove ...` -> `gateCheckUseCase` `src/verbs/state/read.mjs:30-41` (only production caller of both `canAutoApprove*`; `bin/fgos.mjs` comment at :2265 describes it). Routed `legacy-node` (`packages/host-runtime/contracts/command-routes.json:424-432`). Returns `{canAutoApprove: bool}`; read-only, writes nothing.
  - `fgos gate-bypass` verb -> Rust-native `work.gate-bypass.show` (`command-routes.json:410-423`, `packages/work-state/rust/src/lib.rs:26-120`); the Node `case 'gate-bypass'` at `bin/fgos.mjs:2261-2263` is the legacy-node twin (returns `{level: readGateBypassLevel(dir)}`).
- Enforcement: PROSE. The skill (`domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md`, `fgos-coding-validating/references/gate-auto-approve-mechanics.md`) tells the agent to run `gate-check`, treat anything but `data.canAutoApprove === true` as false, then either skip the question ("auto-approved: ..." line + `fgos decision`) or ask the person. The CLI only answers yes/no; nothing stops an agent from skipping the check or the question. No code path blocks `discover`/`plan` transitions on a missing approval for these two gates (see M3).
- Config storage: `gateBypass.level` in `.fgos/config.yaml` / global config (`core/config-standard/gateBypass.yaml`, `core/config-schema/gateBypass.schema.yaml`); set via `fgos config set gateBypass.level <v>`.

### M2. `awaiting-human` park (`fgos ask` / `fgos answer`) - the async human gate
- Verbs: `case 'ask'` `bin/fgos.mjs:1847-1881` -> `putInAwaiting`; `case 'answer'` `:1888-1905` -> `answerAwaiting` (`src/state/store.mjs:1428-1433`, delegates to `moveWork`). `--approve` flag = explicit owner yes (`:1898-1900`).
- Decider/enforcer: code. FSM edges `todo|doing -> awaiting-human` and `awaiting-human -> todo|...` in `src/state/status-fsm.mjs:175-177`, non-empty `--text` required on both edges; a `ask` text must pass the decision-question check (`src/state/decision-question.mjs`, used by status-fsm validator). Parked items drop out of the frontier.
- Storage: `work.move` event with `payload.ask` / `payload.answer` / `approved` / `askSource` / `statusAtAsk` / `parentSnapshotAtAsk` (`store.mjs:~800-830`), folded to `view.gates[id]` (`src/state/replay.mjs:341-380`; `approved` set only on answer with `--approve`, cleared on any new ask/answer :379-380). Spec: `docs/specs/work-state.md:217-232` (G1-G4). Rust reader: `packages/work-state/rust/src/work_source.rs:532-548` (observations `work.asked` / `work.answered`).
- Callers (production): `fgos ask` from agents per `core/skills/fgos-routing/SKILL.md:206-237` ("gate contract", prose); engine itself calls `putInAwaiting` from discovery (`src/intake/discovery.mjs`, unclear verdict parks) and decompose (`src/intake/plan.mjs:~754`, need-human or risks gate). Web UI NeedsAnswer/TaskDetail (`apps/fgos-gateway/web/src/screens/*`) lists `status=awaiting-human` and posts answers.
- Enforcement: mechanical for the park itself (FSM). That the agent *chooses* to ask is prose.

### M3. Structured gate-approve record (`fgos gate-approve`)
- Verb `bin/fgos.mjs:2151-2175` -> `recordGateApprove` `src/state/store.mjs:1645-1660`; gates allowed: `contextApprove`, `validateApprove` (`planApprove` refused as retired, :2168). Actor `human|bypass`, `--verify` required.
- Storage: `work.gate-approve` event -> `view.gates[id][gate] = {actor, at, verify}` (`src/state/replay.mjs:675-700`). Never moves the item, no CAS. Rust observe reads it as `work.gate-approved` (`work_source.rs:562-573`, `observe/.../scorecard.rs:425`).
- Written only by the skill's prose (gate-mechanics.md: "record it ... `fgos gate-approve --actor human|bypass`"). Nothing verifies `actor: human` was a real person - the agent supplies the flag. Route `legacy-node` (`command-routes.json:401`).
- UI: the web dashboard notes the gate-approve channel has no durable pending-question state (`NeedsAnswer.tsx:9`, `TaskDetail.tsx:402,510-513`), so a skill gate question asked in chat is invisible to Work until answered.

### M4. Consent-release inside engine (`--approve` on its own ask)
- `src/intake/plan.mjs:714-744`: decompose parks on need-human / heavy-risk / blast-radius. Released only when `gate.approved === true && gate.ask === formatProposalAsk(...)` (same ask text). Mechanical; reads `view.gates[id]` (M2 record).

### M5. Workflow-run human gates (`fgos workflow answer --approve`)
- CLI `bin/fgos.mjs:~2330` (`workflow answer`: `--step`, `--answer`, `--approve`), implemented `src/workflow/case-verbs.mjs:168,222`. Storage: per-case files under the case dir `gate-answers/<step>.rounds/*.json` (created exclusively, rendered view `.md`; `src/workflow/case-runtime.mjs:93-130`), then `gate.answer` event in the case log.
- Decider/enforcer: code. `src/workflow/case-projection.mjs:109-117` makes a milestone achieved with `consent:true` only if `approved===true` (mode `consent`) or any answer (mode `input`), bound to `subjectDigest`; `src/workflow/case-admission.mjs:~150-162` guard `human-consent` refuses a writing activity with `consent-missing | consent-stale | consent-subject-unknown`. Spec `docs/specs/workflow.md:235,263 (RUL-WF-14)`, `:430`. This is mechanical and digest-bound, the strongest gate in the repo. The projection (a record) IS the authority input here.

### M6. Runner approval of a Unit/item (`awaiting-approval`, `fgos approve/review/reject`)
- Runner settles `doing -> awaiting-approval` after a passing verify (`src/runner/loop.mjs:915-940,1049`); `fgos approve` (`bin/fgos.mjs:3672`, use case `src/verbs/merge/approve.mjs`) merges + verifies, `reject` -> todo. FSM `src/state/status-fsm.mjs:133-163`. Human-only role for delivered. Spec `docs/specs/runner.md:324`.
- Iron Law gate inside `approve`: `src/runner/iron-law-gate.mjs`, `src/evolve/iron-law.mjs` `classifyIronLaw`, level `ironLaw.level` `ask|warn` (separate config, deliberately NOT part of gateBypass: `docs/specs/runner.md:1000`). Mechanical.
- `fgos-fanout` (`core/skills/fgos-fanout/SKILL.md:130-145`) auto-calls `fgos approve` for LEAF items unless title/description hits `HEAVY_KEYWORDS`; never for the parent. Prose-driven, reuses the M1 keyword list directly (not via gate-check).

### M7. Decision-question template and hook
- Template `core/skills/_shared/decision-question.md` (5 parts + "approved frame"). Mechanical check `src/state/decision-question.mjs` (parts, min 20 chars/part) used by `fgos ask` validator and `fgos hook decision-question` (PreToolUse on AskUserQuestion/RequestUserInput, registered in `src/setup/agent-hooks.mjs:120-139`). Chat questions are checked in form only; not stored in Work.
- Engine-formatted asks: `formatDecisionQuestion` in `src/intake/discovery.mjs`, `plan.mjs`.

### M8. Other
- `fgos hook dispatch-decide` (Agent/Task tool dispatch gate; AGENTS.md "Dispatch"): decides mechanism, not human approval.
- Mailbox (`fgos mailbox`, Rust host, `docs/platform/agent-mailbox/spec.md`): agent-to-agent messages; scout found no question/approval semantics in src (`src/` mailbox hits are only the hook and `mailbox status` doctor check).
- Skills named fgOS:ask / fgOS:answer / fgOS:approve: no such skill dirs in `core/skills` (list: distill, fgos-advise, fgos-architecture-panel, fgos-clarifying, fgos-cook, fgos-fanout, fgos-group-thinking, fgos-indexing, fgos-lock-fence, fgos-researching, fgos-routing, fgos-run, instruction-audit, _shared). They are plain CLI verbs `fgos ask|answer|approve`. `fgos-clarifying/SKILL.md:151` only forbids calling them.
- Coding-domain skills with gates: `domains/coding/skills/fgos-coding-exploring` (contextApprove) and `fgos-coding-validating` (validateApprove). `fgos-coding-planning` no longer owns a gate.

## 2. Callers and enforcement summary

| Mechanism | Production callers | Enforcement |
|---|---|---|
| gate-check / canAutoApprove* | skills via CLI only (`read.mjs:30`) | prose: agent obeys result |
| gate-bypass level | gate-check, `fgos gate-bypass`, doctor/config checks | code (read), but only consulted if agent calls gate-check |
| ask/answer park | agent per routing skill, engine (discovery, decompose), web UI | FSM mechanical; decision to ask is prose |
| gate-approve record | skill prose | none; `actor` self-declared |
| plan.mjs consent release | `fgos plan`/decompose | mechanical, reads `view.gates[id].approved` |
| workflow consent gate | `fgos workflow answer`, admission | mechanical, digest-bound |
| approve/reject (runner) | humans, fanout skill (leaves) | mechanical merge+verify+Iron Law; who calls is prose |

## 3. Where approvals are recorded and read back

- `view.gates[id]` (Work event log, folded in `src/state/replay.mjs`): `ask`, `answer`, `approved`, `askHistory`, `contextApprove`, `planApprove` (legacy), `validateApprove`.
- Read back to decide (record = authority today):
  - `src/intake/plan.mjs:723-744`: `gate.approved` + matching `gate.ask` releases the heavy-risk and blast-radius parks.
  - `src/intake/discovery.mjs:354`: reads `gates[id].contextApprove.verify` as the verify command for the advance.
  - `src/intake/plan.mjs:530`: reads `gates[id].planApprove.verify` (retired gate, still read).
  - `src/runner/loop.mjs:983,1404`: feeds `gates[id].answer` back to the worker as feedback (information, not a decision).
  - `src/state/awaiting-context.mjs:62`: derived read of `parentSnapshotAtAsk` (display).
  - Workflow: `case-projection.mjs` derives `consent` milestone from `gate.answer` events; `case-admission.mjs` uses it to refuse writes (decision from the record).
- NOT read back: `contextApprove.actor`/`validateApprove` records are never consulted to allow/deny any transition. `gate-check` itself does not read `view.gates`.
- Display-only readers: web dashboard (TaskDetail `gates`), Rust observe/scorecard, herdr-fgos-common (`fgos.rs:292-302` NEED ANSWER = `blocked`+`awaiting-human`).

## 4. Prior art (git + history docs)

- `gate-bypass`: first commits 2026-07-29 `bb3831bec` (plan), `5942b4f6e` feat config/state layer (tsk-6bx-1), `8aaacee8f` wire exploring/planning Gate steps (tsk-6bx-2). `docs/history/gate-bypass/CONTEXT.md` D1-D11: D1 targets skill-embedded gates only, never the `awaiting-human` park; D2 skip = mechanical zero open items, never the session's confidence (relaxed only by D11/tsk-224 because the merged gate is monotone toward asking); D3 skipped gate stays visible (line + `fgos decision`); D4 risk-keyword floor non-negotiable; D5 two axes (mechanical completeness + tier level); D6 `validateApprove` verdict axis (superseded by D9); D7/D8 import-resolution fixes, `gate-check` verb added by tsk-65q (`docs/history/tsk-65q-gate-bypass-global-install-resolution/`).
- `awaiting-human`: `6dc36bdb1` add status + FSM edges, `ba17d5b0b` store verbs + replay, `84e49680a` ask/answer verbs + frontier lock (async-human-gate 1a/3), spec sync `de061dc96`.
- `canAutoApprove`: first in `5942b4f6e` (2026-07-29). `gate-approve` record: `25a85ecf0` 2026-08-02 (tsk-19j-1).
- `docs/history/coding-planning-validating-gate-redesign/CONTEXT.md` (tsk-224): merged `planApprove`+`validateApprove` into one gate at `fgos-coding-validating` before materialize; keyword floor measured and moved onto structured fields (D10); tier ceiling = delegation appetite not risk (D11); record name `validateApprove` kept for history continuity. Also `docs/knowledge/why-fgos-coding-planning-and-fgos-coding-validating-merged-t/`.
- `docs/history/doctor-fix-gate-bypass/CONTEXT.md`: D1-D4 `doctor --fix` registry; gate-bypass level moved into shared config (`gateBypass.level`), legacy `.fgos/gate-bypass.json` bootstrap kept via `ensureSharedConfigDefaults`.
- Other related history dirs: `gate-approve-vs-movenext-semantics`, `gate-question-quality-and-routing`, `iron-law-gate-human-ux`, `tsk-4vz-gate-approve-planapprove-write-refusal`, `tsk-592-gate-predicate-and-mechanism-rename`, `gate-bypass-audit-decision-kind`, `tsk-104-cook-gate-bypass-prose-reconciliation`.
- Specs: `docs/specs/work-state.md:217` (gate record G1-G4); `docs/specs/workflow.md:235,263,320,430` (consent gate guard, RUL-WF-14/-20); `docs/specs/runner.md:324,994-1000` (approve gate, Iron Law RUL34-37, RUL64 ironLaw.level separate from gateBypass); `docs/specs/herdr-web-dashboard.md:53,71` (question-needing-answer unions ask and gate-approve channels).

## 5. Duplication / "tum lum"

1. Level read twice: Node `readGateBypassLevel` (`src/state/gate-bypass.mjs:55`) and Rust `read_gate_bypass_level` (`packages/work-state/rust/src/lib.rs:100-114`); the Rust doc says "same fail-closed posture as gate-bypass.mjs". Both implement config-then-legacy-file fallback. `fgos gate-bypass` (Rust) and `gate-check` (Node) can in principle disagree.
2. Legacy `.fgos/gate-bypass.json` fallback duplicated in both (`gate-bypass.mjs:74-93`, `lib.rs:88-98`), plus a stale description of the verb: `src/cli/command-registry.mjs:990` still says the level comes "from .fgos/gate-bypass.json".
3. Two Node twins of the gate-bypass verb: `bin/fgos.mjs:2261` and the native Rust route; registry text at `command-registry.mjs:1197` says "2 live skill-embedded Gates".
4. `canAutoApprove` vs `canAutoApproveMergedGate` repeat the same three checks (floor, size, open items) with different haystacks; the first has a single remaining caller.
5. Risk-keyword floor used three ways: gate-bypass (`HEAVY_KEYWORDS`), Iron Law (RUL35 shared list), and fgos-fanout prose reimplementing a leaf-level check by hand.
6. "Approved" is represented in four shapes: `gates[id].approved` (ask/answer), `gates[id].<gate>.actor` (gate-approve), workflow `gate.answer.approved` (+ subjectDigest), runner `awaiting-approval -> delivered` (approve verb). Only the workflow one binds to a content digest.
7. Retired `planApprove`: still read at `src/intake/plan.mjs:530` and still in replay fold comment; verb refuses it.
8. Skill gate questions asked in chat (AskUserQuestion) are not stored anywhere (no durable pending state, `NeedsAnswer.tsx:9`); only the post-hoc `gate-approve` + `fgos decision` lines exist.
9. `docs/explanation/gate-bypass-design.md` is cited (e.g. `src/state/gate-bypass.mjs:15`, `docs/specs/runner.md:2769,2832`) but the file does not exist at that path (`ls` fails; `docs/explanation/` exists).
10. `actor: human|bypass` on gate-approve is self-declared by the agent; no door verifies a human answered.

## Open questions

- Is the gate to be enforced in the agent's own process (skill/CLI side) or at the `fgos` verb that performs the next transition (discover/plan/materialize)? Today no verb refuses a transition lacking a gate-approve record.
- Should workflow consent (digest-bound, mechanical) be the model, and what becomes of `gates[id].approved` consent release in plan.mjs?
- Does `gate-check` stay Node (`legacy-node`) or move to the Rust host next to `work.gate-bypass.show`?
- Fate of the `.fgos/gate-bypass.json` legacy fallback in both languages.
