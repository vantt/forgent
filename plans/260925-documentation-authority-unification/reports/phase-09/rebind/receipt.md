# Ownership rebind receipt — applied; final verification still deferred

## 2026-10-24 — header blocks

Input HEAD: `f647fc6173d8507594a27c35505221b0b1e0ad81`.
Authority: the four-document header brief; no authority promotion or gate acceptance.

Added fenced `txt` headers immediately under the H1 in:

- `docs/platform/herdr-web-dashboard/contracts/gateway-readiness.md`
- `docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md`
- `docs/platform/runner/contracts/conserved-dispatch-doctrine.md`
- `docs/platform/work-state/contracts/non-transitioning-records.md`

Each has Document type, Audience, Purpose, Design status, Last reviewed
`2026-10-24` and Related paths, with clickable Related links immediately after
the block. Owner, exact Status wording, Source where present, and every body
claim remain intact. An exact text-preservation assertion restores each
input-HEAD file by removing only the added fields/fence and Related links line.
The superseded YAML pointer is not presented as current maintenance guidance;
STR70a remains proposed; all candidate/authority boundaries are unchanged.

Read the embedded `checks.mjs` and its native checker: H delegates to
`checkCandidateMetadata`; `headerBlock` requires a fenced `txt` block directly
under the H1, and `headerFields` reads named fields inside it. Reused those
owning header/link helpers on the four explicit paths for a bounded static
check, **not a run or acceptance of H**. All required fields, Related paths and
relative file-link targets pass.

| Check | Exit | Observed result |
|---|---:|---|
| `rebind/rebind.py --check`, after headers and again after static assertions | 0 / 0 | Zero drifting rows both times |
| `misc-fix/rebind.py --check` | 0 | 283 historical effective bindings; 27 unchanged overlays (21 content) |
| `misc-fix/verify.py` | **1** | `AssertionError: proof.json`, line 64, unchanged three-way byte comparison |
| Four-file owning header/link helpers and exact text preservation | 0 | All four pass; not H |
| `git diff --check` | 0 | Clean whitespace |

No author-mode rebind was needed: **zero rows applied, zero review changes**.
The original 217-row applied record and rereview list below remain untouched.
The dated `headerBlocks` section in [rebindings.json](rebindings.json) records
this run separately, including exact wrapper commands and the failed proof.

All Python runs used scratch-only wrappers under `/tmp/fgos-work/w6-header/`
to obey this brief's scratch boundary. They retain original `__file__`/ROOT,
HEAD/source pins, historical inputs, extractors and every assertion/comparison;
only scratch paths/import/subprocess resolution and the verifier's otherwise
out-of-scope report destination are relocated. No report was emitted by the
failed verifier. The literal, unadapted invocations are not claimed as run.

**Unmet requirement:** the misc verifier's requested exit 0 remains blocked by
the same `proof.json` failure documented in the prior receipt. Its G6 proof
uses tracked source blobs at input HEAD, not these uncommitted headers; the
delivered G6 artifact records source commit
`4178dcc6e3445d5d9b8ffd55963cdd02a418af73`. No source pin, assertion or delivered
G6 artifact was changed to force green. Final-pin recomposition remains Lead
custody outside this writable list. This run does not claim A/B/H,
`audit-report.py`, pair accounting, independent review or final readiness.

No Git write, fgOS CLI/lifecycle verb, product code/test edit, npm/Cargo suite,
`.fgos/`/secret access or preview service. Impact-analysis capability query was
not run under the brief's no-CLI rule; no product symbol changed. Markdown
preview remains Lead custody. No additional write scope is requested.

## Prior ownership rebind — historical receipt

Input HEAD: `8cab0204d0c5399390a12121b6e663ec35248a8e`.
Authority: L12-137 / the ownership rebind apply brief. No gate acceptance.

## Applied result

Re-extracted the current tree with both unchanged embedded extractors. It still
has **217** drifting direct rows, not a new larger set. Refreshed their witnesses
at this HEAD and applied all **217 rows in 18 decision files**:

| Kind | Applied | Previously pending | Previously reviewed | Actual status after |
|---|---:|---:|---:|---|
| Anchor-only, complete digest unchanged | 93 | 70 | 23 | All prior review fields preserved |
| Content, including composite heading digests | 124 | 101 | 23 | All pending; prior approvals removed |

`rebindings.json` now says `applied: true` on every row and records the actual
`reviewStatusAfter`. All **124** content claimIds are listed in
[rereview-claim-ids.json](rereview-claim-ids.json), status `applied-pending-review`.
There is no independent approval. Hashes reuse compact sorted-key UTF-8 JSON +
LF over the existing four-key payload; heading ancestry is self-inclusive.

The final applied-record proof checks every row against its input-HEAD preimage,
current binding hash, after witness, disposition and review fields. Restoring
those exact 217 pointers in memory restores every changed decision document;
there are **zero unreported decision changes**. Current drift is **zero**.

## Historical preimages and reused mechanisms

Prior art: the earlier rebind proposals (`7bbad6f12`), misc overlays
(`ad94156cf`, `9d6070828`), shared `ledgerfix/bindings.py`, and the accepted
content/neighbour-placement rules from the earlier rebind reviews. Existing
passage matching and supersession logic were reused, not ordinal placement.

`misc-fix/rebind.py` now loads historical decision JSON with `git show` from
its own recorded pin `23f6eaccf5eb195a8f50e5788d38f386a901b6d2`. This fixes the
eight packaging preimages without changing an embedded reproduction checker.
Every prior assertion remains. Its extracted `check()` is the single owning
proof used by both CLI replay and the rebind author's transactional preflight.
It checks the unchanged delivered shard, refresh witnesses, supersession
resolution, current binding hashes and pending status. It passes before and
after apply: **283 historical effective bindings / 27 unchanged overlays**
(21 content, six neighbour-only). The final proof also runs this same checker
against the restored before rows and actual after rows in memory.

