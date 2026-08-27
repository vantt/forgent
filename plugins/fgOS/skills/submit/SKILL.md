---
name: submit
description: >-
  Use when the user wants to submit new work into the fgOS backlog from
  inside a Claude Code session, invoked as /fgOS:submit <free-text
  description>. Intakes the free text through fgOS's own submit verb,
  checking first for a clear, textually-grounded dependency on an existing
  item and always getting explicit confirmation before attaching any
  dependency. Examples: "/fgOS:submit fix the flaky retry test", "/fgOS:submit
  add pagination to the list view".
---

# fgOS submit

Wraps `fgos submit` so a person working inside Claude Code can add a new
work item without leaving the session or hand-typing the CLI. Never writes
`.fgos/` state directly — every write goes through the `submit` verb
(one-door-write, CTR001).

The `submit` VERB's own classification of `kind`/`tier`/`risk` is always
the mechanical keyword-count fallback (`src/intake/classify.mjs`, no
model/LLM call, deterministic) — that never changes, and it is what a
bare shell, cron, or another agent calling the verb directly always gets.
This value is only ever a TEMP placeholder now (D12, tsk-2yo): the real
judgment happens later, once at stage `discovery`, on real research
evidence — this skill never re-judges `tier`/`kind`/`risk` itself, at any
point, for any caller.

