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

## 1. Read the ask

Take the free-text description exactly as given. Don't paraphrase or trim it
before classifying — the full text is the signal, and `submit` itself derives
the item's title from it.

## 2. Classify tier, kind, and risk yourself

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