## Passage ownership

Applied the authorized resolution:

- `claim_5412ac73c702e4ec33e4b59dd9ad1940` owns the restored H3 introduction,
  `retired-decision-history.md#0002-mô-hình-việc-phẳng`.
- `claim_f8e2b48d6234ca8a73e15cdaad7d9c07` owns the distinct restored H1,
  `#0002-mô-hình-việc-phẳng-1`, whose complete digest matches its native source.
  Its actual disposition is **move**, review **pending**, not merge into H3.

The author's pair comparison introduces **zero new active native pairs**
against each frozen baseline. This is bounded row evidence, not A/B or a
standalone audit-ownership run. Registry identities and baselines are unchanged.

Each row retains exact before/current passages, neighbours, file hashes,
`beforeCommit`, first-drift `causeCommit` and later document changes. First-drift
attribution remains: `f534aeaea` 74; `7be0cbc52` 71; `d9bedf229` 53; `bc5589ed7`
8; `ad94156cf` 8; `571a996f5` 2; `dff50b64c` 1. No commit is hardcoded in the
author's current-tree passage search.

## Proof commands and actual exits

All short paths below are under
`plans/260925-documentation-authority-unification/`.
Exact argv, stdout and stderr are in [checks.json](checks.json).

| Command | Before apply | After apply | Result |
|---|---:|---:|---|
| `python3 -B reports/phase-09/rebind/rebind.py --check` | 1 | 0 | 217 drift -> zero |
| `python3 -B reports/phase-09/misc-fix/rebind.py --check` | 0 | 0 | Original pin, 283 bindings, 27 unchanged overlays |
| `misc-fix/verify.py` (scratch-only relocation) | 1 | 1 | `AssertionError: proof.json` at unchanged three-way comparison |
| `python3 -B reports/phase-09/rebind/rebind.py` | 0 (apply) | — | All 217 applied; no author blockers |
| `python3 -B reports/phase-09/rebind/replay-proofs.py --label after --applied-only` | — | 0 | Row/status/hash/ownership evidence; same preimage check on both row sets |
| Reproduction test (scratch-prefix-only copy, command below) | — | 1 | Six safety titles pass; both recipe titles fail at `checks.mjs` |
| `git diff --check` | 0 | 0 | Clean whitespace |
| `replay-proofs.py --label before` | 1 | — | Records all before results, including known verifier red |
| `replay-proofs.py --label after --recipes` | — | 1 | Records all after results, including known verifier/test reds |

Requested test invocation:

```sh
env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<activation.releasePath>/bin/fgos \
  node --test test/scripts/doc-rationale-reproduction.test.mjs
```

The activation's `releasePath` was read solely for this host setting. To obey
the exact scratch boundary, the replay uses a temporary copy of this test with
only `/tmp/fgos-work/` prefixes relocated under
`/tmp/fgos-work/w5-rebind-apply/`. Every case/assertion is unchanged; the literal
unadapted command is **not claimed to have passed or run**. The scoped verifier
similarly relocates only scratch/output plumbing and scratch-relative imports,
retaining original `__file__`, ROOT, input HEAD, all assertions and comparisons.
No embedded checker was edited.

Both recipe tests pass their ownership and audit-ownership subprocesses (the
unchanged sequential loop reaches `checks.mjs`), then fail with actual stderr:

```text
Error: {"cause":"git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)","code":"refused",...}
    at facade.<computed> [as trackedPaths] (.../src/git/inspect.mjs:16:66)
```

No A/B result or clone-location diagnosis is inferred. Lead runs the audit
report and A/B after merge in the authorized environment.

## Unmet verification and boundaries

The requested `misc-fix/verify.py` exit 0 before/after is **unmet**. It still
fails at its three-way comparison of generated `proof.json` bytes and the
delivered G6 artifact. The apply brief reserves that comparison and combined
G2/G6 final-pin recomposition for Lead; no pin/assertion substitution or G6/G2
artifact edit was made to manufacture green. `misc-fix/verify.py` itself remains
unchanged. Its checks/receipt now distinguish historical green from this replay.

No pair accounting, reproduction-manifest write, A/B audit-report run, G2/G6
combined verifier, product code/docs/test change, lifecycle verb, Git mutation,
full npm/Cargo suite, secret access, generator build or preview service.
`needsWrites: []`; final-pin recomposition is a separately assigned Lead task,
not an unauthorized write attempted here. Markdown preview remains Lead custody.

Impact-analysis: **degraded**. An initial read-only CLI capability query, issued
before the complete apply brief was loaded, exited **127** (`no .fgos/installation
found above this worktree`). It was not repeated under the brief's no-CLI rule;
there is no exposed live GitNexus tool. No product symbol was changed. Scratch
stays under `/tmp/fgos-work/w5-rebind-apply/`; the runner owns any future commit.

## Review corrections (Lead, 2026-10-24 20:45)

Review `../reviews/w7-rebind-review.{md,json}` checked all 217 rows: 214 APPROVE, 3 REWORK. The Lead applied the three reworks as record corrections. Binding fields are unchanged, and `rebind.py --check` still exits 0.
- `claim_26b3a49a…` changes from `move` to `merge`. `claim_d572bb9d…` owns `agent-confinement/spec.md#unheaded-block-45`. This was a double move that the "zero new active native pairs" statement missed, because neither claim is in the active registry.
- `claim_2e2bc926…` and `claim_5ba6768e…` stay `promote` and pending. Their "identical carry" and "equal digest" statements are withdrawn, and the lost or changed clauses are named in each rationale for re-review.
