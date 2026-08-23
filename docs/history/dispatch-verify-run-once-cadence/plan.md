# Plan — tsk-2ky: dispatch verify-cadence

Mode: standard

Lane decided directly (no `fgos-routing` Orient handoff in this session —
`/fgOS:pick` → `fgos-coding-driving` claimed and drove this item straight
through). Flags counted per `fgos-routing`'s own Mode-gate table
(`.agents/skills/fgos-routing/SKILL.md`): **public contracts** (the edit
target, `coding-worker-contract.md`, is explicitly the shared worker
contract every out-of-process coding dispatch reads, across every
provider) and **weak proof around the area** (RESEARCH.md Round 2: no
existing evidence confirms or rules out whether a cadence line actually
changes provider behavior). 2 flags → standard. No hard-gate flag applies
(no auth/data-loss/audit/external-provider/validation-removal), so not
high-risk; the fix path is real and actionable without a pre-validating
spike, so not spike either.

No CONTEXT.md exists for this item — discovery's own verdict was `clear`,
which skips `exploring` outright (per `fgos-coding-discovering`'s own
Flow step 4/5). `docsRef` registered fresh at this step, pointing at this
same feature dir already used for `RESEARCH.md` during discovery.

## Approach

**Chosen path:** add one sentence to `.agents/skills/_shared/
coding-worker-contract.md`'s Layer 2 rule 2 (currently: "Verify is a real
shell command, run before you claim done. ... Run it yourself; if it
fails, fix the root cause and rerun the exact command."), stating the
missing cadence explicitly:

> Run it once, near the end, when you believe the work is actually done
> — never as a per-edit habit.

placed before the existing "Run it yourself; if it fails..." sentence, so
the existing failure-driven-rerun allowance is preserved verbatim and
unweakened — the new text targets the *habitual* per-edit pattern
RESEARCH.md Round 1 found no existing text discourages, not the
legitimate re-run-after-a-real-failure case.

**Why this file, not the prompt templates:** RESEARCH.md Round 1 (full
read) confirms `worker-prompt-skill-pointer.txt` and
`worker-prompt-default.txt` share byte-identical "Expected proof" wording
with no cadence language, and every coding-domain out-of-process worker
is routed into the layered skill-pointer chain that ends at
`coding-worker-contract.md` regardless of which template dispatched it
(confirmed live in both `pi`/tsk-47r and `claude`/tsk-1dsr proof-tests,
`coding-worker-contract.md:129-176`). One edit to the shared contract
reaches every current and future coding-domain provider through the one
path they already all read; editing only the templates would need two
synced edits and still miss a worker that lands in the skill-pointer
chain without needing the template text re-read.

**Alternatives rejected:**
1. Edit only the prompt templates' "Expected proof" section instead of
   the shared contract — rejected per the above: two files to keep in
   sync, and doesn't cover the skill-pointer-chain path directly.
2. Block this item on a NEW live proof-test (a real expensive-verify
   dispatch against agy/gemini and the other providers) before writing
   any fix — rejected as this item's own scope. RESEARCH.md Round 2:
   proving provider-specificity needs a live multi-provider dispatch
   against a real `npm test`-scale verify command, a materially larger
   and separately expensive undertaking than a `standard`-lane text fix.
   The textual gap is independently real (Round 1) and worth closing on
   its own terms; a live A/B behavioral proof-test is a legitimate
   follow-up item, not a blocker for this one. This item's own scope
   stays honest: "the instruction now exists and is well-formed", never
   "provably changes agy's behavior" (see Risk map below).
