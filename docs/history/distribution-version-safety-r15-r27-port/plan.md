# Plan — tsk-1fp: distribution/version-safety, R15-R27 port

Mode: high-risk

**Flag count (per `fgos-routing`'s Mode-gate, applied directly — no lane
was handed off before this skill loaded, and no prior `plan.md` round
exists yet):**

- **data model** — new persistent shapes: per-project fingerprint ledger
  (R16), version pin record (D4).
- **audit/security** — downgrade-refusal and drift-detection are
  security-adjacent (supply-chain integrity of what gets installed).
- **external systems** — installer fetches from GitHub/a release source.
- **public contracts** — changes the primary install command end users run.
- **cross-platform** — `.sh` + `.ps1` both required from the start (D1).
- **existing covered behavior** — supersedes `docs/specs/distribution.md`'s
  locked Entry Points (RUL1-RUL12, `coverage: full`, D6).

6 flags, well past the 4+ threshold, and multiple hard-gate flags
(audit/security, external systems, public contracts) independently already
force `high-risk`.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
`present` (full posture, re-confirmed from the exploring-stage check in
`CONTEXT.md`). Every medium/high risk item below carries a real proof
point rather than a guess, per the `full` posture.

## Approach

**Chosen path:** build the installer/copy split now (D1-D3), against
fgOS's current Node source, so the same shape carries forward unchanged
once the Rust migration lands. Sequence the pieces so each one is
independently verifiable and nothing downstream is invented ahead of the
piece it depends on.

**Alternatives rejected:**

- *Extend `fgos setup` in place, no separate installer* — rejected because
  fgOS is migrating to Rust soon; a compiled binary can't rewrite itself,
  so the split is needed regardless, and building it later means doing
  this work twice (D1).
- *Wait for the Rust migration before building any of this* — rejected;
  the installer/copy split is payload-agnostic (it copies whatever source
  format the current version ships), so there's no reason to block six
  independent pieces of real, needed safety on an unscheduled migration.
- *Port R21/R22 later, once bee ships a reference implementation* —
  rejected per D5: the installer is the natural owner of the fail-closed
  gate regardless of when bee catches up, and there's no dependency on
  bee's own timeline.

