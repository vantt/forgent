# Design critique: credential rotation code organization

Scope: structure and clean code only, branch HEAD 42abe4808 vs merge-base 4a1cb41ac, `src/` diff. Correctness is reviewed elsewhere. Paths are relative to the review worktree.

## TL;DR

Ship with one small cleanup commit (~40 lines net, 5 files, no behavior change beyond a safer Codex copy). The 790-line module is one responsibility and already has the per-layout adapter shape the question asks about. The confinement -> provider-credential-renewal import is the right call; the alternatives all re-introduce caller context the marker was designed to remove. The real duplication is small and specific: four copies of `expandCredentialHome`, a hand-rolled Codex copy path in bwrap beside `copyCredentialFiles`, and a `SAFE_KEY` check that `providerAccountDir` already does.

## 1. One responsibility or several? Per-layout adapter?

**One responsibility, already in adapter shape.** The module is "an account's credential store: copy it, read its expiry, renew it in a copy, merge the newer entry back". Sections, in order: store-agnostic file ops (`provider-credential-renewal.mjs:84-192`), three layout objects each with `name/files/read/markDue/apply/stage` (`:244-296` pi, `:308-362` codex, `:397-458` omp, registry `:460`), apply/select (`:502-536`), leftovers + cooldown (`:543-601`), refresh-ahead orchestration (`:612-726`), write-back (`:733-788`). The per-layout object proposed in the question is what lines 244-458 already are; `applyRenewedCredential`, `refreshAhead`, `writeBackRenewedCredential` dispatch through `LAYOUTS[name]` with no per-layout `if`. Building a further adapter layer would be ceremony.

**Layout-switch sites outside the registry (6 sites, 4 files):**

