Authorized under: `dispositions.md`'s Turn 2 authorization.

## Final outcome of this advisory session

**Recommendation, amended from synthesis.md's original "Thin Shell,
Measured First":**

1. Fix exactly four things, scoped and bounded: the auth-token-lost-on-stdout
   bug (`scout-report-followup-1.md`), silent launcher fallback, wrong-port
   fallback, raw-bind-host URL (`scout-report.md`). These are not four
   separate priorities — they all sit on one path (first launch → see a
   rendered file) and fixing them is, per dialogue/2-impact.md, "approximately
   the whole of the audience's use case, minus distribution."
2. Do not open Windows packaging/distribution in this same slot — a bigger
   question, correctly deferred to the person's own future decision, not
   bundled into an opportunistic bug-fix pass.
3. Drop telemetry-first sequencing. With no user in the room yet
   (Turn 2 confirmed the shell's audience is other people, not the
   person), measuring current usage would manufacture a false "not valued"
   signal from zero users — replace with a scripted first-run walkthrough
   performed as the stated low-tech persona, and a re-investment trigger
   tied to a real future user asking, not a number.
4. The daemon-as-sole-authority architecture itself stands, unchanged and
   unchallenged by either dialogue turn.

## What is still genuinely open

- **Does a Windows installation path exist for someone without a
  terminal?** Scout-answerable, not yet checked. This is the one finding
  that could change what happens *after* the four fixes, not whether to
  make them.
- **Does a real prospective user exist yet?** Needs the person, not
  blocking — the right question to ask once the four fixes land, not
  before.

## What this session does NOT do

Per this track's own Plan-Level Invariants and the coordinator prompt's own
BOUNDS section, the advisory panel has no git or implementation authority
inside `mdview`. This recommendation is advice, not a landed change. Whether
to actually implement the four fixes now is a separate decision for the
person, outside this advisory session.

## Attack 1 (reversibility dispute) — status unchanged

Neither dialogue turn touched Attack 1 (whether hardening launcher
coordination entrenches the multi-process split). It remains exactly as
recorded in synthesis.md: live, unresolved, unattributed to either turn.
