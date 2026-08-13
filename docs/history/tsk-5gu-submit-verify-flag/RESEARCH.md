# Research: tsk-5gu — `fgos submit` has no `--verify` override

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Item requires a mandatory rescan (created a while ago). Confirm
current-code accuracy of: `submit`'s CLI param table lacks `--verify`;
`submitWork` hardcodes `verify: SUBMIT_VERIFY_SENTINEL`; this is
asymmetric with every other field-parity flag `submit` has since gained
(tier/kind/risk, refs/docsRef/parent/footprint/goalTier/targets/urgent).

**Checked:**
- `bin/fgos.mjs:1284-1329` (current `case 'submit':` CLI param parsing).
- `bin/fgos.mjs:903-994` (current `submitWork`, in full).
- `bin/fgos.mjs:1140-1180` (current `case 'add':`, for the `--verify`
  parsing shape to mirror).

**Found:**

1. **Still fully accurate, confirmed at current line numbers.**
   `submit`'s CLI case (`bin/fgos.mjs:1284-1329`) parses `async`,
   `backlog`, `domain`, `discoveredFrom`, `deps`, `acceptance`, `tier`,
   `kind`, `risk`, `docsRef`, `refs`, `parent`, `footprint`, `goalTier`,
   `targets`, `urgent` — no `verify`. `submitWork` (`bin/fgos.mjs:943`)
   hardcodes `verify: SUBMIT_VERIFY_SENTINEL` unconditionally — the only
   field in the whole `work` object literal with no `opts.X ?? default`
   fallback shape, despite every field textually adjacent to it
   (`tier`/`kind`/`risk` at 910-912, `refs` at 942, `docsRef` at 958,
   `parent`/`footprint`/`goalTier`/`targets`/`urgent` at 962-966) following
   exactly that shape.

2. **The precedent this item's own "fix direction" cites is not
   hypothetical — it has been applied repeatedly since this item was
   written**, and every time it explicitly frames itself as "same
   field-parity shape" as the one before it (see the inline comments at
   `bin/fgos.mjs:906` "str51-llm-assist-classify D2/D5", `:938`/`:959`
   "tsk-5fs D1: same field-parity flags `add` already exposes"). `verify`
   is the one field `add` has always required (`bin/fgos.mjs:1163`,
   `verify: flags.verify` — required via `work.mjs`'s `validateWorkShape`
   per the item's own citation, `work.mjs:145`) that `submit` still has no
   way to pass through at all, optional or otherwise.

3. **The exact CLI shape to mirror already exists in the same file**:
   `add`'s own `--verify` (`bin/fgos.mjs:1163`, `verify: flags.verify` —
   required, unwrapped) is the wrong shape to copy verbatim (submit's own
   fields are all *optional* overrides of a mechanical default, per D5 —
   "a free-text submission has no verification plan yet"); the right
   shape to mirror is submit's own `optionalField(flags.tier, ...)`
   pattern (`bin/fgos.mjs:1308-1310`) — optional, falls through to the
   existing default (`SUBMIT_VERIFY_SENTINEL`) when omitted, so a
   flagless call stays byte-identical to today's behavior (same
   "flagless call stays byte-identical" contract every prior field-parity
   addition here explicitly preserves, per each one's own comment).

4. **Item's own current `verify` field is already real** (`npm test`) —
   not the discovery-stage placeholder; no sync gap for this item itself
   (this item is not a pass-through of the tsk-14a/tsk-4m4 kind, and its
   own verify was evidently set deliberately when the item was created).

**Verdict basis:** no product-judgment gap remains. The claimed defect is
confirmed present and unchanged in substance (only line numbers shifted).
The proposed fix — an optional `--verify` flag on `submit`, threaded the
same way `--tier`/`--kind`/`--risk`/etc. already are, defaulting to the
unchanged sentinel when omitted — is not a judgment call; it is the same
mechanical pattern this exact file has applied at least 6 times since this
item was filed, extended to the one field that was always missing from it.
