# Research — tsk-1fp: distribution/version-safety R15-R27 port

## Round 1 — 2026-08-17 (fgos-coding-discovering, discovery stage)

**Asked (3 independent branches):**

1. Does fgOS already have any downgrade-block/drift-fingerprint/source-
   classification/parity-fail-closed/retired-file-cleanup protection for its
   own install, and does a project-local install flag already exist as the
   item claims?
2. What do bee's actual R15/R16/R17/R21/R22/R27 rules say (the item cites
   `docs/knowledge/areas/onboarding/release-identity-and-version-parity.md`)?
3. What did tsk-2ok's D2 conclude about gateway-layer version-skew, and does
   it constrain this item's scope?

**Checked:**

- `rg -n "downgrade|version-parity|fingerprint|drift" src bin --glob "*.mjs"`
  (forgentX repo) — every "drift" hit is unrelated to fgOS's own
  install/runtime version (git-branch drift, `src/state/drift-status.mjs`
  root-branch sync, config staleness, event-log entropy). No `downgrade`,
  `version-parity`, or `fingerprint` hit anywhere in `src/`/`bin/`.
- `docs/specs/distribution.md` (full read) — the "global or project-local"
  install choice (Behaviors & Operations > Install) is plain npm `-g` vs
  non-`-g`, not a custom fgOS vendoring/fingerprint mechanism. `Open Gaps`
  section reads "(none — coverage is full for the mechanisms this feature
  adds)" — no logged gap for version-safety.
- `docs/distribution-vision.md` (full read) — the doc's own 7 trụ cột and
  its formal milestone roadmap (§6: `tsk-3nx`/`tsk-4c05`/`tsk-3uj`/`tsk-2jc`,
  MVP `tsk-4bc`) are **all `done`** per §7 backlog list. None of the 7 trụ
  cột, the backlog, or the open questions (§5) mention downgrade-block,
  fingerprint-drift, source-classification, or retired-file-cleanup. This
  is orthogonal, net-new scope, not an existing tracked gap.
- Item's cited path `docs/knowledge/areas/onboarding/release-identity-and-
  version-parity.md` **does not exist in forgentX**. Confirmed via `find`.
  It exists in the sibling checkout
  `/home/vantt/projects/beegog/docs/knowledge/areas/onboarding/
  release-identity-and-version-parity.md` — read directly (full file):
  - R15: refuse-downgrade on the vendored runtime, compares installer
    version vs. project's installed version; unreadable/older → refuse,
    zero mutation. Force-override needs both versions known.
  - R16: per-file content fingerprint recorded at install; status
    recomputes and reports drift (mismatch/missing/unrecorded/version
    differs) — catches silent edits even when version string is
    unchanged. Report-only, never self-repairs. Degrades gracefully on a
    missing/legacy fingerprint record.
  - R17: single shared classifier names exactly one of 5 source origins
    (canonical dev checkout / project's vendored copy / installed package
    / legacy shared location / unrecognized) — pure, read-only, never
    silently treats "unrecognized" as authoritative.
  - R21/R22: **"not yet implemented" even in bee itself** as of this doc's
    2026-07-26 timestamp (marked explicitly in the rule text) —
    release-version single-source across every projection + fail-closed
    top-level success gate (no managed drift + immediate recheck clean).
  - R27: vendored library files whose ledger entry drops out on the next
    apply are deleted, derived fresh from a ledger diff every run (never a
    hand-maintained list).
  - Pointers section (dated 2026-08-01, "R6 Node cutover") shows bee's own
    runtime moved from Node to a **compiled Rust binary**
    (`packages/bee-rs`), with `BEE_VERSION` embedded at compile time from
    the plugin manifest. This is a materially different substrate from
    fgOS, which ships raw `.mjs` source files (`bin/fgos.mjs`, `src/`) with
    no compile/build step — R16's per-file fingerprinting and R17's
    5-way classifier were designed against bee's binary+vendored-copy
    model, not a source-tree-only distribution.
- `fgos show tsk-2ok` (full record read) — tsk-2ok's actual scope is
  **gateway multi-project routing**: no per-project registry keyed by path
  (id collision risk across projects sharing one machine — confirmed real,
  `tsk-1hb`/`tsk-5eq` hash collision between forgentX and mdview), no
  machine-level worker-slot ceiling, single scalar `root` in
  `AppState`/`FgosCliGateway`. This is a different layer (gateway routing
  identity) from install/onboarding version-safety — consistent with the
  item's own framing that it complements, not duplicates, tsk-2ok.

**Still open (no evidence resolves these — genuine architecture/product
decisions, not discoverable facts):**

- Should fgOS's default install actually flip from global npm to
  project-local? That is a breaking UX change for existing global-install
  users, not something implied by any existing decision record.
- fgOS ships raw source, not a compiled binary — R16 (fingerprint) and R17
  (5-way classifier) need real adaptation, not a mechanical 1:1 port, since
  bee's own model now assumes a single versioned binary artifact.
- R21/R22 are themselves unimplemented in bee — porting them here means
  designing from the rule TEXT only, no working reference implementation to
  copy.
- `docs/distribution-vision.md`'s milestone roadmap is closed
  ("done" × 4, MVP done) with no open gap logged for this concern —
  introducing R15-R27-equivalent scope means either superseding that closed
  vision doc's scope or filing genuinely new, undecided architecture — a
  product-owner call, not a discovery-stage inference.

## Verdict

`unclear` — real product/architecture decisions remain open (see above);
these are not gaps a machine-only pass can resolve from evidence.