| Site | What it switches on |
|---|---|
| `provider-credential-renewal.mjs:463-470` `credentialLayout` | kind + files -> layout name (the registry's own front door) |
| `provider-credential-renewal.mjs:683` | `kind === 'codex-home' ? layout.files : source.files` |
| `provider-credential-renewal.mjs:176` | `basename === 'agent.db'` -> SQLite snapshot |
| `provider-credential-probe.mjs:31,40,47` | kind + files -> probe command |
| `confinement/drivers/bwrap.mjs:53-72` | `home-files` vs `codex-home` provisioning, with its own copy code for Codex |
| `setup/registrations.mjs:4315` | doctor's file list per kind |

Three of these (`credentialLayout`, the probe command, the bwrap branch) are the same kind->layout mapping stated three times. Folding `probeCommand` into the layout objects would invert the import (probe <- renewal today, `:27-31`) and is not worth it. The bwrap branch is worth collapsing (see 4).

**Size:** largest units are the `ompLayout` object (66 lines), `refreshAhead` (59), `codexLayout` (59), `copyCredentialFiles` (48), `renewInScratch` (41). Comparable to neighbors (`provider-capacity.mjs` is 1152 lines, `bwrap.mjs` 600). A store/renewal split (`provider-credential-store.mjs` for `:84-536`, renewal for the rest) would make bwrap import from a module named for what it uses (store, not renewal) but moves ~450 lines and the 993-line test file's imports for a naming gain only. Do not split now.

## 2. Dependency direction confinement -> provider-capacity

**Keep it. The Lead's reasoning holds, and the premise "confinement was provider-agnostic on main" is only true at the import level.** On main, `bwrap.mjs:49-72` already read `request.providerCapacity.credentialSource` and branched on provider credential kinds; the driver has known about provider credentials since the Codex lease landed. What is new is three import edges: `cleanup.mjs:14` -> renewal (`writeBackRenewedCredential`), `bwrap.mjs:15` -> renewal (`copyCredentialFiles`, `credentialWriteBackMarker`), renewal `:26` -> `provider-capacity.mjs` (three lock functions) and `:27-31` -> probe. No cycle: capacity and probe import only `provider-adapter`, `provider-auth-failure`, `process-identity` (`provider-capacity.mjs:9-11`, `provider-credential-probe.mjs:18`).

The reaper has three in-process callers with no dispatch context: `execution/run.mjs:159`, `loop.mjs:1430`, `setup/registrations.mjs:5251` (doctor). The alternatives, judged against that:

- **Caller-passed callback.** Needs a `beforeRemove` through `reapOrphanedConfinementResources` (3 callers), `cleanupConfinementResource` (`bwrap.mjs:562,582`) and `finalizeConfinementResources` (`authority.mjs:1837`): six sites, and any one that forgets strands a token silently. The marker exists precisely so removal needs no caller context. Reject.
- **Handler registry keyed by marker field** (`registerRemovalHook('credentialWriteBack', fn)` at renewal import time). Whether write-back runs would then depend on which module happened to import renewal in that process; `loop.mjs` and `registrations.mjs` do not today. Import-order behavior is worse than an explicit import. Reject.
- **Move `removeConfinementDir` + reaper out of confinement.** They are the core of `cleanup.mjs`; relocating them to avoid one import is churn without behavior gain. Reject.

**What is missing:** the dependency is named in `docs/specs/runner.md:1089` and `docs/specs/confinement-authority.md:1370` but `docs/platform/component-boundary.md` row 68 ("Dispatch Transport & Confinement") does not mention it (0 hits for `provider-credential-renewal` / `credentialWriteBack` in that file). This is a cross-area dependency change, so per the repo's component-boundary rule the row needs one clause: "cleanup's removal path depends on `provider-credential-renewal` for marker-driven write-back; provider-capacity/renewal never import confinement."

## 3. Opt-in plumbing through 4 callers

**Consistent with the lazy-probe pattern, line for line.** Probe: `cli.mjs:1190,1369`, `execution/run.mjs:377`, `operation-choice.mjs:2218`, gated at `assignment-runner.mjs:1680`. Renew: `cli.mjs:1188,1367`, `run.mjs:375`, `operation-choice.mjs:2216`, gated at `assignment-runner.mjs:2199`. Not scattered by this repo's standard.

Two observations, neither blocking:

- There are now two parallel opt-ins, always passed together, always as a zero-option `createX()`. Eight lines express one fact ("this is a real dispatch door"). When a third provider-side opt-in appears, fold them into one `providerCredentials: { probe, renew }` option; not before.
- `assignment-runner.mjs:2192-2197` (`mayCopyCredential`) re-derives "could this launch be confined" from posture, executor config and invocations because confinement is settled later. It is the caller guessing a decision the confinement layer owns. Organizationally a smell; whether the guess is safe belongs to the correctness reviewer. If it is only there to avoid a 90 s probe call for an unconfined launch, the simpler shape is to drop the guard and always refresh when selected (an unconfined launch renews in the real home anyway, so refresh-ahead there is harmless).

## 4. Duplication

Real, cheap to remove (do now):

- **`expandCredentialHome` x4, behaviorally divergent.** `bwrap.mjs:21-26` (uses `process.env.HOME`), `provider-credential-renewal.mjs:72-78` (`os.homedir`, handles `~`), `provider-credential-probe.mjs:25` (`os.homedir`, `${HOME}` only, no `~`, no `(?=\/|$)` guard), `setup/registrations.mjs:4299`. The probe rejects a `~/...` home that renewal and bwrap accept. One export in `provider-capacity.mjs` (which already owns the `credentialSource` shape, `CREDENTIAL_SOURCE_KINDS:27`), imported by renewal, bwrap and probe. Net about -15 lines, 4 files, low risk; probe gains `~` support.
- **Codex copy path in bwrap beside `copyCredentialFiles`.** `bwrap.mjs:60-72` copies `auth.json` with a bare `copyFileSync`, without the realpath/escape/regular-file checks `copyCredentialFiles` applies, while `renewInScratch` (`renewal.mjs:683-686`) already copies the Codex layout through `copyCredentialFiles` with `layout.files`. Replace the block with `copyHomeFiles(privateHomeTarget, home, ['auth.json'])`. About -10 lines. No test pins the removed Codex-specific messages (grep of `test/` for "Codex credential auth.json": none).
- **`SAFE_KEY` x3 and a redundant check.** `renewal.mjs:54` duplicates the regex at `provider-capacity.mjs:169` and `:594`; `credentialWriteBackMarker:737` and `validWriteBack:743` test keys that `providerAccountDir` (`capacity.mjs:597`) already rejects by returning null, which both callers already handle (`:736`, `:761`). Delete `SAFE_KEY` and the two tests; about -6 lines.
- **Misnomer.** `provisionSelectedCodexCredential` (`bwrap.mjs:49`) provisions pi and omp too, and now feeds write-back. Rename to `provisionSelectedCredential` (3 refs plus the comment at `assignment-runner.mjs:1713`).

Real but leave (taste or risk > gain):

- `piLayout.stage` and `codexLayout.stage` are identical (`:292-295`, `:358-361`); `piLayout.apply` and `codexLayout.apply` share the 3-attempt `writeIfUnchanged` / `source-changing` loop (`:273-290`, `:346-356`). A `rewriteJsonStore(file, mutate)` helper would save ~15 lines. Taste.
- `tryAcquireGenerationLock` (`capacity.mjs:524-543`) copies the link/EEXIST body of `acquireGenerationLock` (`:488-520`); the latter could loop over the former plus a wait. ~12 lines, but it is lock code with its own +124-line test delta; leave it.
- `loadSqlite` is threaded through ~12 signatures for a test seam used 3 times in tests. Ceremony, but it is the only way to exercise `sqlite-unavailable` without mocking `require`. Acceptable.
- `writeFileAtomic` (`renewal.mjs:108`) vs capacity's `writeFsyncedTemp` + rename: different primitives (rename vs link), leave.
- `isObject` vs `isPlainObject` in `recovery.mjs:65` / `execution-contract.mjs:257`: pre-existing repo-wide, not this change's debt.
- `runCredentialProbe` extraction (`probe.mjs:72-95`) is a clean lift; `readCredentialExpiry` (`renewal.mjs:477`) is used only by tests (20 refs) as the values-never-leave projection; fine.

## 5. Naming, size, error handling, comments

- **Names** fit the `provider-credential-*` family; `renewInScratch`, `applyLeftovers`, `copyIsNewer`, `credentialWriteBackMarker` (builds) vs `writeBackRenewedCredential` (performs) read correctly. Only the bwrap misnomer above.
- **Error discipline** is the module's strongest structural property: fixed codes, no token values, every public entry wraps (`refreshAhead:626-665`, `writeBack:762-787`, caller catch `assignment-runner.mjs:2213`). One inconsistency: layouts signal failure sometimes via `Error.message` (`:263,275,290,455`) and sometimes via `.code` (`withDatabase:371`), and `writeBack:774` switches on `err?.message === 'sqlite-unavailable'`. Normalize thrown codes to `.code`. Small, optional.
- **Swallowed catches** (~20) are each annotated, same style as `cleanup.mjs`. Fine.
- **Comment density**: renewal 16%, bwrap 15%, probe 24%, capacity 24%, cleanup 23%. In range. The header prose (`:1-18`) and the per-rule comments (`:230-235`, `:487-491`) carry the invariants without restating `runner.md` RUL75 verbatim.

## 6. Verdict

**Ship + one small follow-up commit on this branch before merge.** The branch is open and the suite is green, so a 40-line mechanical cleanup costs one more `npm test` run and nothing else.

| Change | Size | Risk | Now? |
|---|---|---|---|
| bwrap Codex copy -> `copyHomeFiles(home, ['auth.json'])` | -10 lines, 1 file | low (Codex copy gains the home-files escape checks; error strings change, untested) | yes |
| one `expandCredentialHome` in `provider-capacity.mjs`, import in renewal/bwrap/probe | -15 lines, 4 files | low (probe gains `~` support) | yes |
| drop `SAFE_KEY` + redundant key checks in renewal | -6 lines, 1 file | none | yes |
| rename `provisionSelectedCodexCredential` -> `provisionSelectedCredential` | 4 refs | none | yes |
| component-boundary.md row 68: name the cleanup -> renewal dependency | 1 clause | none | yes |
| fold probe/renew opt-ins into one option | ~12 lines, 5 files + tests | low | on the third opt-in |
| `mayCopyCredential` guard: drop or keep | depends on correctness review | medium | defer to correctness reviewer |
| store/renewal module split, pi/codex apply helper, generation-lock loop unification, `.code` normalization | 15-450 lines | low to medium | no |

Not recommended: any restructuring of the layout registry, the marker-driven write-back, or the lock placement. Those are the right shapes.

## Assumptions

- The branch is still open for a fix-up commit before merge (high; if it is already frozen, the "now" rows become a follow-up item and the verdict is "ship as is").
- No test pins the two Codex-specific error messages in bwrap (high; grep of `test/` returned none).
- `~`-prefixed credential homes are a configuration the owner may write (medium; if `${HOME}` is the only form ever used, the probe divergence is harmless and the dedupe is DRY-only).

Status: DONE
Summary: One cohesive module in adapter shape already; keep the confinement -> renewal import and name it in the boundary doc; one ~40-line cleanup commit (duplicate home expansion x4, hand-rolled Codex copy, redundant key check, misnomer) before merge, nothing larger.
Concerns/Blockers: `mayCopyCredential` in `assignment-runner.mjs:2192-2197` re-derives a confinement decision in the caller; organizationally a smell, correctness left to the other reviewer.
