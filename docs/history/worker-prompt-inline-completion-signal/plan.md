# Plan — tsk-3km: state the [DONE]/[BLOCKED] completion-signal requirement inline in worker-prompt-skill-pointer.txt and worker-prompt-default.txt

Mode: small

No `CONTEXT.md` exists for this item — the discovery-stage verdict was
`clear` (see `RESEARCH.md` Round 1 in this same directory), which skips
`exploring` entirely. Every claim below traces to that RESEARCH.md round
or to a direct read cited inline.

## Approach

**Chosen path.** Add a new `# How to finish` section to both
`src/runner/prompt-templates/worker-prompt-skill-pointer.txt` and
`src/runner/prompt-templates/worker-prompt-default.txt`, stating the
`[DONE]`/`[BLOCKED] <reason>` token requirement directly (mirroring the
STRUCTURAL pattern of `worker-prompt-discovery.txt`'s own self-contained
`# How to finish` section — a same-named heading placed right after
`# Worktree boundary` — but with content drawn from
`.agents/skills/_shared/coding-worker-contract.md`'s Layer 1 rule 4
vocabulary, not that file's `fgos-verdict` JSON shape, which belongs to a
different stage's contract). This closes the gap without touching the
3-hop indirection chain itself (`{skillPath}` -> `fgos-coding-implement`
thin wrapper -> canonical `SKILL.md` -> `coding-worker-contract.md`) —
that chain still exists and still governs the FULL contract (worktree
boundary, verify-before-claiming-done, commit discipline, the negative
rule); this plan only makes the ONE fact that has repeatedly failed to
reach a headless worker (tsk-2ux, tsk-2tmk) redundantly explicit at the
top level too, so a worker never needs to have actually opened the
3-hop chain to know the vocabulary exists.

**Alternatives rejected:**
- *Only fix `worker-prompt-skill-pointer.txt`, leave `worker-prompt-default.txt`
  alone* — rejected: RESEARCH.md Round 1 found `worker-prompt-default.txt`
  has NO `{skillPath}`/`# Agent skill` section at all, so a non-coding-domain
  dispatch through it has zero path (not even 3-hop) to the token
  requirement today — a strictly worse instance of the same gap the item
  describes, explicitly in the item's own suggested fix direction (both
  files named).
- *Rewrite `coding-worker-contract.md` to be shorter so the 3-hop chain is
  cheaper to traverse* — rejected: out of scope. The item's diagnosis is
  that a headless one-shot dispatch may never open the chain at all, not
  that the chain is too long once opened; shortening the destination does
  not fix a worker that never travels there.
