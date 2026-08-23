# Plan — tsk-2ux: surface docsRef/plan.md into the out-of-process worker prompt

Mode: small

Flag count: 1 (existing covered behavior — `buildPrompt`/`renderTemplate`
have a fixed-contract test suite; no auth/authorization/data-model/audit-
security/external-system/public-contract/cross-platform/multi-domain flag
applies). Per `fgos-routing`'s Mode gate: 0–1 flags → tiny/small; picked
`small` over `tiny` because the change touches multiple files (one function
+ one template + the covering test) and needs a real design pick (append vs.
new placeholder), not a single one-line edit.

No CONTEXT.md exists for this item — discovery's verdict was `clear`
(`docs/history/dispatch-prompt-docsref-pointer/RESEARCH.md`, Round 1), which
skips `exploring` outright, so RESEARCH.md's Round 1 findings are the only
locked source of truth this plan draws from. `docsRef` was empty and has
been registered on the item pointing at this same feature dir (Bootstrap).

## Approach

**Chosen path:** mirror `skillPath`'s existing pattern exactly — add a
`docsRefPointer` var to `buildPrompt` (`src/runner/dispatch/prepare.mjs`),
computed the same way `skillPath` already is (pure string, no filesystem
read, no root resolution — RESEARCH.md Round 1 finding 4), and declare a new
`{docsRefPointer}` placeholder in `worker-prompt-skill-pointer.txt`'s
existing `# Files to read first` section, right after `{readFirst}`.

```js
// alongside the existing skillPath computation (prepare.mjs:110-113)
const docsRefPointer =
  typeof work.docsRef === 'string' && work.docsRef.trim()
    ? `${work.docsRef.replace(/\/+$/, '')}/plan.md and .../CONTEXT.md (if present) — the locked decisions and chosen approach for this item`
    : '(none)';
```

rendered into the template as its own line under `# Files to read first`,
never inlined into `{readFirst}` itself (`readFirst` stays purely
footprint-derived, byte-identical for every item with no `docsRef`).

**Alternatives rejected:**
- *Inline the actual file content via `readLockedContext`/
  `resolveContentRoot`* — rejected per RESEARCH.md Round 1 finding 4: those
  two functions exist to let an in-process session read committed content
  from an arbitrary cwd; the out-of-process worker's own checkout already
  has the file (exploring/planning's hard rule commits before advancing),
  so a path pointer is sufficient and matches `skillPath`'s own established
  pattern — no new root-resolution cost or failure mode to design/test.
- *Append the docsRef pointer directly into `{readFirst}` (reuse the
  existing var instead of adding a new one)* — rejected: `readFirst` is
  explicitly documented as "derived here... straight from the item's
  existing `footprint`" (prepare.mjs:96-99); folding a second, differently-
  sourced concept into the same string blurs that contract and makes a
  future footprint-only read (or a template that wants one but not the
  other) impossible to write. A second named var costs one more
  `renderTemplate` key (harmless per `prompt-templates.mjs:58-61`'s own
  "unused var" contract) and keeps each concept traceable to its own field.

**Risk map:**

| Component | Risk | What would prove it |
|---|---|---|
| `buildPrompt` new var computation | light | existing `test/runner/dispatch.test.mjs` `buildPrompt` cases extended with a `docsRef`-populated fixture, asserting the new line renders |
| `worker-prompt-skill-pointer.txt` template edit | light | same test file's fixed-contract assertions (the "five framing sections" the file's own docstring pins) must still pass — a new placeholder is additive, not a removal, so the existing five-section pin cannot break |
| `worker-prompt-discovery.txt` — deliberately NOT touched | none | RESEARCH.md Round 1 finding 5: discovery-stage `docsRef` is essentially always empty (exploring/planning write it, both run strictly after discovery); no fixture, no test needed for this template |

No medium/high-risk row — nothing here needs a `fgos-coding-validating`
proof point beyond the extended unit test above.

**impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and `present`
for this repo's main checkout, but its index is 1279 commits behind current
HEAD (`gitnexus list_repos`) — stale enough that `gitnexus impact
buildPrompt` resolved the symbol at its PRE-SPLIT location
(`src/runner/dispatch.mjs`, before tsk-2uf-1 moved it to
`src/runner/dispatch/prepare.mjs`, which now only re-exports it as a
barrel) and reported `impactedCount: 0` — a false negative the CLAUDE.md
gate itself warns about ("a suspicious zero-result... from an
impact-analysis tool is worth a quick grep/rg cross-check"). Cross-checked
directly: `rg -n "buildPrompt\(" src --glob '*.mjs'` finds exactly two real
call sites, both in `src/runner/dispatch/cli.mjs` (`:211` inside
`spawnWorker`, `:791` a second direct call with no `feedback`/`stage`
args) — both already covered above. `readFirst`, the footprint-derived var,
review-caught it applies to `worker-prompt-default.txt` too, but that
template renders only for a domain outside `coding`'s two rules
(`prompt-templates.mjs:35-39`'s wildcard) — no live caller passes a
non-coding `work.domain` today, so it is out of this item's real blast
radius; not touched.

**Files touched:**
1. `src/runner/dispatch/prepare.mjs` — add `docsRefPointer` computation +
   thread it into the `renderTemplate` vars object (`buildPrompt`).
2. `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` — add the
   new `{docsRefPointer}` line under `# Files to read first`.
3. `test/runner/dispatch.test.mjs` — extend existing `buildPrompt` coverage
   with a `docsRef`-populated fixture asserting the new line renders, and a
   no-`docsRef` fixture asserting `(none)` / byte-identical-otherwise
   behavior for every pre-existing item.

Order: (1) then (2) together (the var is meaningless without the
placeholder consuming it, and vice versa — no intermediate commit point
that leaves the pair half-wired), then (3) to prove both.

## Shape

Direct note (mode `small`, no phased breakdown needed):

- Add the `docsRefPointer` var next to `skillPath` in `buildPrompt`
  (`prepare.mjs`), same computation shape, same "no fs read, no root
  resolution" contract.
- Add one new line to `worker-prompt-skill-pointer.txt`'s "# Files to read
  first" section rendering `{docsRefPointer}` under the existing
  `{readFirst}` line.
- Extend `test/runner/dispatch.test.mjs`'s `buildPrompt` describe block: one
  case with `work.docsRef` set (asserts the rendered pointer line appears,
  naming both `plan.md` and `CONTEXT.md`), one case with `work.docsRef`
  absent/empty (asserts `(none)`, and that every other pre-existing
  assertion in that file — the "five framing sections" pin — still holds
  byte-identical).

Concrete cases worth proving (matched to `small`'s depth — no concurrent-
access/partial-failure sketch needed, this is pure synchronous string
assembly):
- `work.docsRef` unset (today's entire fleet, minus items that cleared
  `exploring`/`planning`) → `(none)`, template output otherwise unchanged
  from pre-fix.
- `work.docsRef` set to a real `docs/history/<feature>/` value → pointer
  line names `<docsRef>/plan.md` and `<docsRef>/CONTEXT.md`.
- `work.docsRef` set but trailing-slash-inconsistent (`"docs/history/x"` vs
  `"docs/history/x/"`) → same normalization `store.mjs:564` already applies
  (`.replace(/\/+$/, '')`) so the rendered path never doubles a slash.
- `stage !== 'executing'` (e.g. `'discovery'`) → template selected is
  `worker-prompt-discovery.txt`, which never declares `{docsRefPointer}`;
  the var is computed but silently unused (`renderTemplate`'s own
  documented "extra unused var is harmless" contract) — assert no crash,
  no stray literal `{docsRefPointer}` leaking into that template's output.

## Outstanding questions

None
