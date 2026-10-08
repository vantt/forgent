# Shared fragment: decision-question

Every question that asks the owner to choose a direction — in chat, through
`AskUserQuestion`, `fgos ask`, a gate, or a review — carries these five parts.
Write the analysis first; the question is a narrow confirm on top of it.

1. **Chuyện gì đang xảy ra** (What is happening) — 1-2 sentences, plain words.
2. **Nguyên nhân** (Cause) — what you checked and how. If the cause is still
   unknown, ask only for permission to investigate, not for a direction.
3. **Các lựa chọn** (Options) — 2-4 options; each says what it does, its gain,
   its harm and its cost (estimated lines of code, time, which layer or paths
   it touches).
4. **Khuyến nghị** (Recommendation) — which option and why.
5. **Phạm vi của câu trả lời** (Scope of the answer) — what a yes authorizes,
   and what it does not.

An acceptance gate that cannot be met inside the declared scope is a decision
question in this form; never edit outside the scope to unblock it.

Open discovery questions (item stage `discovery` or `exploring`, Socratic
questions in fgos-coding-exploring/-shaping) need only parts 1, 2 and 5: their
options are not known yet, and inventing them defeats the question.

When to ask and how to batch: AGENTS.md product priority #2. Headings may be
Vietnamese or the English names above. `fgos ask` and the AskUserQuestion hook
check the parts through `src/state/decision-question.mjs`.
