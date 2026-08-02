---
name: fgos-submit-assist
description: >-
  Use when a person hands you a free-text backlog ask and wants it filed as a
  work item with a considered tier, kind, and risk instead of the mechanical
  keyword-only defaults submit falls back to. Reads the ask, reasons about it
  directly (no external call), prints a suggested tier/kind/risk with
  one-line reasoning, then calls fgos submit passing only the fields it is
  actually confident about. Examples: "file this as work: users can't log in
  with SSO after the last deploy", "submit this ask: clean up the leftover
  console.log statements in the auth module", "turn this into a backlog
  item: add CSV export to the reports page".
---

# fgos-submit-assist

Takes a free-text backlog ask, reasons about its tier/kind/risk itself, prints
that reasoning, then files it with `fgos submit`. Standalone-invoke only —
load it directly when a person hands you an ask to file; it does not run as
part of any other skill's flow and does not change how any other skill
starts a session.

Not the same door as `/fgOS:submit` (`plugins/fgOS/skills/submit/SKILL.md`)
— that one deliberately stays mechanical (submit's own keyword-count
fallback, no LLM reasoning) so `dogfood-fixture:submit`'s replay of a
scenario's canonical text stays byte-identical run to run. Use `/fgOS:submit`
directly for a quick, low-stakes filing where the mechanical default is
fine; use this skill when the ask is substantial enough to warrant a
considered `tier`/`kind`/`risk` call. Both end up calling the exact same
`fgos submit` verb underneath — this skill just pre-fills its flags.

## 1. Read the ask

Take the free-text description exactly as given. Don't paraphrase or trim it
before classifying — the full text is the signal, and `submit` itself derives
the item's title from it: mechanically, from the first sentence or line, cut
at whatever boundary comes first — never this skill's judgment and never an
LLM call. A title that reads clearly in a task list names the object being
touched, the action being taken, and the scope it's bounded to (đối tượng +
hành động + phạm vi); a first sentence that's just a curt fragment ("task 1",
"fix it") produces a title just as curt, since no cut rule can invent
content the text never gave it. Nothing here rewrites the ask to force that
shape — this step passes the text through untouched — but if the ask itself
is genuinely too thin to name what's being touched, that's worth surfacing to
whoever is filing it before submitting, not silently classifying tier/kind/
risk around a title no one will be able to read later.

## 2. Classify tier, kind, and risk — via `submit-assist-classify` when available, otherwise yourself

