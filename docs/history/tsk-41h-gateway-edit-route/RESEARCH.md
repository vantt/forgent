# RESEARCH — tsk-41h: gateway route edit for /v1 (PATCH /work/{id})

## Round 1 — 2026-08-15 (discovery stage)

**Asked:** does `/work/{id}` really have no edit route today? What CLI
flags does `fgos edit` actually accept for each of `EDITABLE_FIELDS`'
21 entries, and what are their real type/encoding quirks? What pattern do
existing gateway write routes (`move`/`ask`/`answer`) use to reach the
`spawn_fgos_verb` chokepoint (D7 of tsk-7l9)?

**Checked — repo:**

- `herdr-plugin/src/gateway.rs` — `/work/{id}` route registration (`.route(
  "/work/{id}", get(get_work_by_id))`) confirmed GET-only before this
  item. `docs/contracts/fgos-gateway-api-v1.yaml`'s `/work/{id}` path
  confirmed the same (only a `get:` operation).
- `src/state/store.mjs:275` — `EDITABLE_FIELDS`, the real 21-entry set:
  `title, description, kind, risk, verify, tier, refs, deps, acceptance,
  priority, intent, docsRef, parent, urgent, impact, effort, footprint,
  mergeAfter, supersededBy, duplicates, domainFields, goalTier`.
- `bin/fgos.mjs`'s `edit` case (~line 1727-1900) — read directly, not
  guessed: same-name plain pass-through loop (`title, description, kind,
  risk, verify, tier, urgent`); comma-separated list loop (`refs, deps,
  footprint`); JSON-encoded-string fields (`acceptance` via
  `parseAcceptanceFlag`, `domainFields` via the same helper under
  `--domain-fields`); kebab-flag/camelCase-key one-offs (`--docs-ref`,
  `--goal-tier`, `--merge-after`, `--superseded-by`, `--duplicates`,
  `--parent`); numeric fields with a valueless-flag guard (`priority`,
  `intent` as integers; `impact`, `effort` as floats). `fgos edit --help`
  itself is STALE — it lists only 17 of the 21 fields (missing
  `supersededBy`/`duplicates`/`domainFields`/`goalTier`), a real drift not
  in this item's own footprint to fix.
- `herdr-plugin/src/gateway.rs:623-638` (`post_work_move`) and its
  siblings (`post_work_ask`, `post_work_answer`) — the real pattern: parse
  a typed `Deserialize` body, `reject_leading_dash` every enum/id-shaped
  field, build a `Vec<String>` of CLI args, `run_verb_blocking(state.
  gateway, args).await?`.
- `herdr-plugin/src/gateway.rs:541-556` (`reject_leading_dash`, tsk-1ah) —
  applied to every enum/id-shaped field already in this file (`to`,
  `expect`, `status`, `stage`, `cursor`); explicitly NOT applied to
  genuinely free-text fields (`text`, `reason`) per its own doc comment.
  Judgment call for this item: apply it to every scalar edit field
  (including `title`/`description`) for consistency with the file's own
  default, rather than inventing a second exemption class.

**Checked — live, real command execution (not assumed):**

- `fgos edit <id> --title ... --risk ... --priority ... --effort ...
  --domain-fields '{}' --docs-ref ... --json` against a real scratch
  `.fgos` store (`/tmp/fgos-tsk41h-smoke`, `fgos init` + `fgos add`) — real
  success, `data.fields` in the response listed exactly the flags passed.
- **Real correction found this way, not from reading alone:** `urgent`
  reads as boolean-shaped from its name and sits in the CLI's plain
  same-name pass-through loop alongside `title`/`kind`/`risk` — but a live
  `fgos edit --urgent` invocation with the JSON-body-mirrored value `true`
  was REJECTED: `work.urgent must be one of ["low","medium","high",
  "critical"] when present, got: true`. It is a string enum, not a
  boolean. An earlier draft of this item's own handler treated it as a
  valueless boolean flag (`--urgent` bare) before this smoke test caught
  the mistake — fixed before commit (see `plan.md`/Iron Law evidence).
- `fgos edit ... --risk high-risk` — real rejection:
  `work.risk must be one of ["light","standard","heavy"] for domain
  "coding"` — confirms `risk`'s real vocabulary differs from `tier`'s
  (this cluster's own items use `light/standard/heavy/high-risk`-ish
  language loosely in prose, but the ENGINE's real coding-domain `risk`
  enum is `light/standard/heavy` — a client sending an out-of-vocabulary
  value gets the engine's own real rejection verbatim, exactly what area
  spec R2 requires and exactly what this route's own design leaves to the
  engine rather than re-validating client-side).
- `fgos edit ... --acceptance '[{"text":"...","evidence":"test.mjs:1"}]'`
  — real rejection: acceptance evidence must cite a real, existing path.
  Confirms `acceptance`'s real validation lives entirely at the engine,
  same R2 point.

**Open:** none — every ambiguity (route absence, field list, per-field CLI
encoding, `reject_leading_dash` scope) is resolved by direct reads plus
live command execution; the one genuine surprise (`urgent`'s real type)
was caught and fixed before this round closed.

**Verdict:** `clear`. Verify: item's existing verify (`cd herdr-plugin &&
cargo test --lib gateway`) is real, already targets this exact file, and
is the same verify `tsk-54y`/`tsk-48w` already used successfully for
gateway-only changes.
