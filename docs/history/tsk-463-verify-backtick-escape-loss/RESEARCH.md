# Research: tsk-463 — verify's backtick-escape-loss transcription risk

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Mandatory rescan. Confirm the bug is still current, and —
critically — this item's own `deps: ['tsk-1yt']` and its suggested fix
directions overlap heavily with tsk-1yt (currently `status: doing`,
**another live session actively working on it right now** — confirmed via
`fgos list --id tsk-1yt --json`). Does tsk-1yt's own already-locked scope
(`docs/history/tsk-1yt-verify-write-time-shell-validation/CONTEXT.md`,
D1-D3) already cover tsk-463's bug class, making it redundant/wontfix, or
is there a genuinely separate, safe-to-build-concurrently piece?

**Checked:**
- `docs/history/tsk-1yt-verify-write-time-shell-validation/CONTEXT.md`
  (tsk-1yt's own locked decisions, already written — full read).
- `fgos list --id tsk-1yt --json` — confirmed `status: doing`, live.
- `git branch -a` — no `fgw/tsk-1yt` branch exists yet (claimed but no
  commits pushed as of this scan).
- `docs/how-to/fix-a-verify-command-broken-by-mixed-in-prose.md` — the
  existing, closest-precedent how-to doc (different failure mode).
- `.claude/skills/fgos-coding-planning/SKILL.md:276-289` (current step 5,
  in this worktree's own copy — branched from `main` at a commit that
  does NOT yet carry tsk-14a's own pending sync-step addition to this
  same step).

**Found:**

1. **tsk-1yt's own D2 explicitly excludes tsk-463's bug class.** tsk-1yt:
   "Validation checks syntax only (is this parseable shell?), **never
   semantics** (does this command do the right thing?)". tsk-463's own
   defect is exactly a semantics problem, not a syntax one: when a
   backslash-escape is lost, `` `foo` `` inside a double-quoted string is
   **still syntactically valid shell** (backtick command substitution
   parses fine) — it just means something different than intended (runs
   `foo` as a command and substitutes its output, instead of treating the
   backticks as literal characters). A `sh -n`-style syntax check (the
   mechanism tsk-1yt's own CONTEXT.md scopes itself to) would say this
   string parses cleanly and would NOT flag it. tsk-463's own suggested
   fix list ("the sh -n sanity-check tsk-1yt already proposes... which
   would catch this exact case too") is not reliably true given tsk-1yt's
   own D2 boundary — stated as one of several "and/or" options, not
   asserted with confidence, and the scout evidence above shows it is the
   weakest of the three.

   **Conclusion: NOT redundant.** tsk-463 is a genuinely separate defect
   from tsk-1yt's own scope, not a duplicate — confirmed by tsk-1yt's own
   locked D2, not by guessing at its intent.

2. **Real, current coordination risk: tsk-1yt is live, uncommitted, scope
   already locked.** Any implementation touching the same write paths
   tsk-1yt's own D1 already claims (`fgos add --verify`, `fgos edit
   --verify`, `fgos gate-approve --verify`, `discover --verdict clear`,
   decompose per-child verify — i.e. `store.mjs`, `discovery.mjs`,
   `plan.mjs`, `verify-pattern-check.mjs`) risks a real merge collision
   with a session actively working there right now. tsk-463's own
   description already offers a genuinely independent alternative: "add
   an explicit warning to docs... and/or fgos-planning's own step 4
   guidance... about preserving backtick escapes when copying a verify
   command out of a markdown fence into a --verify shell argument."

3. **Where the actual loss happens (tsk-12p, the cited live incident):
   plan.md's own verify block had correct escaping; the STORED
   `work.verify` field had lost it.** The loss happens at the
   hand-transcription step — a session (or person) copying a command out
   of a markdown fence into a `fgos edit --verify "..."` / `fgos add
   --verify "..."` shell invocation, where the outer shell (bash/zsh
   running the `fgos` CLI itself) can silently consume a `\`` before fgos
   ever sees the string, if the session isn't careful about nesting. This
   is exactly the same class of hand-transcription step `fgos-coding-
   planning`'s own Shape step (naming a verify command from `plan.md`)
   and Implement's own step 3 (running the recorded verify) already
   touch — and, newly, the exact sync mechanism tsk-14a just added to
   `fgos-coding-planning`'s own step 5 (`fgos edit --verify` called
   directly from that skill's own flow) is a NEW site carrying this
   identical risk, not yet merged to `main` as of this scan.

4. **No existing doc covers this specific failure mode.**
   `fix-a-verify-command-broken-by-mixed-in-prose.md` diagnoses a
   DIFFERENT symptom (a bare shell *syntax* error, from model-generated
   prose mixed into the command) — its own opening line scopes it to
   "the shell itself refuses to parse the command at all". tsk-463's own
   failure mode produces a *different* symptom (the shell parses fine,
   then the wrong thing runs or a "command not found" error from the
   substituted backtick content) — a new doc, or a new section, is
   warranted, not a reuse of that one.

**Verdict basis:** scope narrowed by this session's own judgment (no
product-judgment gap requiring a person — this is a straightforward
"which piece is safe to build concurrently" read, not a scope preference):
**docs-only** — a new how-to doc plus pointers from `fgos-coding-planning`
step 5 and `fgos-coding-implement` step 3, warning about the transcription
risk and how to preserve escapes correctly. Explicitly NOT touching
`store.mjs`/`discovery.mjs`/`plan.mjs`/`verify-pattern-check.mjs` — that
is tsk-1yt's own live, in-progress territory.
