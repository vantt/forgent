# Context — tsk-1fp: distribution/version-safety, R15-R27 port

## Feature boundary

fgOS currently has no version-safety layer for its own install/distribution
(no downgrade-block, no drift-fingerprint, no source-classification, no
parity fail-closed gate, no retired-file cleanup). This item ports bee's
onboarding-area rules R15/R16/R17/R21/R22/R27 to fgOS, adapted for fgOS's
own architecture (currently Node source, migrating to Rust soon) rather
than a 1:1 copy of bee's compiled-binary model.

Full discovery evidence: `docs/history/distribution-version-safety-r15-r27-
port/RESEARCH.md` (repo state confirmed, bee's actual rule text read
directly from the sibling `beegog` checkout since the item's cited path
does not exist in this repo).

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
registered and `present` (full posture, per `CLAUDE.md`'s three-way gate).
Informational only — this stage edits no code.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | Introduce a separate installer artifact (`.sh` + `.ps1` for Windows, same probe→confirm→mutate→re-probe→rollback discipline as bee's own installers), hosted in the git repo, installed via `curl \| sh` — decoupled from fgOS's own runtime, no Node/npm bootstrap dependency. Reason: fgOS is migrating to Rust soon; a compiled binary can't self-rewrite in place — the exact constraint that forced bee to split `install.sh` from the `bee` binary. Build this split now, while fgOS is still Node (the installer just copies source files today), so the same architecture carries forward unchanged once the Rust binary lands — no second migration later. |
| D2 | The installer's only job is version resolution and copying the payload into a project — never config/setup logic. It resolves the target version (latest stable tag by default for a fresh install), refuses downgrade against the version already in the project (R15) unless forced with both versions known and readable, copies the payload in, and writes the fingerprint ledger baseline (R16's starting point). |
| D3 | The project's own copy of `fgos setup`/`doctor`/`init` (already existing verbs) owns all version-specific config-merge/doctor-check logic — never the installer. This mirrors bee's `install.sh` + `bee onboard` split exactly: only a given version's own code knows its own config schema. `fgos doctor` on the project's copy is report-only for drift (R16) — it never self-repairs; repair means re-running the installer to refresh the copy. |
| D4 | A fresh install defaults to the latest stable tag. An already-set-up project's routine `setup` re-run respects its recorded version pin rather than auto-jumping to latest (same pattern as nvm/rustup/mise) — an explicit upgrade action (`fgos upgrade` / `setup --latest`) is what moves the pin forward. This does not conflict with R15: pinning to a version older than what's already in place is still a downgrade and is still refused unless forced. |
| D5 | R21 (release-version parity across every projection) and R22 (fail-closed top-level success gate) get built from bee's rule text directly, now — both are marked "not yet implemented" even in bee itself, so there is no reference implementation to copy. Owned by the installer's own fail-closed gate, since the installer is the one process actually performing the apply. |
| D6 | Switching the primary install entry point from `npm install -g github:vantt/forgent` to a git-hosted shell-script installer supersedes `docs/specs/distribution.md`'s locked Entry Points section (RUL1-RUL12, `coverage: full`). Per `AGENTS.md`'s "Changing a locked law" rule, this needs an explicit decision record at planning/implementation time — never a silent in-place edit to the existing spec. |

## Pinned terms

- **Installer** — the separate `.sh`/`.ps1` bootstrap artifact (D1), distinct
  from the `fgos` CLI it fetches/copies. Owns version resolution + copying
  only (D2).
- **Project's copy** — the `fgos`/`fgos-runner` source tree copied into a
  given project by the installer. Owns setup/doctor/init/config-merge for
  that project (D3).
- **Downgrade** — installing a version older than what a project's copy
  already has, or the installer being unable to read either version. Always
  refused unless forced with both versions known (R15, D4).
- **Pin** — the version a project's copy is currently locked to; `setup`
  re-runs stay on the pin, `upgrade` moves it forward (D4).

## Scout evidence cited

- `src/`/`bin/` grep: zero existing downgrade/fingerprint/version-parity
  logic for fgOS's own install (every "drift" hit is unrelated: git-branch
  drift, config staleness, event-log entropy).
- `docs/specs/distribution.md` (locked spec, `coverage: full`) — today's
  "global or project-local" choice is plain npm `-g` vs. non-`-g`, not a
  custom fgOS vendoring mechanism. `Open Gaps: none`.
- `docs/distribution-vision.md` — its own 4-milestone roadmap
  (`tsk-3nx`/`tsk-4c05`/`tsk-3uj`/`tsk-2jc`, MVP `tsk-4bc`) is fully `done`
  and never mentions R15-R27-shaped scope — this item is net-new, not a
  gap-fill.
- `docs/knowledge/areas/onboarding/release-identity-and-version-parity.md`
  in the sibling `/home/vantt/projects/beegog` checkout (not present in this
  repo) — full text of R15/R16/R17/R21/R22/R27, read directly. Its
  "Pointers" section (dated 2026-08-01) shows bee's own runtime moved to a
  compiled Rust binary (`packages/bee-rs`, `BEE_VERSION` embedded at
  compile time) — the architecture this item's D1 anticipates fgOS
  following too.
- `fgos show tsk-2ok` — confirmed tsk-2ok's actual scope is gateway
  multi-project routing/id-collision (a different layer), not runtime
  code-version-skew — consistent with this item's framing as
  complementary, not duplicate, scope.

## Canonical references

- `docs/history/distribution-version-safety-r15-r27-port/RESEARCH.md` —
  full discovery-stage research round.
- `/home/vantt/projects/beegog/docs/knowledge/areas/onboarding/
  release-identity-and-version-parity.md` — source of R15/R16/R17/R21/R22/
  R27's actual rule text (external repo, not part of this repo's own
  distillery corpus yet).
- `docs/specs/distribution.md`, `docs/distribution-vision.md` — existing
  fgOS distribution spec/vision this item extends (D6 flags the supersede
  point).

## Outstanding questions

None
