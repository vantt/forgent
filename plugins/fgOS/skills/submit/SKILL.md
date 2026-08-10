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

What changed (tsk-5wz): when this skill runs inside a LIVE session, it no
longer stops at that mechanical guess. Step 6 continues straight into the
item's `discovery` stage in the SAME session — `fgos-clarifying` first, so
the item's title/description get written clearly, and only THEN is
`tier`/`kind`/`risk` re-judged against the CLEAN text. Classifying the raw
ask before clarify meant judging the worse of the two drafts; this reverses
that order, and asks any genuine question while the person is still right
there instead of days later at a discovery sweep.

Step 6 is skipped for the no-soul callers (see its own gate) — for them
this skill's behavior stays byte-identical to before, mechanical values
included. A wrong guess is cheaply correctable later via `fgos edit <id>`
either way.

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

   ```
   # fgos CLI fallback (tsk-1no D3)
   FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
   if [ -f "$FGOS_BIN" ]; then
     node "$FGOS_BIN" list --json
   elif command -v fgos >/dev/null 2>&1; then
     fgos list --json
   else
     echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
     exit 1
   fi
   ```

   Always use the literal `${CLAUDE_PROJECT_DIR}` substitution shown above,
   never a relative path — an installed plugin's files run from a copied
   cache location, not from this repo checkout, so a relative path would
   resolve to the wrong place or fail outright.

   Read the returned items' titles/text and look for a CLEAR,
   textually-grounded match to the new submission — e.g. the new text
   names the same subsystem, file, feature, or bug that an existing open
   item's title already names. Do not infer a dependency from a vague
   thematic similarity, a shared single common word, or a guess about
   intent. If nothing in the list is a clear match, there is no
   candidate — skip straight to step 4 with no deps.

3. **If a candidate was found, present it and require an explicit
   confirm/edit/reject response before proceeding.** Show the user the
   candidate item's id and title, and the specific text that grounds the
   match (quote the overlapping phrase/subject). Ask whether to:
   - **confirm** — attach this item's id as a dependency,
   - **edit** — attach a different id (or set of ids) the user provides,
   - **reject** — submit with no dependency at all.

   Do not proceed to step 4 until the user has answered in this turn.
   Never auto-attach a suggested dependency without this explicit
   response — this is a hard requirement (D4), not a convenience default.

4. **Call `submit`.**
   - If the user confirmed (or edited to) one or more dependency ids, run:

     ```
     # fgos CLI fallback (tsk-1no D3)
     FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
     if [ -f "$FGOS_BIN" ]; then
       node "$FGOS_BIN" submit "<text>" --deps <confirmed-ids> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     elif command -v fgos >/dev/null 2>&1; then
       fgos submit "<text>" --deps <confirmed-ids> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     else
       echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
       exit 1
     fi
     ```

     where `<confirmed-ids>` is a comma-separated list of the confirmed
     dependency ids.
   - If the user rejected the suggestion, or no candidate was found in
     step 2, run the same command with **no `--deps` flag at all**:

     ```
     # fgos CLI fallback (tsk-1no D3)
     FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
     if [ -f "$FGOS_BIN" ]; then
       node "$FGOS_BIN" submit "<text>" --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     elif command -v fgos >/dev/null 2>&1; then
       fgos submit "<text>" --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
     else
       echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
       exit 1
     fi
     ```

   `<text>` is the original free-text description from step 1 (or the
   text the user supplied if they were asked for it in step 1),
   double-quoted so it survives shell parsing as a single argument.

   `--dir` (tsk-56t): this session may already be inside a linked
   worktree from an earlier `/fgOS:pick`, which never carries its own
   `.fgos/` by design (ADR0020) — `${CLAUDE_PROJECT_DIR}` still resolves
   to the main checkout even from inside that worktree (it survives an
   `EnterWorktree` switch), so passing it as `--dir` here points this
   write at the one real store explicitly.

5. **Report the result.** Relay `submit`'s own output (the new item's id
   and derived fields) back to the user. If the command fails (e.g. an
   unknown dependency id), show the real error — do not retry with a
   modified/guessed id and do not silently drop the failure.

6. **If — and only if — a live soul is running this, continue into
   `discovery` in THIS session.**

   **The gate.** Do this step when a person invoked `/fgOS:submit`
   directly in an interactive session. SKIP it entirely when this skill
   was reached any other way — `dogfood-fixture:submit`'s scenario replay,
   a cron/script/`--watch` runner, or another agent delegating to it. Those
   are the no-soul paths: they stop at the verb's mechanical values, and
   `discovery` runs later at whatever sweep next picks the item up. This
   gate is the whole reason the replay stays byte-identical — never widen
   it to "always".

   a. **Clarify first, on the raw text.** Invoke the `fgos-clarifying`
      skill for the new id. It is DOMAIN-AGNOSTIC by contract (0027 D5) —
      never pass it a coding rubric, and never inline one here. It stays
      silent when the ask is already understood, rewrites `title`/
      `description` when the original was vague, and parks the item in
      `awaiting-human` with a real question when it genuinely cannot tell
      what is being asked. If it parks, STOP here and relay the question:
      the person is still in the conversation, which is exactly the point.

   b. **Then re-judge `tier`/`kind`/`risk` on the clean text.** Read the
      item's own `domain` and resolve that domain's declared classification
      vocabulary — `getDomain(item.domain).classification`
      (`src/state/workflow-stage-graphs.mjs`), the same registry lookup
      `skillForStage`/`skillMap.retrospective` already resolve through.
      Never hardcode the value set here: a domain that declares none
      imposes none, and this step then leaves the verb's values alone.

      Judge it yourself, in this session. Do NOT dispatch to a capacity
      or spawn an Agent for it — you already hold the full text and the
      person's own follow-ups in context, so re-deriving it elsewhere from
      less context is pure overhead and pure added latency (Native-First,
      0026 rule 2; the same rule `fgos-clarifying` states for itself).

      Apply only the fields that actually changed, through the verb:

      ```
      # fgos CLI fallback (tsk-1no D3)
      FGOS_BIN="${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}/bin/fgos.mjs"
      if [ -f "$FGOS_BIN" ]; then
        node "$FGOS_BIN" edit "<id>" --tier <tier> --kind <kind> --risk <risk> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
      elif command -v fgos >/dev/null 2>&1; then
        fgos edit "<id>" --tier <tier> --kind <kind> --risk <risk> --dir "${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}"
      else
        echo "fgos: no bin/fgos.mjs at ${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX} (not a forgent checkout) and no global fgos install on PATH" >&2
        exit 1
      fi
      ```

      A value outside the domain's declared vocabulary is rejected by the
      verb (`work.risk must be one of [...]`) rather than stored — that is
      the enum working, not a bug to route around. Re-read the vocabulary
      and pick from it; never retry with a guess.

   c. **Report what changed.** Show the user the before/after for any of
      `title`/`description`/`tier`/`kind`/`risk` that moved, so the
      mechanical guess and the considered judgment are both visible.