- *Point `worker-prompt-default.txt` at `{skillPath}` too, extending the
  3-hop chain to non-coding domains* — rejected: `worker-prompt-default.txt`
  is deliberately domain-agnostic (the wildcard fallback in
  `TEMPLATE_RULES`, per `prompt-templates.mjs`'s own doc comment) and has
  no guaranteed `SKILL.md` chain to point at for an arbitrary future
  domain (`prompt-templates.mjs`'s own comment: "`coding` is the only
  domain with a shipped `SKILL.md` chain today"). Stating the token
  vocabulary directly, with no dependency on a domain-specific chain
  existing, is the only shape that is domain-agnostic by construction.

**Risk map:**

| Component | Risk | What would prove it |
|---|---|---|
| Editing the two `.txt` templates | low — static text addition, no `{placeholder}` touched, plain string-substitution rendering confirmed in RESEARCH.md | `node --test test/runner/prompt-templates.test.mjs` green after updating the two byte-for-byte golden assertions to include the new section |
| Golden-test drift | low — the two golden tests assert exact rendered output; forgetting to update them fails loudly, not silently | same verify command; a failing golden test is expected and self-diagnosing until the golden strings are updated to match |
| Placement relative to `# Constraints` (which already tells the worker never to call `fgos`) | low — no contradiction: the new section adds a reporting vocabulary, the existing `# Constraints` section already forbids state-writing verbs; both already coexist in `worker-prompt-discovery.txt` | read both sections side by side after editing to confirm no conflicting instruction |

No component here rises above light/low risk — no proof point beyond the
verify command above is needed at `fgos-coding-validating`.

**Impact-analysis posture: `degraded`.** Per `CLAUDE.md`'s gate,
`fgos tool query --capability impact-analysis --status present` reports
GitNexus present (provider `gitnexus`), but `mcp__gitnexus__list_repos`
shows no index registered for this item's own worktree
(`.claude/worktrees/tsk-3km-eQfCsN`) at all, and the nearest registered
sibling (`/home/vantt/projects/forgentX`, the main checkout) is 1433
commits stale. Blast radius is not confirmed via the graph tool for this
change. Cross-check instead (per the gate's own standing instruction):
`grep -rn "worker-prompt-default\|worker-prompt-skill-pointer" src/ --include="*.mjs"`
(already run in RESEARCH.md Round 1) returns exactly the one expected hit
— `prompt-templates.mjs`'s own `TEMPLATE_RULES` string literals — and no
other production code path references these template files by name. Given
the change is a static text addition (no placeholder renamed, no function
signature touched), this cross-check is sufficient at this item's `light`
risk/`small` lane; a deeper GitNexus call was not run given the low
plausible blast radius.

**`fgos graph --json` consulted** (per Approach's own requirement): the
graph's `topUnblock` was skipped server-side (graph too large,
`frame.skipped: ["topUnblock"]`) and `criticalPath` carries no entry
naming this item — this is a leaf-shaped, single-piece item with exactly
one internal ordering (edit the two templates, then update their two
golden-test assertions, then run the verify command), not a multi-step
piece needing the graph's own ordering signal. `tsk-3km`'s declared `deps`
lists `tsk-3ys` (a different, still-`todo` prompt-instruction item about
Iron-Law evidence, not about completion tokens) — no file-footprint
overlap with this item's own footprint (confirmed: `tsk-3ys`'s own
description names `worker-prompt-skill-pointer.txt`'s Iron-Law section,
a different addition than this item's `# How to finish` section, to the
same file — see Assumptions below), so this item does not need to wait
on `tsk-3ys` landing first to be planned or executed correctly.

## Files touched (in order)

1. `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` — add
   `# How to finish` section after `# Worktree boundary`, before
   `# Expected proof`.
2. `src/runner/prompt-templates/worker-prompt-default.txt` — same
   addition, same relative position (after `# Worktree boundary`, before
   `# Expected proof`); this template has no `# Agent skill` section to
   sit near, so the new section is unconditional prose, not conditioned
   on `{skillPath}` being meaningful.
3. `test/runner/prompt-templates.test.mjs` — update the two existing
   byte-for-byte golden-render assertions (`worker-prompt-default.txt` and
   `worker-prompt-skill-pointer.txt`) to include the new section's exact
   text at the new position.

## Assumptions

- **`tsk-3ys` may later add its own section to the same two files**
  (Iron-Law-evidence instructions) — not material to this plan: the two
  items add different, independent sections (this one: a `# How to
  finish` completion-token section; `tsk-3ys`: Iron-Law/evidence
  instructions) and neither's wording depends on the other's landing
  first or on a particular relative order between the two sections.
  Whichever lands second does a normal text-file merge/rebase, not a
  redesign. Implementation-only detail, not a scope or acceptance-criteria
  question — pinned here rather than raised as a gap.
- **The exact `[DONE]`/`[BLOCKED]` wording should paraphrase, not
  duplicate verbatim,** `coding-worker-contract.md`'s Layer 1 rule 4 —
  material only to phrasing, not to scope/behavior/acceptance; the two
  places already coexist at slightly different levels of detail in
  today's `worker-prompt-discovery.txt`/`coding-worker-contract.md` pair
  (discovery's own section states its own `fgos-verdict` protocol in
  full, never a pointer at the contract file, since discovery-stage
  workers do not use the `[DONE]`/`[BLOCKED]` vocabulary at all) — this
  plan follows that same precedent: state the executing-stage worker's
  own vocabulary directly and completely in the new section, not as a
  further pointer.

## Outstanding questions

None
