# tsk-3gv — Research log

## Round 1 — 2026-08-11

**Asked:** Does tsk-3gv ("data.work` has three shapes across `list`/`show`,
same field name") depend on any named library, concept, pattern, or
technology that needs a repo-or-external lookup before the item can move
past `discovery`?

**Checked:**

- Repo search, the field itself: `rg -n "data\.work\b|data\s*:\s*\{\s*work"
  src bin docs --glob "*.{mjs,cjs,md}"` — found the three shape sites
  directly in `bin/fgos.mjs:1766,1798,1869,1891` and their individual
  descriptions in `src/cli/command-registry.mjs:392,398,585`.
- Repo search, the external consumer named in the item's own description:
  `herdr-plugin/src/fgos.rs`. `rg -n "work|struct.*Work|Deserialize"
  herdr-plugin/src/fgos.rs` shows `work: std::collections::BTreeMap<String,
  WorkItemRaw>` — a plain map, matching only shape 1 (unpaginated `list`).
  GitNexus's `impact` trace on `run_fgos` (`herdr-plugin/src/fgos.rs`)
  confirms its only three call sites are `fetch_triage`, `fetch_doing`,
  `fetch_need_answer` — all plain unpaginated `list`, never `show` or
  paginated `list`.
- Repo search, other programmatic consumers: `rg -n "fgos show" plugins
  .claude src scripts` — only skill-prose invocations
  (`plugins/fgOS/skills/show/SKILL.md`) and the registry entry itself, no
  JSON-field-parsing consumer of `show`'s or paginated-`list`'s `work`
  shape found anywhere in this repo.
- Repo search, the item's own footprint claim: `docs/specs/cli.md` does not
  exist (`ls docs/specs/` has no such file). `docs/specs/reading-map.md:21`
  names `docs/specs/work-state.md` §"sổ verb" as the actual spec for the
  CLI verb registry.

**Found:** Everything the item depends on is internal to this repo (a JSON
field-shape contract and one named Rust consumer) — no external
library/framework/technology lookup applies. Every named thing was found
directly in the repo with `file:line` citations; nothing required an
external (WebSearch/WebFetch) branch.

**Still open:** Nothing at the `discovery` (machine-alone research) level.
The remaining work — choosing among the fix options and the actual
implementation — is `fgos-planning`'s job, already scoped by the locked
decision in `docs/history/cli-data-work-field-shape-ambiguity/CONTEXT.md`
(D1).

**Verdict:** `clear: true`, `verify: "npm test"` (the item's own existing
verify command; narrowing it further, if warranted, is `fgos-planning`'s
call, not this skill's).
