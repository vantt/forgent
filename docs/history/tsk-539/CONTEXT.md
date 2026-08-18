# tsk-539 — gate-question self-sufficiency (citation + Markdown format)

Locked decisions for `tsk-539` (STR71). Full shaping history across this
cluster's related items lives in `docs/history/gate-question-quality-and-
routing/DISCUSSION.md#task-self-sufficiency` (this item's `refs` field).
Real, dated research findings live alongside this file in `RESEARCH.md`.
`fgos context-render` resolves this file at `docs/history/<id>/CONTEXT.md`
by default (no `docsRef` was set on the item), so this pass keeps
`CONTEXT.md`/`RESEARCH.md` at the default `docs/history/tsk-539/` rather
than fighting that resolution with a custom `docsRef`.

## Feature boundary

Improve the writing quality of gate/ask questions **for a human reader**:
(1) the wording must stand alone (restate the item, name real options,
never point at something unreachable), (2) citations embedded in that
text must be self-contained too (no bare `task-id`/`D-ID`/`RUL-ID` without
an inline gloss), (3) the text must be Markdown, same as every other
paragraph-shaped work-item field, and (4) — the concrete, primary machine
check per D11 — the question must state a context/background summary AND
explain why that context leads to the problem being asked, not a bare
question with no setup. (4) is the one requirement explicitly slated for
real (but simple) machine enforcement; (2) and (3)'s own enforcement
strength (machine-checked vs. convention-only) is left to planning — D11
narrowed WHAT gets machine-checked first, it did not drop (2)/(3) as
requirements.

Explicitly NOT this item: rewiring skills to `state.decisions` for an
agent reader (`tsk-3uw`), reducing the volume of questions asked at
`gate-approve` (`tsk-5hg`, delivered), rendering existing content in a web
dashboard (`tsk-ldb`/`tsk-4id`, delivered), or the hard approve-time
close-gate question the tsk-37i/tsk-1lv audit (`plans/reports/from-
code-reviewer-to-planner-260817-2010-tsk-37i-post-merge-audit-report.md`,
finding F6) left unresolved between those two unrelated items.

## Pinned terms

- **Bare citation** — an id (`tsk-xxx`, `D<n>`, `RUL<n>`, `ADR<n>`) with no
  accompanying gloss long enough to stand as prose (the same `isGlossed`
  15-character-ish heuristic `scripts/check-decision-citation-drift.mjs`
  already uses for `.md` files — see Scout evidence below for why that
  specific checker cannot be reused here as-is).
- **Paragraph-shaped field** — any work-item text field that holds free
  prose, as opposed to a short label/enum value: `description`,
  `decision.text`/`rationale`/`alternatives`, and `ask`/`gate-approve`
  question text.
- **Structurally complete question** (D11) — a gate/ask question that
  states, at minimum, a context/background summary and an explanation of
  why that context produces the problem being asked. The real, near-term
  machine-enforcement target for this item — deliberately simpler than
  citation-gloss correctness (presence of two things, not semantic
  correctness of a citation).

## Scout evidence

- `plans/reports/from-code-reviewer-to-planner-260817-2010-tsk-37i-post-
  merge-audit-report.md` (untracked in the working tree at claim time) —
  audited tsk-37i's citation-format convention + checker. Findings F1/F2
  (CRITICAL baseline bugs) are now fixed and delivered
  (`tsk-3x8`, `tsk-6at`); F8 (bare citation in generated skill wrappers) is
  fixed (`tsk-352f`); F3-adjacent scan-root widening is in progress
  (`tsk-12v`, `doing`) — all file-based (`docs`/`src`/`.agents/skills`).
- `bin/fgos.mjs:1853` (`case 'ask'`) and `:1889` (`case 'answer'`) —
  thin CLI wrappers with zero content-shape validation of `--text` beyond
  non-empty.
- `src/state/store.mjs:870` (`putInAwaiting`), `:896` (`answerAwaiting`),
  `:179` (`addWork`), `:295` (`editWork`), `:1134` (`addDecision`) — the
  five functions every paragraph-shaped field's write actually passes
  through. All in one file, all doing presence/CAS/shape (`validateWork`,
  `validateDomainFields`) checks today, never a content-format check. This
  is the natural seam a shared validator would hook into — recorded here
  as evidence for `fgos-coding-planning`, not decided here (implementation
  shape is planning's call, per this skill's own boundary).
- `RESEARCH.md` (this folder) — discovery round 1, full citations for the
  "citation checker never reaches event-log text" and "zero
  Markdown-validation infra exists" findings D8/D9 below are grounded on.
- Impact-analysis capability posture: `fgos tool query --capability
  impact-analysis --status present` → GitNexus registered and `present`
  (full posture per `CLAUDE.md`'s gate). Informational only — this skill
  edits no code.
- This item does not itself edit any `SKILL.md` file, so `docs/how-to/
  write-verify-for-a-skill-prose-change.md`'s conditional guidance was
  checked but does not apply to this item's own `verify` — planning may
  still need it if it chooses to implement via skill-prose changes to the
  ask/gate-approve writing skills.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D4 | ganh nang yes/no cua nguoi van hanh nam chu yeu o kenh work.gate-approve (ba cong skill contextApprove/planApprove/validateApprove), khong phai kenh gates.ask |
| D6 | validateApprove duoc bypass khi reality gate khong sinh ra rang buoc nao; co bat ky rang buoc nao thi hoi nguoi |
| D7 | hai vung luu tru cho hai nguoi doc — state.decisions la nguon authoritative cho agent (ngan, du bang chung), CONTEXT.md tu do toi uu cho nguoi (narrative, thoang, markdown day du); KHONG noi skill vao state.decisions cho toi khi phep kiem do sach xanh |
| — | Dinh chinh D7 (seq 10187): rationale cua D7 noi 'store.mjs:835 appendEvent khong cuong che rationale, CLI required-field khong duoc cuong che o tang store' — SAI |
| — | tsk-539's scope narrowed back to its original core (ask self-sufficiency: the writing quality of a gate question for a HUMAN reader), cutting the accretion added over 12 discussion rounds. Not closed as superseded, and not replaced by a new item. |
| — | tsk-539 scope mở rộng: không chỉ CÂU CHỮ của gate question phải tự-đứng-được, mà THÔNG TIN/dữ liệu mà câu hỏi trích dẫn cũng phải tự-đứng-được — không được chỉ liệt kê bare id (task id, D-id, RUL-id...) rồi bắt người đọc tự tra chéo, phải kèm đủ nội dung/ngữ cảnh ngay trong câu hỏi. |
| — | tsk-539 scope mở rộng thêm: mọi tài liệu/thông tin ghi vào work-item (description, decision text, rationale, alternatives, ask/gate question...) phải viết dạng Markdown -- không plain text thuần, không cấu trúc tuỳ tiện khác. |
| D8 | gate/ask question citations get real machine enforcement (not convention-only) -- a NEW check, since no existing mechanism reaches event-log text |
| D9 | Markdown-mandate applies to every paragraph-shaped free-text field on a work item, not only ask/gate questions -- description, decision.text/rationale/alternatives, and ask/gate-approve question text alike |
| D10 | rewrite this item's description before planning to reflect current real scope (D8/D9 above plus both 2026-08-17 scope-expansion decisions), replacing the stale 2026-08-12 narrowed-to-core framing |
| D11 | real machine enforcement targets STRUCTURAL COMPLETENESS of the question -- presence of a context/background summary AND an explanation of why that context leads to the problem being asked -- not citation-format correctness. Supersedes D8's framing. |

## Outstanding questions

None
