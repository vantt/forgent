# Imported documentation accounting — blocked re-sync

**Status: blocked, partial records only. No carry, rebind, digest refresh, gate acceptance or cutover.**

Input HEAD: `0e8c6c15b444f420db25cbbdd2a4864f2763f473`.
Authority: [W10 brief](../w10-import3-brief.md), L12-137 / L13-6.
Read first: [machine receipt](receipt.json), [merge accounting](merge-accounting.json), [binding check](binding-check.json), [bounded source triage](source-triage.json), [original command outputs](checks.json), [safe replay outputs](checks-replay.json).

## Stop and requested write

`needsWrites: ["docs/reading-map.md"]`.

The retained detailed navigation holder, section 5 of `docs/reading-map.md`, still describes **8 confinement probes** and says Config has **no caller wired**. Main's imported source now says 9 probes (10 with blind), `machine-private-hidden` masking `~/.fgos/private`, and completed native config verbs/migration/repairs with Node/gateway deferred to Slice C. Both source entries are in `docs/specs/reading-map.md`'s changed native block and its dependent heading unit. Updating the existing holder is required; writing it is forbidden by this brief's exact scope. No second detailed map was created under `docs/platform/**`, and no binding was invented to claim stale navigation conserves these changes. Following the brief's stop rule, the content/ratchet mutation batch was not started.

There is a separate pre-existing scan blocker: unchanged `late-areas/scan-legacy-drift.mjs` exits 1 on missing `docs/platform/system-architecture/history/component-boundary-source-carriage.md`. The route comes from `ledger/decisions/w9-component-carriage-body-overlays.json` (introduced by `928f5cc14`); its rows explicitly require atomic application with the prepared relocation/history action. That history file has never existed in this checkout's recorded path history. This turn does not apply another owner's prepared cutover patch or edit the scanner to ignore the absent holder. The saved `legacy-drift.json` remains untouched at historical source pin `5965143b4`; its zero-missing result is **not** HEAD evidence.

## Completed accounting

- Merge `571a996f59f3ae20e28e7f9df86867c4a2ab50ae`.
- First parent `7a9db5cf5108d2542f4dcf83e41280a4e0f19ab4`; main parent `cac2f6ce797d02c89863367cc3fbd87d9737ec7a`; base `62ce98513881dc7311a5bd6a55351746e3d60585`.
- **69 imported commits, 119 changed paths, 8 documentation paths**. Parent/base/current digests, path-specific main commits and both parent deltas are recorded. Five changed docs equal main exactly; Git and Holder-lock retain branch documentation-cutover additions, and the legacy reading map retains the transition banner and knowledge fixes. This is provenance, not endorsement of retained assertions.
- `AGENTS.md`, `CLAUDE.md`, the markdown switchboard and plan switchboard JSON did not change. Their hashes are explicit witnesses.
- All four incoming platform paths are added to the existing phase contract obligation list, as a union/deduplicate obligation rather than authority promotion.
- Step 0 reuses import2's **two unchanged frozen extractors** and the declared sorted compact UTF-8 JSON + LF recipe, including self-inclusive ancestry. **608 complete units across four documents** agree between extractors. The sole effective direct binding (Holder-lock) resolves with correct hash/content/ancestry; full first-parent and current neighbouring witnesses are recorded. Config, Git and Secrets have zero effective direct bindings, recorded as obligations rather than fabricated rows. **0 changed ledger rows**.

## Uncompleted carriage

The bounded diagnostic over the three named sources and their existing successor sets finds **24 unproven current units**: confinement **18**, navigation **2**, Seat Binding **4**. All complete source units, anchors, digests and existing successor paths are in `source-triage.json`. This is not a successful global drift scan or independent semantic verdict.

Carried units: **none**. Successor anchors added: **none**. Ratchet entries changed: **none**. The three specified exceptions remain mismatched; baseline, allowances and all exception bytes remain unchanged. Re-sync and digest refresh must resume together after the scope/scan blockers are resolved.

## Commands and results

Full argv, environment, stdout, stderr and exit codes are in the linked command records. Large ownership-audit stdout is losslessly gzip-compressed in the two `ownership-audit-*.stdout.json.gz` artifacts; each command record names its artifact and exact decompressed SHA-256. Scratch placement only was redirected for the unchanged rebind/audit tools; their algorithms and frozen checker bodies were not edited.

| Check | Exit / result |
|---|---|
| `python3 -B import3/account.py` (full repo-relative path in records) | 0; accounting/Step 0/triage rendered |
| Unchanged global drift scanner at HEAD | 1; ENOENT above, no output replacement |
| `rebind/rebind.py --check`, via `runpy` with scratch output redirected | 0; **0 drift, 0 rows** |
| `phase-08/audit-report.py`, via `runpy` redirecting temporary directory only | 1 overall; **both `ownership.mjs` and `audit-ownership.mjs` exit 0, both failing-row lists empty**, no new double ownership. `checks.mjs` exits 1 in each manifest (check A accounting); B pins and H remain clean. No pair accounting performed |
| Legacy ratchet | 1; exactly the three brief-named mismatches |
| Owning ratchet single test, release host set and session env unset | 1; **27 pass / 1 fail / 0 skipped**; only the live self-check fails on those same three mismatches |
| Evidence relocation `--before`, original attempt | 2; **no evidence-relocation verdict**, native second-load failure described below |
| Safe diagnostic replay driver | 1, preserving the real failing checks; excludes the unsafe native attempt |

The initial accounting author attempt exited 1 on an overstrict assumption that every merged doc equalled main. Exact parent diffs showed the three retained branch deltas; the report now records those instead, and accounting reran successfully. Read-only Git history/diff/status investigations supplied the recorded provenance; no repository `git add`, `commit`, index, ref or history mutation command ran.

### Disclosed native staging incident

The evidence attempt preloaded the digest-verified installed addon using the existing descriptor API, intending to prevent checkout staging. That was insufficient: `ensureScriptAddon` calls the loader again, the checkout lacks an own-payload descriptor, and its fallback called `ensureGitAddon`. Cargo reported a successful incremental build (0.18 s), then the native door refused a second addon file with `git-addon-second-load`, naming a checkout `.fgos/runtime/git-addon/.../fgos.node` path. Thus the attempt can have populated ignored build/runtime artifacts **outside the permitted writable surface**, despite the intended preload. It is not counted as proof or as a clean no-runtime-write execution. No `.fgos` artifact was subsequently inspected or cleaned, and no further evidence attempt ran. The replay driver removes that unsafe attempt; the exact original argv/stderr remain in `checks.json`. A sanctioned isolated fixture is needed before retrying it.

## Handoff and boundaries

Only the incoming-obligation paragraph and this turn's `import3/**` tracked records changed. Candidate documents, ledgers, exceptions and `legacy-drift.json` are untouched. The worker's scratch `/tmp/fgos-work/w10-import3/` is deleted at handback; replay regenerates it. No fgOS CLI/lifecycle verbs, broad suites, pair accounting, secret reads, owner-answer/progress/gate-status writes, main landing or authority flip. `impact-analysis: degraded/unqueried` under the no-CLI brief; no production symbol changed. No preview service was started in this confined records turn.
