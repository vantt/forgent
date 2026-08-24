# Research — discovered-work risk vocabulary drop (tsk-2ck)

## Round 1 — 2026-08-23 (discovery stage)

**Asked:** verify the current repo state matches tsk-2ck's bug report
before marking discovery `clear` — do the prompt templates still lack
risk-enum guidance, does `captureDiscoveredWork` still pass
`block.risk` straight to `addWork` unvalidated with the validation
error silently swallowed, is `derived.risk` already in scope at that
call site (fix (b) feasibility), and does
`classificationVocabulary(domain, 'risk')` exist as the real vocabulary
source (fix (a) feasibility)?

**Checked — repo:**

- `src/runner/prompt-templates/worker-prompt-discovery.txt:61-68`
  (`fgos-discovered` schema) — `title`/`kind`/`risk`/`description`
  fields, `risk` documented only as `"<optional>"` with **no** mention
  of the domain's real vocabulary. By contrast the *verdict* schema in
  the same file, `:25-37` (`fgos-verdict`), was already fixed under
  tsk-2yo (D12/D17) to explicitly say "Pick `kind`/`risk` from the
  domain's own declared vocabulary (`classificationVocabulary(domain,
  field)`...) — never invent a value outside either list." The
  `fgos-discovered` block a few lines below never got the same
  treatment — confirms claim #1 exactly, and narrows it: this is a
  known-good fix pattern (tsk-2yo) that simply wasn't applied to the
  sibling schema in the same file.
- `src/runner/prompt-templates/worker-prompt-default.txt:36-39` and
  `src/runner/prompt-templates/worker-prompt-skill-pointer.txt:42-45`
  — same unguided `fgos-discovered` schema, same gap, two more sites.
- `src/runner/loop.mjs:690-761` (`captureDiscoveredWork`) —
  `derived = classify(block.title)` at line 721, `risk: block.risk ??
  derived.risk` at line 735 (inside `addWork(dir, {...})`, lines
  722-754), whole call wrapped in `try { ... } catch (err) {
  log(...'discovery-report create skipped for...') }` at lines
  704-759. Confirms claim #2 exactly: `block.risk` reaches `addWork`
  unvalidated, and any `validateWorkShape` throw (including an
  out-of-vocabulary risk) is caught and only logged, never surfaced or
  retried.
- `src/state/work.mjs:255` — `work.${field} must be one of
  ${JSON.stringify(allowed)} for domain ...` is the generic
  enum-violation message `validateWorkShape` throws (risk is one of
  the fields this path covers) — matches the report's quoted error
  shape.
- `src/state/workflow-stage-graphs.mjs:678`
  (`export function classificationVocabulary(domain, field)`) — exists
  and is the real vocabulary source both the already-fixed verdict
  template and the suggested fix (a) point to. Confirms fix (a) has a
  real, already-precedented target to read from.
- **Fix (b) feasibility:** `derived` is computed two lines above the
  unsafe pass-through (`loop.mjs:721` vs `:735`), already in scope at
  the exact call site — a coercion/clamp fallback there is a
  same-function, few-line change, not a new plumbing path.

**Not checked externally** — nothing in this goal depends on anything
outside this repo.

## Verdict

`clear: true`. Every citation in the bug report was verified against
current `HEAD` (line numbers matched or were within a few lines of the
report — no drift that changes the diagnosis). Both suggested fixes are
independently confirmed buildable: fix (a) has a real, already-used
vocabulary function to point templates at (and an in-repo precedent —
tsk-2yo already did this for the sibling verdict schema); fix (b)'s
fallback value (`derived.risk`) is already computed in scope at the
exact unsafe line. No open question remains for `planning` to resolve
before shaping a fix.

verify: `rg -n "risk.*optional" src/runner/prompt-templates/*.txt` (to
confirm at plan time which template sites still need the vocabulary
note added) plus `node bin/fgos.mjs add --risk medium --title x --kind
task --dir <mainCheckout>` (exit 4, reproduces the silent-drop path's
root validation failure directly, per the report's own manual repro).
