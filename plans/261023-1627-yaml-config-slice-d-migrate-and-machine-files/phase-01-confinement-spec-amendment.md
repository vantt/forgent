# Phase 01: G6 first, the Confinement Authority spec amendment

Depends on 00. Suggested executor: sonnet (the spec is Vietnamese; the text must read as the spec's own). Docs only. No code until this phase has landed on main.

## Context

The Confinement Authority owns which host paths a confined worker can read (`docs/specs/confinement-authority.md`). Config spec section 9 and gate G6 say `~/.fgos/private` must be hidden from every confined worker whatever its `hostRead`, and that this "depends on a confinement change owned by the confinement spec". This phase writes that change into the owning spec first, with a dated decision line, so phase 02 implements a recorded contract and Config only declares a path.

## Files it may touch

`docs/specs/confinement-authority.md`, `docs/platform/secrets/spec.md` (open question 4 answer and decision-history row only), `docs/platform/config/spec.md` (one line in the G6 row: design recorded, implementation in this slice's phase 02), board `log.md`.

## Before editing (the lane rule)

Post at the top of `plans/261017-1313-fgos-platform-program-board/log.md`: lane CFG, Slice D phase 01/02, about to edit `docs/specs/confinement-authority.md` and `src/runner/dispatch/confinement/{resources.mjs,drivers/bwrap.mjs,probes/harness.mjs,authority.mjs,policies.mjs}`. Check the board's "File chung dễ va" table and `git log -5 -- src/runner/dispatch/confinement docs/specs/confinement-authority.md`: if HARDEN, OPC, SEAT or another lane holds any of them, send them the plan section for this phase first and land second (rebase, re-read meaning). Record "no lane held it" or the lane's name in the line.

## Amendment content (Vietnamese in the spec; this is the English outline)

1. **New section 9.3 "Machine-private roots".** Definition: a list of host paths that hold per-machine private files; the list is data of the contract (`MACHINE_PRIVATE_ROOTS`, next to `BLIND_HIDDEN_ROOTS`), not code of a driver. First entry: `{home}/.fgos/private` (`{home}` is the host user's home, not a dispatch's private home). It is hidden from **every** confined dispatch that has a mount view, whatever `hostRead` says (`allow`, `blind`; `deny` stays unsupported). Mechanism: the existing `hidden-root` resource, `--tmpfs` over the directory, `--remount-ro` last. No file mask is defined (a path in the list is a directory); a single secret file is out of scope here (Idea I5 in the plan). A root that does not exist on the host when the dispatch is launched is skipped; the setup step that creates it runs before any dispatch (named limit). A workspace, cwd, repo root or any granted mount lying inside a machine-private root is refused before launch with `machine-private-hides-workspace`. The attestation lists the roots in `hiddenRoots` (the field exists, section 9.2). The runner, which runs outside the sandbox, reads the files and hands a worker only what it was leased; nothing a worker legitimately needs lives in these roots.
2. **Probe.** The probe set gains `machine-private-hidden` (standard set, not blind-only): under each built-in policy, with and without the blind override, a worker cannot read a planted file under a stand-in `{home}/.fgos/private` and the falsifier (mask removed) can. The probe fingerprint carries the list's digest; `BWRAP_DRIVER_VERSION` is bumped because every confined argv changes. Update the places that say "8 probes" and "ninth probe" (`:1239`, `:1351`, the status header).
3. **Section 9.2 amendments.** The sentence that a non-blind dispatch's argv is byte-for-byte unchanged becomes "unchanged when the host has no machine-private root"; the closing "limits still open" paragraph (`.fgos/secrets.local.env` is "secret, not blind") gets a pointer to 9.3 and states that a single file in a project directory is still not covered.
4. **Section 12 decision row, dated 2026-10-23** (decision, owner direction D before C, reason: Config spec G6 and Secrets question 4; one list, no second mechanism, Secrets adds its own paths later by adding an entry and a probe case). The spec has no "Lịch sử quyết định" heading; its section 12 table and the status header carry decisions, so use them and run `fgos decision-index` afterwards only if it indexes this file (check its help).
5. **Secrets spec, open question 4:** one line under the question: option 3 ("extend `hostRead: blind` to secret paths") is realized for directories by the machine-private list of the confinement spec 9.3; options 1 and 2 are unchanged; paths of Secrets enter the list when Secrets lands its own directory. Add a row in its section 16 decision history (date, "answered in part", by the plan's owner direction).
6. **Config spec G6 row (section 16):** "design recorded in confinement-authority.md 9.3 (2026-10-23); implemented by Slice D phase 02" (the closing status flips in phase 17 after the probe passes live).

## Steps

1. Read `docs/specs/confinement-authority.md` sections 9, 9.2, 12, 13 completely, and `docs/platform/secrets/spec.md` section 15 question 4 and section 16.
2. Draft the Vietnamese text; keep the spec's terminology (`hostRead`, `hidden-root`, `attestation`, `probe`).
3. Re-read each claim against the code (`resources.mjs:26-40`, `drivers/bwrap.mjs:574-589`, `authority.mjs:97-98`) before saving; every symbol named in the text must exist.
4. Verify links; run `fgos decision-index` check only if applicable; post the landing line.

## Owning proof

None (documents). The behaviour proof is phase 02's. Verified by `rg` at edit time and again in phase 17.

## Validation

Spec text names only symbols that exist (`rg -n "MACHINE_PRIVATE_ROOTS" docs` finds the spec; the code does not have it yet, which is the point: the contract precedes code); links resolve; the board line exists.

## Risk / rollback

| Risk | L x I | Mitigation |
|---|---|---|
| The spec text promises more than phase 02 builds (a file mask, deny) | L x M | the text states directories only and lists the limits; phase 02's review checks text against code |
| Another lane edits the same spec | L x L | board post first; land second rebases |

Rollback: revert the docs commit; nothing reads the text until phase 02.
