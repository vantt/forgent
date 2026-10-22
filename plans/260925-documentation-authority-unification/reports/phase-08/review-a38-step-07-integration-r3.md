# Step 7 integration re-review (A38, round 3)

- Worktree `/home/vantt/projects/forgentX-s8-review` at `9395aa11182d13eb6b9e87c9b0430130350d5e6c` (confirmed). Change reviewed: `868897e44..9395aa111`. Rulings: `step-07-integration-fix2-brief.md` and the L12-121 entry in `owner-answers.md`. Assembly pin: `244a0435466a46e56cd95b4a70bfe03f54670996`.
- Method: read-only. I worked in a scratch `git clone --shared` checked out at `9395aa111`, with patches applied in `scratchpad/s7-review/patchwork3`. No worktree write, no fgOS CLI, no `.fgos`, no test suites. I did not rerun the doer's `step-07-post-move-proof.mjs`, because it writes into the reports directory and `/tmp/fgos-work`. My own scan stands in for it.

## Verdict: **ok**

I reproduced no High or Medium finding. Three Low observations follow.

## Checks

### 1. The 10 flips and 9 parks: pass

- **10 flips.** r01010, r01106, r01108, r01135, r01136, r00820, r01033, r01037, r04466 and r14203 are all `prepared-for-cutover`. Each file has a composed spec whose removed line carries the operand:
  - S01/S02/S03/M03 UI-spec comments go to `docs/platform/ui-spec/architecture/…`.
  - The Cargo.toml, client.ts and types.ts contract comments go to the herdr-web-dashboard contract.
  - The `pane_scan.rs` runbook pointer and the `assignment-runner.mjs` routing-handoff pointer go to their move-set destinations.
- **All 30 prepared specs roundtrip.** Applied to pinned bytes with `patch --fuzz=0 -p1`: forward reaches `expectedAfterSha256`, rollback restores the exact pinned bytes, and `beforeSha256` matches. Every newly introduced `docs/…` target exists at the pin and is not itself moved. One target is wrapped across lines (`…/gate-bypass-` + `design.md`); I checked it exists.
- **r02200 and r04182** are individually parked with exactly r22947's blocker and owner: the `r26:docs/architecture-map.md` heading-carriage park, owned by the Architecture-map / component-boundary owner.
- **The 7 AGENTS.md rows** (r00764, r00732, r00761, r00762, r00731, r00733, r00737) are parked with blocker "AGENTS.md cutover packet (A34) rewrites root pointers to moved targets at cutover", owner "AGENTS.md cutover packet". L12-121 supersedes L12-60 for these seven rows only.

### 2. Role exemption removed; all remaining preserves rechecked: pass

- **Role is no longer an exemption.** `step-07-post-move-proof.mjs` uses role only as a diagnostic. Every preserve joins its stated reason, operand and source digests, and 3 negative premise probes are recorded. Results: 9,650 checked, 95 overturned, 9,555 remain.
- **My own rerun over all 9,555 preserves** (literal operands against the files present at the pin and the effective move set) flags 1,215 preserves with moving operands:
  - 1,038 are frozen ratchet data that retires with Decision F's whole-gate obligation (`frozen-data-retires-with-gate`).
  - 41 are decision-index free text, state-wins union.
  - The remaining 135 are each in a source-confirmed class: dated `doing-coordination-redesign` / `knowledge-registry-redesign` / confinement provenance; test titles that serve as baseline keys; synthetic fixture paths; frozen migration-gate identities in `verify-phase-01`, `propose-doc-decisions` and `generate-doc-inventory`; directories that survive the move (`docs/how-to`, `docs/explanation`, `docs/`); the registry/enduser projection's historical aliases; the self-referencing retiring duplicate; and the immutable dogfood fixture.
  - None of the 135 is a present-tense live pointer resting only on a "retained" claim.
- **37 overturns beyond my 19.** These are the rows the doer's L12-121 note lists as "beyond the 19 named above" (my 19 named rows plus the 32 already patched in round 2 fall outside it):
  - **12 patch.** r01041 (network.ts, wrapped contract pointer); r02232, r02233, r02235, r02246, r04186, r04187, r04189 and r04200 (`docs/io-contract.md` → `docs/platform/work-state/contracts/cli-io-contract.md` in both YAML copies; the before and after hashes are identical for the two copies, so they stay byte-identical); r08806 (terminal SKILL runbook pointer); r11745 (cockpit script pointer); r45145 (wrapped `docs/platform-foundations.md` citation). Each has an exact single existing destination and a roundtripping spec. Correct.
  - **25 parked.** Citation-drift baseline/scan (r09010–r09013, r09076, r09080); shipped-path classifier entries (r11574–r11595); knowledge-migration / resolver pointers to the non-canonical `docs/platform/proposals/knowledge-registry-redesign.md` (r11890, r11891, r11895, r13610); `test-proof-inventory` root (r12598); reading-map verifier (r12914); enduser generator header comments (r13581, r13582), whose target `docs/specs/enduser-docs-index.md` has no destination.
  - Each park has a named blocker and owner (Documentation-governance / successor-scan, Citation-drift checker, Knowledge-registry / documentation holder, Documentation consumer-composition).
  - Parking is correct: these are classifier or gate data needing coverage proof, proposal carriers that must not be silently promoted, or have no exact live replacement.
  - The 32 round-2 overturns are unchanged and still prepared.

### 3. Replay: pass

`step-07-assemble.py --final --pin 244a0435…` alone, run twice: rc 0 both times, identical stdout, clean `git status`, so all outputs are byte-identical to the committed files. Summary: 0 applied-safe / 444 prepared / 9,555 preserved / 214 parked / 36,191 rejected (sum 46,404); 226 patches; 658 blocked rows (= 444 + 214); 0 alias violations; 4,205,648 output bytes.

### 4. L12-120 correction: pass

"Dated correction to L12-120 — 2026-10-22" is appended under L12-120, which itself is not rewritten. It records 16 `gateway-fixture-co-cut` + 16 `conditional-r28` + 7 reviewed, the same 39 ids, and says L12-121 supersedes the role-whitelist claim.

## Low observations (no rework)

- **L1. Inconsistent citation handling.** `.github/workflows/ci.yml:63` (r00713, "Full suite (docs/distribution-vision.md tsk-49r D1)") is preserved as historical text, while the similar distribution-vision citation r18863 (`registrations.mjs`) is patched. It is defensible, since it is a dated tsk/D1 citation, but the record reason still opens with "Retained distribution-vision path". Consider rewording the reason. No disposition change needed.
- **L2. Present-tense sentence in a document-history section.** `docs/knowledge/…/check-rollup-progress.md:210–214` (r04171–r04173) preserves "This doc's path (`docs/how-to/check-rollup-progress.md`) is itself linked…". It sits in a "Document history" section quoting the capture JSON, which is acceptable, but the sentence is present tense and goes stale once the duplicate retires. Optional carriage wording.
- **L3. Redundant patch.** The YAML spec for `docs/contracts/fgos-gateway-api-v1.yaml` patches a copy that L12-96 deletes at cutover. It is harmless and keeps the two copies byte-identical until deletion.

Status: DONE
Summary: OK. The 10 flips patch with roundtripping specs (30/30 specs roundtrip), the 9 named rows park with the ruled blockers, the role exemption is gone and my rerun over all 9,555 preserves finds only source-confirmed premises, the 37 further overturns are handled correctly (12 exact patches, 25 named parks), single-command replay is byte-identical, and the L12-120 correction exists. Only Low notes remain.