What changed (tsk-qod D2, supersedes tsk-5wz's own ordering): when this
skill runs inside a LIVE session, `fgos-clarifying` now runs BEFORE the
item is ever created (step 4) — not after, at stage `discovery`, the way
tsk-5wz originally wired it. `fgos-clarifying`'s own contract changed with
it (tsk-qod D1/D2, `clarify` retired as a stage entirely): it is now a
pure Init-time, verdict-only helper that reads the raw submitted text and
returns `{title?, description?, domain, question?}` straight back to this
skill — it never touches item state itself, because at this point no item
exists yet to touch. `submit` (step 5) is called with whatever text/domain
that verdict settled on. `tier`/`kind`/`risk` are never re-judged here at
all (D12, tsk-2yo) — `discovery`'s own skill chủ (`fgos-coding-discovering`)
does that, once, on real research evidence, for every item regardless of
which caller created it.

Step 4 is skipped entirely for the no-soul callers (see its own gate) —
for them this skill's behavior stays byte-identical to before, mechanical
placeholder values included. A wrong placeholder is cheaply corrected
later by `discovery`'s own judgment, not by this skill.

## Steps

1. **Read the free-text description.** The argument the user passed after
   `/fgOS:submit` is the work item's text: `$ARGUMENTS`. If it is empty,
   ask the user for the text before doing anything else — `fgos submit`
   requires non-empty text and will reject an empty call anyway.

   `submit` derives the item's title mechanically from this text — the
   first sentence or line, cut at whatever boundary comes first (never an
   LLM call, never this skill's own judgment). A title that reads clearly
   in a task list names the object being touched, the action being taken,
   and the scope it's bounded to (đối tượng + hành động + phạm vi). Nothing
   here rewrites the user's text to force that shape — but if you are the
   one composing `$ARGUMENTS` from a looser request (rather than passing
   the user's own words through untouched), lead with a sentence that
   already carries all three, so the derived title does too.

2. **Scan the current fgOS view for a dependency candidate.** Run:

   See `../_shared/fgos-cli-fallback.md`, substituting `<verb-cmd>` with:

   ```
   list --all --json
   ```

   Read the returned items' titles/text and look for candidate matches against
   the new submission using two parallel heuristics:

   - **Dependency heuristic**: look for a CLEAR, textually-grounded match —
     e.g. the new text names the same subsystem, file, feature, or bug that an
     existing open item's title already names. (Do not infer a match from a
     vague thematic similarity, a shared single common word, or a guess about intent).
   - **Consolidation heuristic**: check for consolidation keywords in the
     new submission's own text (`redesign`, `consolidate`, `gop`, `gom`, `thay-the`)
     against the candidate item.

   Determine a **direction hint** based on which heuristic matched:
   - `blocked-by` hint: when the dependency heuristic alone matched (the new item is likely blocked by the candidate).
   - `superseded-by` hint: when the consolidation heuristic also or only matched (the new item likely consolidates or replaces the candidate).
   - **No hint**: when neither heuristic gives a confident read.

   If nothing in the list matches either heuristic, there is no candidate —
   skip straight to step 4 with no candidate.

3. **If a candidate was found, present it and require an explicit
   confirm/edit/reject response before proceeding.** Show the user the
   candidate item's id and title, and the specific text that grounds the
   match (quote the overlapping phrase/subject). Ask whether to:
   - **confirm-as-blocked-by** — attach this candidate item's id as a dependency (`deps`) on the new item (the new item cannot finish until the candidate finishes first),
   - **mark-as-superseded-by** — mark the existing candidate item with `supersededBy` pointing to the new item once created (the new item consolidates or replaces the candidate; does not block the new item),
   - **edit** — attach or mark different ids provided by the user with their explicitly chosen direction,
   - **reject** — submit with no relationship attached.

   If a direction hint was produced in step 2 (`blocked-by` or `superseded-by`),
   pre-select it as the shown default option. If no hint was produced, ask
   directly with no default.

   Do not proceed to step 4 until the user has answered in this turn.
   Never auto-attach a suggested dependency or auto-mark a superseded item
   without this explicit response — this is a hard requirement, not a convenience default.

4. **If — and only if — a live interactive session is running this,
   clarify BEFORE the item exists (tsk-qod D2).**

   **The gate.** Do this step when a person invoked `/fgOS:submit`
   directly in an interactive session. SKIP it entirely when this skill
   was reached any other way — `dogfood-fixture:submit`'s scenario replay,
   a cron/script/`--watch` runner, or another agent delegating to it. Those
   are the no-soul paths: they proceed straight to step 5 with the raw
   text from step 1 unchanged and no `--domain` flag, so `submit`'s own
   mechanical defaults apply exactly as they always have. This gate is the
   whole reason the replay stays byte-identical — never widen it to
   "always".

   For a live interactive session: invoke the `fgos-clarifying` skill on the raw text
   from step 1 — there is no item yet, so it reads text only, never an
   id. It returns `{title?, description?, domain, question?}` (verdict-
   only — it writes no state itself, tsk-qod D1/D2):

   - **`question` present** — the intent itself is unclear. STOP here and
     ask the person the exact question, directly in this conversation —
     there is no item and no id to park it against, so this is the ONLY
     place the question can live (same "do not proceed until the user has
     answered in this turn" discipline step 3 already uses for the
     dependency confirm). Once the person answers, fold their answer into
     the text and invoke `fgos-clarifying` again on the combined text
     before continuing — never skip straight to step 5 on the strength of
     the conversation alone; the fresh verdict is what actually clears the
     gate (and still needs a `domain` classification either way).
   - **`question` absent** — intent is understood. Carry the verdict's
     `domain` (always present) into step 5's `--domain` flag. If the
     verdict also included a rewritten `title`/`description`, use that
     text (and report the one-line rewrite the skill already gave you) in
     place of the step 1 original for step 5; otherwise use step 1's text
     unchanged.

5. **Call `submit` (and apply any `supersededBy` edits).**
   - If the user confirmed (or edited to) one or more dependency ids as `blocked-by` (confirm-as-blocked-by), run:

     Both branches use `../_shared/fgos-cli-fallback.md`, substituting
     `<verb-cmd>` with:

     ```
     submit "<text>" --deps <confirmed-ids> --domain <domain> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

     where `<confirmed-ids>` is a comma-separated list of the confirmed
     `blocked-by` dependency ids.
   - If no candidates were confirmed as `blocked-by` (or if all were confirmed as `mark-as-superseded-by` or rejected), or no candidate was found in step 2, run the same fallback with **no `--deps` flag at all**:

     ```
     submit "<text>" --domain <domain> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

   `<text>` is the (possibly clarify-rewritten) free-text description from
   step 4, double-quoted so it survives shell parsing as a single
   argument. `<domain>` is step 4's classified domain when it ran; for a
   no-soul caller (step 4 skipped), omit `--domain <domain>` entirely from
   both commands above — that flag only ever appears when step 4 actually
   produced a classification, never a guessed default of your own.

   `--dir` (tsk-56t): this session may already be inside a linked
   worktree from an earlier `/fgOS:pick`, which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly.

   - If one or more candidates were confirmed (or edited) as `mark-as-superseded-by`,
     once `submit` returns the new item's real id (`<new-id>`), loop `fgos edit` for
     each candidate confirmed for this branch using `../_shared/fgos-cli-fallback.md` to
     set its `supersededBy` pointer:

     ```
     edit <candidate-id> --superseded-by <new-id> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     ```

     Note: both `blocked-by` and `mark-as-superseded-by` can occur in the same submit call
     when multiple candidates were found and confirmed differently.

6. **Report the result.** Merge all results into a single report back to the user.
   Relay `submit`'s own output (the new item's id and derived fields), stating
   which candidates were attached as `deps` (`blocked-by`) and which candidates received
   a `superseded-by <new-id>` edit. If any `submit` or `edit` command fails, show
   the real error — do not retry with a modified/guessed id and do not silently
   drop the failure. `tier`/`kind`/`risk` on this new item are still the
   mechanical placeholder
   (D12, tsk-2yo) — `discovery`'s own skill chủ judges the real values
   later, not this skill; there is no further step here that touches
   them.
