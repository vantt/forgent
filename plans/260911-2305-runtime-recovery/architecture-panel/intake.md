# Intake — runtime-recovery-design-panel

Author: external driver (coordinator)
Written: 2026-09-11T23:58:00+07:00

## The Person's Words (verbatim, never edited)

> hãy điều phối một fgos-architecture-panel cho design-panel-prompt.md

The referenced file, `plans/260911-2305-runtime-recovery/design-panel-prompt.md`,
is itself the person's fully authored case brief (not raw ambiguous intent —
the person wrote a complete panel charter). Its full text is reproduced here
verbatim as the actual case, since it IS the person's words for this session:

---

> # Design-Panel Prompt - Runtime Recovery
>
> Hãy điều phối một architecture design-panel độc lập cho thiết kế Runtime
> Recovery của fgOS.
>
> ## Mục tiêu
>
> Đánh giá và hoàn thiện thiết kế theo các tiêu chuẩn:
>
> - simple theo nghĩa experienced complexity, không phải sơ sài;
> - clean architecture, hexagonal architecture và SRP;
> - không thêm abstraction nếu không đại diện cho essential complexity;
> - có thể triển khai theo phase bằng code-panel;
> - agent mới không có chat history vẫn hiểu và thực hiện đúng contract;
> - không làm lại toàn bộ Agent Coordination.
>
> Panel chỉ review, challenge, chỉnh shape và đưa ra điều kiện đạt chuẩn triển
> khai. Không viết code và không tự chuyển sang implementation khi contract còn
> mơ hồ.
>
> [Full document at `plans/260911-2305-runtime-recovery/design-panel-prompt.md`
> — reproduced by reference, not re-typed in full here, per this repo's own
> "cite the source, don't copy large blocks" discipline; every later artifact
> in this session must read that file directly, never a paraphrase of it.]

The prompt additionally specifies: 15 mandatory reading-order documents, 15
baseline decisions (already locked from three rounds of prior independent
design review — see Case Boundary below), phase-scoped review points for
S0/P00 through P08, a 10-question simplicity audit, mandatory output shapes
(context/evidence report, ≥3 alternatives with a designated loser, contract
table, phase readiness matrix with four named labels, simplicity audit,
red-team report, final recommendation), and explicit conclusion rules (no
generic "architecture is reasonable," no READY without owner/port/crash-path/
proof, no external dependency disguised as local abstraction, no opening
code-panel for a phase that hasn't earned its own readiness).

Channel: typed, direct instruction in an interactive coding session; the
`design-panel-prompt.md` file was itself authored by the same person in an
earlier turn of the same session, not relayed from elsewhere.

## Who Is Asking

The person is the owner/maintainer of this repository (`forgentX`, the fgOS
platform), acting as architecture decision authority for this design track.
They hold real authority to accept, block, or redirect the runtime-recovery
design; they are the one who will decide whether S0-S8 implementation
proceeds. Whoever implements the phases (future code-panel cells) must live
with whatever contract this panel leaves behind — this session's output IS
the contract those cells will be handed with no chat history.

## Case Boundary

Project under advice: `/home/vantt/projects/forgentX` (fgOS repository)

Genuinely undecided (per the prompt's own instructions): whether the current
`detailed-design.md` + `phase-designs/*.md` package is actually simple,
hexagonal, SRP-clean, and implementable phase-by-phase without chat history;
which phases are READY FOR IMPLEMENTATION today; what the minimal additional
contract-tightening is before code-panel opens for each phase.

Explicitly out of bounds (the prompt's own words): "Panel chỉ review,
challenge, chỉnh shape và đưa ra điều kiện đạt chuẩn triển khai. Không viết
code và không tự chuyển sang implementation khi contract còn mơ hồ." — no
code, no silent transition to implementation. Also out of bounds per the
15 locked baseline decisions: reopening whether Run is the admission
authority, whether B04 blocks S2, whether writable takeover is disabled by
default, whether S0-S4 are Node-first, etc. — these are declared "chỉ bác
khi có bằng chứng mâu thuẫn trực tiếp" (only overturn with direct
contradicting evidence), not open questions for this panel to re-litigate
from scratch.

Constraints they volunteered (verbatim from the prompt): "Không được đổi
production behavior ngầm" (S0); "Phải xác nhận tái sử dụng
`withEventsLock`/`appendEventLocked`, không tạo lock thứ hai" (S1); "Nếu hiện
tại chỉ có `agentGet(name)` và chưa có `absent-proven`, không được local
workaround; phải đánh dấu replacement launch là gateway dependency" (S2);
"Không đề xuất effect ledger tổng quát nếu declaration + attestation đủ cho
first profile" (S3); "Không để profile này ảnh hưởng read-only path. Không
giả lập owner bằng filesystem lock hoặc Herdr pane" (P06 writable); "Không
tạo `RecoveryManager`, generic checkpoint framework, health store, effect
ledger hoặc implicit workspace authority" (global).

## Coordinator's Boundary Check

Is this actually undecided, or is the person seeking ratification? This is a
genuine review request, not ratification-seeking. The prompt explicitly asks
the panel to "challenge, chỉnh shape" (challenge, reshape) and states hard
stop conditions ("Không gọi ready nếu owner, port, crash path hoặc proof còn
mơ hồ" — never call something ready if owner/port/crash-path/proof is still
vague). The 15 baseline decisions are locked FINDINGS from prior independent
review rounds (documented in `plans/reports/design-review-260911-2233-
runtime-recovery-detailed-design.md`, a three-round adversarial review this
same coordinator ran immediately before this request), not the person's own
unexamined preferences — they already survived challenge. What is genuinely
open is whether the *packaged* detailed-design + phase-designs correctly
operationalize those findings into implementable, hexagonal, SRP-clean
phase contracts. This panel's job is to find where the packaging drops or
distorts what was already decided, and to grade phase-by-phase readiness
independently of this coordinator's own prior review (a second, differently-
sourced opinion is the explicit reason a 9-role multi-provider panel was
invoked instead of the coordinator just re-reading its own report).

## Roster Resolved At Intake

Standard 8-actor architecture-advisory-panel-v1 roster, per this skill's own
proven-safe executor allowlist (`claude-bwrap`, `agy-bwrap`, `codex-bwrap`;
`codex-readonly` retired). No deviation from the skill's default binding —
the case is a standard architecture-decision review with no signal requiring
a persona/tier change:

| Role | Executor | Tier | Persona |
|---|---|---|---|
| lead-advisor | claude-bwrap | critical (unpinned actor tier) | person-facing-advisory-lead |
| context-investigator | claude-bwrap | standard | disconfirmation-seeking-scout |
| system-shaper | claude-bwrap | analytical | direct-response-architect |
| alternative-shaper | agy-bwrap | analytical | different-priors-designer |
| constraint-advocate | codex-bwrap | analytical | production-reality-advocate |
| architecture-critic | agy-bwrap | critical | cross-proposal-attacker |
| synthesizer | claude-bwrap | critical | whole-ledger-integrator |
| red-team | codex-bwrap | critical | process-and-authority-attacker |
| specialist (on demand) | codex-bwrap default | as required | `<topic>-bounded-expert` |

Confirmed live before dispatch: all three executors `configured:true` via
`node src/runner/dispatch.mjs decide <id> --has-live-task-access`; protocol
`core.coordination-protocol.architecture-advisory-panel-v1@1.0.0` confirmed
registered in the group-thinking pack and its declared graph read directly
(not assumed from skill prose).