**Ordering signal:** `fgos graph --json` was run — the global work-graph
has no nodes for these not-yet-created pieces (they don't exist as items
yet), so it carries no ordering signal for this split specifically. Order
below follows real build-order dependency instead (each piece's own
footprint depends on the previous piece's output existing).

## Risk map

| Component | Risk | Proof point (carried to `fgos-coding-validating`) |
|---|---|---|
| Installer script core (fetch + copy) | medium | `test/scripts/install.test.mjs` — real end-to-end: packs current source, runs `install.sh` against a scratch project dir, asserts the copy lands correctly. Mirrors `test/install-packaging.test.mjs`'s existing real-install-scratch-dir pattern. |
| Windows `.ps1` counterpart | medium | Same test file, Windows-shaped case (or a documented follow-up if CI has no Windows runner yet — named as an Outstanding item if so, never silently skipped). |
| Downgrade-refusal + fingerprint ledger (R15/R16) | high | `test/setup/version-guard.test.mjs`, `test/setup/fingerprint-ledger.test.mjs` — real cases: older-version refusal (zero mutation), unreadable-version refusal, force-override with both versions known, fresh-install pass-through, drift detected on a silently-edited file. |
| `fgos doctor` drift-report check (R16, report-only) | medium | `test/setup/checks.test.mjs` (extending the existing 75.6K suite) — asserts drift is reported, never repaired, and degrades cleanly on a missing/legacy ledger. |
| Version pin + `fgos upgrade` (D4) | medium | `test/setup/pin-upgrade.test.mjs` — pin respected across a routine `setup` re-run; `upgrade`/`setup --latest` moves it forward; pinning older than current still refused. |
| R21/R22 fail-closed parity gate (D5) | high | `test/scripts/install-parity.test.mjs` — real postcondition proof: install reports success only after every projection agrees + an immediate recheck comes back clean; a partial/silent success is asserted to never happen (the exact failure class bee's own "Edge Cases Settled" section names). |
| `docs/specs/distribution.md` supersession (D6) | light | A new decision record (`docs/decisions/0035-*.md`, next free number after `0034`) explicitly superseding RUL1-RUL12's Entry Points section; `test/scripts/check-decision-supersession.test.mjs` (existing check) proves the supersession is correctly recorded. |

## Files likely touched

- `scripts/install.sh`, `scripts/install.ps1` (new)
- `src/setup/version-guard.mjs`, `src/setup/fingerprint-ledger.mjs` (new)
- `src/setup/checks.mjs`, `src/setup/registrations.mjs` (extend — new
  registered doctor check, per `AGENTS.md`'s install/setup/doctor gate)
- `src/setup/parity-check.mjs` (new)
- `bin/fgos.mjs`, `src/cli/command-registry.mjs` (new `upgrade` verb /
  `setup --latest` flag)
- `docs/specs/distribution.md` (superseded sections marked)
- `docs/decisions/0035-*.md` (new supersession record)
- Matching `test/scripts/*.test.mjs` / `test/setup/*.test.mjs` files named
  in the risk map above.

## Split

Six independently workable pieces, ordered by real build dependency (each
depends on the previous piece's own output existing). Specs only — nothing
is created here; `fgos-coding-validating` materializes them at the single gate.

```json
[
  {
    "title": "Installer script core: resolve latest stable tag, copy fgOS source into a project (sh + ps1)",
    "verify": "npm test -- test/scripts/install.test.mjs",
    "action": "D1: separate installer artifact (sh+ps1, git-hosted, curl|sh), decoupled from fgOS's own runtime, no Node/npm bootstrap dependency",
    "footprint": ["scripts/install.sh", "scripts/install.ps1", "test/scripts/install.test.mjs"],
    "kind": "feature",
    "risk": "medium"
  },
  {
    "title": "Installer downgrade-refusal + per-project fingerprint ledger (R15/R16)",
    "verify": "npm test -- test/setup/version-guard.test.mjs test/setup/fingerprint-ledger.test.mjs",
    "action": "D2: installer refuses downgrade against the version already in the project unless forced with both versions known and readable, and writes the fingerprint ledger baseline",
    "footprint": ["src/setup/version-guard.mjs", "src/setup/fingerprint-ledger.mjs", "test/setup/version-guard.test.mjs", "test/setup/fingerprint-ledger.test.mjs"],
    "kind": "feature",
    "risk": "high"
  },
  {
    "title": "fgos doctor drift-report check, report-only (R16)",
    "verify": "npm test -- test/setup/checks.test.mjs",
    "action": "D3: fgos doctor on the project's copy is report-only for drift, never self-repairs; repair means re-running the installer",
    "footprint": ["src/setup/checks.mjs", "src/setup/registrations.mjs", "test/setup/checks.test.mjs"],
    "kind": "feature",
    "risk": "medium"
  },
  {
    "title": "Version pin + fgos upgrade / setup --latest",
    "verify": "npm test -- test/setup/pin-upgrade.test.mjs",
    "action": "D4: routine setup respects the recorded pin; an explicit upgrade action moves it forward; pinning older than current is still a refused downgrade",
    "footprint": ["bin/fgos.mjs", "src/cli/command-registry.mjs", "src/setup/version-guard.mjs", "test/setup/pin-upgrade.test.mjs"],
    "kind": "feature",
    "risk": "medium"
  },
  {
    "title": "R21/R22 fail-closed parity gate owned by the installer",
    "verify": "npm test -- test/scripts/install-parity.test.mjs",
    "action": "D5: R21/R22 built from bee's rule text now, owned by the installer's own fail-closed gate, since it is the one process performing the apply",
    "footprint": ["scripts/install.sh", "scripts/install.ps1", "src/setup/parity-check.mjs", "test/scripts/install-parity.test.mjs"],
    "kind": "feature",
    "risk": "high"
  },
  {
    "title": "Supersede docs/specs/distribution.md's Entry Points (RUL1-RUL12) with a new decision record",
    "verify": "npm test -- test/scripts/check-decision-supersession.test.mjs",
    "action": "D6: switching the primary install entry point supersedes the locked distribution.md spec, per AGENTS.md's Changing a locked law rule, never a silent edit",
    "footprint": ["docs/decisions/0035-installer-supersedes-npm-global-entry-point.md", "docs/specs/distribution.md"],
    "kind": "task",
    "risk": "light"
  }
]
```

## Outstanding questions

None
