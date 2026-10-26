# Phase 12: area specs, CHANGELOG, final gates and the landing checklist

Depends on: all earlier phases. Blocks: nothing. Effort: 6h. Risk: High at the landing moment (the fence refuses every older release; main's own config converts).

Run as (fgos-cook): slice 12a is docs (activity `implement-item`, capability `docs:write`, pattern `solo` with a link/lint verify, rigor `standard`); 12b to 12e are the **conductor's** steps and the owner's consent points, not slices (they write state, mint ids, convert real config, run heavy gates, touch the board).

## Context links

- Spec section 18 (the amendment table, merged here), 13.2 items 3-5, 13.3 (CHANGELOG list), section 15 (disposition), RR-P3, RR-P10.
- AGENTS.md: L5 definition of done (six questions), "Id Minting" (`fgos identity mint d-adr`, needs the network), "Changing a locked law" (none changed), the platform board rules (read the "Các luồng" and "File chung dễ va" sections only when landing; add one line at the top of `plans/261017-1313-fgos-platform-program-board/log.md`), memory rules: announce every main landing, merge origin/main at phase start and end for an unmerged branch, do not autostash in the shared main checkout, regenerate the census on the final merged tree.
- Precedent for the global-file command: board line of `478f351ff` (`rigorToTier`).

## 12a. Documentation (a slice)

Requirements: the amendments of spec section 18, merged into the area specs (Vietnamese text in those files; quoted current sentences verbatim, new text in the file's language):

| File and place | Change |
|---|---|
| `docs/specs/workflow.md` 2.2 (terms table at `:96`) | add loop, pattern, params, request, baseline, pin |
| `docs/specs/workflow.md` 7.2 step 3 (`:304-312`) | the door inherits the activity unit, applies a request, validates every carrier, pins the result |
| `docs/specs/workflow.md` 6 (`:216`) | RUL-WF-29: degree through params; the chain and the merge (current maximum is RUL-WF-28) |
| `docs/specs/runner.md` `:1499-1500`, `:1146`, `:1115`, the "Hợp đồng rigor và tier" section (`:87`), the role-task path `:1535` | loops and patterns, the catalog in config, one resolution pinned; solo runs a supplied verify; flags `--pattern --params --param --reason`, the pin, `selector-conflict`; `runner.loops`; `loops/role-tasks.mjs` and `loops/verify.mjs` paths |
| `docs/specs/seat-binding.md` `:91`, `:214`, `:245` (+ header `updated`) | red-team is the default `minCheckers` of `code`/`code:*`, replaced by an explicit entry (exact key, then prefix); reserved seat ids; `checkersByRigor` under `runner.loops.reviewed`; the marker is a reserved name, schema 2 after conversion, schema 1 still read |
| `docs/platform/config/spec.md` `:133` | "the pattern catalog" replaces "the patterns, the workflow presets"; `runner.loops` is the loop tuning; retired keys in a file are refused with `config-key-retired` |
| `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:233` | the `runner-patterns-config` row now says what it checks (catalog, loops, retired keys) |
| decision history | the D-ADR for the owner's 2026-10-23 and 2026-10-24 decisions, written in `docs/specs/runner.md`'s "Lịch sử quyết định" (`:1648`, entries from `:3443`); the id comes from `fgos identity mint d-adr` (conductor step 12b) |
| `CHANGELOG.md` `## [Unreleased]` (line 8) | one line each: pattern catalog and `runner.loops`; `--params` and `--param`; activity unit inheritance; `selector-conflict` and the swap reason; bounds; solo verify; reserved seat ids; red-team default and the `minCheckers` prefix lookup; `verify-command-unsupported`; retired `research-fan-out-gated`, `defaultRule`, `unknown-checker-seat`; marker schema 2 and `config-key-retired`; "an older release refuses a converted project or global file" |

Not amended (spec section 18 last paragraph): `docs/specs/distribution.md`, `docs/platform-foundations.md`, `guide-schema.mjs`, `feature.yaml`, RUL-WF-7, -14, -19. `docs/specs/reading-map.md` and `system-overview.md`: grep for `patterns/` and "preset" and update only the lines that name moved paths (`git grep -n "execution/patterns\|preset" -- docs/specs/reading-map.md docs/specs/system-overview.md`).

Files (writes): the files in the table plus `docs/decisions/index.md` if `fgos decision-index` regenerates it (generated; run the generator, do not hand-edit).

Steps: read each file before editing; merge; run the decision scripts; verify links.

Verify: `node scripts/check-decision-citation-drift.mjs`, `node scripts/check-decision-codes.mjs`, `node scripts/check-decision-supersession.mjs`, `node scripts/run-tests.mjs test/scripts/check-decision-citation-drift.test.mjs test/scripts/check-decision-codes.test.mjs`. Test names added by this plan must carry no decision codes (the ratchet).

## 12b-12e. Conductor and owner steps (not slices)

1. **Mint and sync.** `fgos identity mint d-adr` (network; if it fails clearly, keep the decision text, park the id as a question, do not invent one). Merge `origin/main` into the case branch; re-run the narrow proofs of phases 03 and 06.
2. **Convert this repository's own config.** `.fgos/config.json` (tracked) and the owner's `~/.fgos/config.json` both hold `patterns.defaultRule` and `patterns.reviewed` (checked at scouting). Run the new `fgos setup` conversion on the repository (backup is written beside the file), commit the converted file. Author the one-minute command for the global file (a `node -e` that moves `runner.patterns.reviewed` to `runner.loops.reviewed` and deletes `runner.patterns.defaultRule`, leaving the marker alone), test it on a **copy** of the owner's global file, and confirm the new release loads the copy.
3. **Older-release fence, manual evidence.** With the previously activated release (`fgos` on PATH, not `fgos:dev`), run a read-only verb (`fgos dispatch decide --for execute`) against a converted project fixture and record that it refuses the file. This is the evidence for the S18 clause "an older release refuses a schema-2 file"; no automated test can run an old release. Record the output in the landing notes.
4. **Final gates, sequentially, not at the same time** (RAM cap; `free -g` first, jobs 4): `npm test`, then `cargo test --workspace --no-fail-fast`. Ignore only the known reds: fgctl-upgrade, fgctl-init-download-sources, dev-host concurrent-consumers, holder_lock_gate_passes, killed_move_repairs. Regenerate the census on the final merged tree (`node scripts/git-one-door-scan.mjs --write-census`) and commit it. Run the scenario audit: every S1-S21 row of `plan.md` has its owning test green.
5. **Landing and announcement.** Land through the approve door (the owner consents: this landing makes every older activated release refuse the repository's config until it is upgraded). Read the board's "Các luồng" and "File chung dễ va" sections, update this lane's row, add one line at the top of `plans/261017-1313-fgos-platform-program-board/log.md` naming the commit, the effect on other lanes (an older activated release refuses the converted `.fgos/config.json` and any converted global file; the per-machine command; `fgos setup` converts a project), and that CFG's schema owners get a follow-up for any open point that flipped. Leave the case open until the owner decides, then `fgos workflow close`.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| landing locks other lanes out until they upgrade (the intended fence) | H x H | one board line with the command and the reversal; the owner consents at the approve door; the backup file beside the converted config |
| global files on three machines hold old keys | H x M | per-machine command, tested on a copy; the loader's refusal names the file and the fix |
| the census is stale on the merged tree | M x M | step 4 regenerates on the final tree |
| the id mint is offline | L x L | step 1 |

## Rollback

Revert the landing merge on main and restore the repository config from its backup; machines that ran the global command keep a file the old release still reads only if they also move the keys back (the command's inverse is printed with it). Nothing in the plan converts a machine's global file automatically.

## Acceptance

The audit of step 4; S18's older-release clause by the manual evidence of step 3; CHANGELOG, specs and decision scripts green.