3. Reword the prompt templates' "the runner runs it after you finish"
   framing — rejected: that framing is accurate (Layer 1 rule 4: the
   runner independently re-verifies, the worker's own report is never
   trusted alone) and rewording risks weakening the "never trusted on its
   own" invariant. The gap is the ABSENCE of a cadence rule, not an error
   in the existing runner-side framing.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| Text edit to a shared, every-provider-reads-it contract file | standard | The new sentence is well-formed, placed correctly relative to the existing failure-rerun allowance (doesn't weaken it), and the item's own scope stays docs-only (see verify below) |
| Whether the new line actually changes agy/gemini's (or any provider's) real behavior | weak proof, unresolved by this item | NOT claimed as proven by this item — named explicitly as a follow-up: a live re-dispatch of a similar item on agy/gemini with a real multi-step verify command, comparing re-run count before/after this text change. Recorded here so `fgos-coding-validating`'s reality check does not mistake "text exists" for "behavior confirmed" |

**Impact-analysis posture:** `full` — `fgos tool query --capability
impact-analysis --status present` returned `gitnexus` present
(`mcp:gitnexus`). Not applicable at symbol level for this item's own
edit: GitNexus indexes code symbols (functions/classes), and the edit
target is prose (`coding-worker-contract.md`, a Markdown fragment, not a
`.mjs`/`.ts` file with indexable symbols) — no `impact()` call against a
named symbol makes sense here. Recorded honestly rather than fabricating
a symbol-level blast-radius report for a doc-text change.

**Files touched, in order:**
1. `.agents/skills/_shared/coding-worker-contract.md` — the one real edit
   (Layer 2 rule 2).
2. `docs/history/dispatch-verify-run-once-cadence/plan.md` — this file
   (already in progress this session).
3. `CHANGELOG.md` `## [Unreleased]` — per `AGENTS.md`'s install/setup/
   doctor gate ("does this change something a user of fgOS would see?"):
   this changes worker-facing dispatch instructions every fgOS install's
   out-of-process coding dispatch relies on. To be confirmed/added at
   Execute, not assumed complete here.

## Shape

Concrete cases worth proving against, at `standard` depth:
- **Positive case:** the new sentence is present, verbatim enough to
  survive an exact-phrase grep (not a weak single-word match — see
  `docs/how-to/write-verify-for-a-skill-prose-change.md`'s trap #5, cited
  here by analogy even though `coding-worker-contract.md` is not
  literally a `SKILL.md` file — it is the same category of risk: LLM-
  interpreted prose pointed to by every `SKILL.md` in the skill-pointer
  chain, not deterministic code).
- **Existing behavior must not regress:** the failure-driven rerun
  allowance ("if it fails, fix the root cause and rerun the exact
  command") stays intact, unweakened, immediately after the new sentence
  — Layer 2 rule 2 still permits a genuine re-verify after a real
  failure, only discourages the habitual per-edit pattern.
- **Scope boundary:** this item is docs-only. No `src/` file should be
  touched by this item's own diff — the scope-boundary check standing in
  for a NEGATIVE clause here (there is no old string being erased/renamed,
  only a sentence being added, so the classic POSITIVE+NEGATIVE
  string-erasure shape does not apply verbatim; the boundary check is the
  same doc's own precedent for exactly this docs-only shape, per its
  "Cập nhật (tsk-rlv)" self-example).
- **Runtime comprehension is explicitly NOT this item's verify's job**
  (same doc, "Ranh giới" section, cited directly): whether the sentence
  actually changes a live provider's behavior is a merge-review/
  `fgos-coding-validating` judgment call and the named follow-up item
  above, never something a shell command can assert.

## Split decision

No split. One honest piece: a single sentence added to one file, plus its
own real verify. Nothing here crosses a module boundary or needs an
independently workable second piece.

## Verify (pass-through, synced onto the item)

```
npm test && grep -q 'per-edit habit' .agents/skills/_shared/coding-worker-contract.md && ! git diff --name-only main...HEAD | grep -q '^src/'
```

- `npm test` — the standing regression gate, per the shared prose-verify
  convention.
- POSITIVE — `grep -q 'per-edit habit'`: the new sentence's own
  distinctive phrase, long/specific enough not to false-positive
  elsewhere in the file (trap #5).
- Scope-boundary (standing in for NEGATIVE, since nothing old is erased):
  `! git diff --name-only main...HEAD | grep -q '^src/'` — this item
  never touches `src/`.

## Outstanding questions

None