Before reasoning it out yourself, check two things in order — whether a
`submit-assist-classify` capacity is configured at all, and only if it is,
whether its registered backend is actually present on this machine. These
are deliberately two separate checks, not one: "never configured" and
"configured but the backend is missing" get different, distinguishable
behavior below.

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node -e "
const cfg = JSON.parse(require('node:fs').readFileSync('$root/.fgos-runner.json', 'utf8'));
console.log(cfg.capacities?.['submit-assist-classify'] ? 'configured' : 'not-configured');
"
```

- **`not-configured`** — skip straight to "Classify it yourself" below,
  with no note printed at all. This is the default/common path, and its
  behavior and output are byte-identical to before this capacity
  existed — nothing here changes for the common case.
- **`configured`** — check presence next:

  ```bash
  node "$root/bin/fgos.mjs" tool query --capability submit-assist-classify --status present --dir "$root"
  ```

  - **Empty `providers` array (registered but not present, or never
    registered despite being configured)** — print one visible line
    (`submit-assist-classify is configured but its backend isn't
    available on this machine — classifying it directly instead`), then
    fall through to "Classify it yourself" below. The note is the only
    difference from the `not-configured` case above; the classification
    itself is identical.
  - **One provider, `status: "present"`** — resolve the real command/args
    and dispatch to it instead of reasoning inline:

    1. Build the classification prompt (fixed template, so every dispatch
       asks the exact same thing):

       ```
       Classify this backlog ask's tier (light/standard/heavy), kind (bug/feature/chore/task), and risk (low/medium/high), plus one line of reasoning. Respond with exactly this format, one field per line, nothing else:
       tier: <value or "unsure">
       kind: <value or "unsure">
       risk: <value or "unsure">
       reasoning: <one line>

       Rubric:
       - tier: light = small contained change (typo, one-line log, rename, doc fix). standard = default weight, real implementation within one area. heavy = multi-system/file, public contract or data-shape change, new architecture, or genuinely vague scope.
       - kind: bug = something that used to/should work and doesn't (a real symptom, not just the word "fix"). feature = new capability from the user's point of view. chore = maintenance, no user-visible behavior change. task = the honest fallback when none of the above cleanly fits.
       - risk: independent of tier — how bad and how reversible is being wrong? auth/payments/data-integrity/hard-to-undo = higher risk regardless of size.

       Ask: "<the free-text ask, verbatim>"
       ```

    2. Resolve the real command/args, reusing `dispatch.mjs`'s own
       `resolveExecutorConfig`/`resolveExecutorCommand` (tsk-62v) — never a
       second argv-building implementation:

       ```bash
       node "$root/src/runner/dispatch.mjs" resolve submit-assist-classify --prompt "<the prompt built above>"
       ```

       This prints `{"command":...,"args":[...],"provider":...,"model":...}`
       as JSON.

    3. Print the announce line, then actually run the resolved
       `command`/`args` via Bash (the JSON's `args` array is the real,
       already-`{prompt}`-substituted argv — invoke it as-is, never
       re-templated):

       ```
       submit-assist-classify - <provider> - <model>
       ```

    4. Read the response. If it cleanly gives a `tier`/`kind`/`risk` value
       (matching the vocabularies above — `"unsure"` or an unrecognized
       value means treat that one field as omitted, same as step 3's own
       "leave it out" rule), use that suggestion in place of your own
       reasoning and continue to step 3. If the response is missing,
       unparseable, or doesn't map to a real value for *any* field
       (malformed output) — fall back to "Classify it yourself" below for
       this ask entirely, exactly as if the capacity were absent. Either
       way the output is non-authoritative: a wrong external suggestion is
       exactly as cheap to fix later via `fgos edit` as a wrong inline one.

### Classify it yourself

You are the classifier here — there is no subprocess or external model call
to make, no command to shell out to for this step. Reason about the text the
way a person filing the ticket would, using the rubric below. `submit`'s own
mechanical fallback (a keyword-count pass) only fires for whichever field you
leave unset, so your read only needs to beat "no signal at all," not compete
with it on every ask.

### Tier — how much work this actually is

Think about scope and effort, not just vocabulary:

- **light** — a small, contained change: fixing a typo, tweaking copy, a
  one-line log message, renaming something, a comment or doc correction. You
  could describe the fix in one sentence and there's no real design
  question.
- **standard** — the default weight for anything that needs real
  implementation but stays within one clear area: a bug with an
  identifiable cause, a small-to-medium feature, a focused refactor. Most
  asks land here.
- **heavy** — touches multiple systems or files broadly, changes a public
  contract or data shape, requires new architecture or a migration, or the
  ask itself is vague enough that real investigation is needed before
  anyone can say what "done" looks like. When in doubt between heavy and
  standard because the blast radius is unclear, lean heavy — overestimating
  effort is cheap to correct later, underestimating hides risk.

### Kind — what category of work this is

- **bug** — something that used to work, or should work, and doesn't.
  Look for a described symptom (an error, a crash, wrong output, a
  regression against prior behavior), not just a word like "fix" — "fix the
  onboarding copy" is a **docs**/light ask wearing a bug-flavored verb.
  Copy edits and comment fixes are wording changes, not defects.
- **feature** — new capability that didn't exist before, from the user's or
  caller's point of view. If the ask describes an outcome nobody could get
  today, it's a feature even if the implementation is small.
- **chore** — maintenance with no user-visible behavior change: dependency
  bumps, internal refactors, cleanup, removing dead code, reorganizing
  files. The test: would a user of the system notice anything different
  when this ships? If no, it's a chore.
- **task** — the honest fallback when the ask doesn't cleanly describe a
  defect, a new capability, or pure maintenance — e.g. a research spike, a
  one-off investigation, or an ask too thin to categorize further yet. Don't
  force-fit a thin ask into bug/feature/chore just to avoid this value.

### Risk — independent of tier

Risk is not a mirror of tier here — a big feature can be low-risk (fully
additive, easy to revert) and a small change can be high-risk (touches
auth, payments, data integrity, or something hard to undo). Ask
specifically: if this change is wrong, how bad and how reversible is that?
A change that's easy to roll back and affects nothing else is lower risk
than its size alone would suggest; a change near money, credentials, or
irreversible data operations is higher risk even at small scope.

### On confidence, per field

Judge tier, kind, and risk independently — being confident about one says
nothing about the others. When the text genuinely doesn't give you enough to
commit to a value for a given field, leave that flag out of the `submit`
call entirely rather than guessing; the omitted field falls through to
`submit`'s own mechanical default. Never withhold the whole submission over
one uncertain field — file it either way, with whatever subset of flags you
trust.

This skill has no opinion on which product area the item belongs to and
never suggests or fills in a value for that — that classification stays
entirely on submit's own existing default/manual path, untouched by
anything here.

## 3. Print, then submit

Before running the command, print your suggested tier/kind/risk (only the
fields you're actually including) plus one line of reasoning for the call as
a whole, so whoever is reading the transcript sees the classification before
it's acted on. There is no separate confirmation step — print the reasoning,
then submit in the same turn:

```
fgos submit "<the free-text ask, verbatim>" --tier <tier> --kind <kind> --risk <risk>
```

Include only the flags you're confident about; drop any flag you decided to
leave to the default in step 2. All three fields stay correctable after
filing via `fgos edit <id>` — a wrong guess here is a cheap, later-fixable
mistake, not a reason to hesitate before submitting.

`submit` and `edit` are both `requiresExistingStore: true` — this session
may already be inside a linked worktree from an earlier `/fgOS:pick`,
which never carries its own `.fgos/` by design (ADR0020), and the verb
refuses (exit 4) rather than silently diverge if run bare from there.
Resolve the main checkout root and pass it explicitly on both calls:

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" submit "..." --dir "$root"
```

(tsk-56t D1).
