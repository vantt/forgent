# Project Rules

The bare import below loads the project rules from AGENTS.md at
context-load time. Never wrap it in backticks; that disables it.

@AGENTS.md

## Impact-analysis capability gate

The GitNexus "Always Do" / "Never Do" rules below assume GitNexus is
present on this machine. Before treating them as binding — and before
`fgos-coding-planning`/`fgos-coding-validating`/`fgos-coding-implement`
decide how much
impact-analysis evidence a plan's verify/test scope needs — query the
capability instead of assuming the tool:

```bash
fgos tool query --capability impact-analysis --status present
```

- **0 providers registered** — Inactive: skip impact-analysis evidence in
  verify/test scope; note `impact-analysis: inactive` in the plan/verify
  note. Not a gap.
- **Registered but not `present`, or `present` but flagged `stale`** —
  Degraded: run every other required check, mark that proof weak, and name
  the gap plainly (e.g. "GitNexus registered but not present on this
  machine — blast radius not confirmed", or "GitNexus present but its
  index is behind the current HEAD — blast radius may be stale"). A
  `present` status only means the tool is installed, never that its index
  is fresh or intact (tsk-j7y) — a suspicious zero-result or "not found"
  answer from an impact-analysis tool is worth a quick grep/rg cross-check
  before being trusted, regardless of what `fgos tool query` reports.
- **`present`, freshly checked** — Full: the MUST rules below apply exactly
  as written. A `full` posture still is not a guarantee of complete
  per-file coverage: a genuinely fresh, non-stale index can still carry
  zero indexed symbols for one large/complex file (tsk-38h — confirmed on
  `bin/fgos.mjs`, 5000+ lines, zero indexed `Function` symbols even
  immediately after a fresh reindex), a distinct mechanism from staleness
  that the cross-check line above already covers unconditionally.

**Multi-target resolution:** if the active impact-analysis providers tool errors because more than one target/repo is registered and needs disambiguation (e.g. "multiple ... indexed" / "not found"), never guess and never reuse any display string quoted in that error -- it is not guaranteed to be a valid value to pass back in. Instead, look at that same MCP servers own tool list for a listing/discovery tool (name suggests enumeration -- list/search/discover), call it to read back the exact registered identifiers, and match this project by a stable field it reports (an absolute path/scan-root, never a human-readable label) before retrying with that exact identifier (tsk-5nz).

This gate is prose the agent reads, never compiled logic — GitNexus is
the first registered provider for `impact-analysis`, not the only one
this gate can ever recognize. The block below regenerates from
GitNexus's own template on `gitnexus analyze`; edit this gate section
when the policy changes, never the rules inside the block.

<!-- mdview:START -->
## Documentation Viewing (MDView)

After creating or updating any markdown file, make it viewable in ONE call —
no project registration step needed:

### Using MCP (preferred)

Call `mdview_view_file` with:

- `project_root`: absolute path to the project root
- `relative_path`: the file path relative to that root

It returns a browser `url`. Tell the user: "You can view this at: `<url>`".
The server auto-registers the project on first use and indexes the file
immediately.

### Using CLI fallback

```sh
mdview open <absolute-path-to-file.md>
```

### When to render

Spin up a preview for long docs, tables, Mermaid diagrams, multi-file document
sets, or when the user asks to "preview"/"render". Skip it for short, trivial
snippets.
<!-- mdview:END -->
