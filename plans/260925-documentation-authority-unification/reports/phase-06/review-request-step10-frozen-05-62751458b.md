# Bounded re-review: frozen 5

Author session: `codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16`
Packaged by: `codex-session:unit-run-1792122626822-ceb0cdd9@2026-10-16`
Content commit: `62751458b22b47e930dc33b8501d07798b91ace3`; author changes `eb793bc63`; comparison `9b0526380329d8cb1cb6085a1c8f378e943e2505`.
Entries: **1**; maximum 60 entries and 400000 bytes per Markdown/sidecar.
[One request index](review-request-step10-index-62751458b.md).

Committed `currentDecision`/`after` snapshots come from `git show 62751458b22b47e930dc33b8501d07798b91ace3:<shard>` through `reviewEntryFromCommittedRow`. Explicit `packageOverlay` and `packageOverlayAfter` values are fresh pending native/dependent rows and require the runner package commit for ordinary verdict binding. Before prose is historical. No producer seed, draw or verdict.

Exact scratch-only reproduction commands, run sequentially from repository root at the runner package checkout:

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency --output /tmp/fgos-work/review627/consistency.json
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
env -u CLAUDE_CODE_SESSION_ID python3 - <<'PY'
import json
from pathlib import Path
p=Path('/tmp/fgos-work/review627'); p.mkdir(parents=True, exist_ok=True)
if p.is_symlink() or not p.resolve().is_relative_to('/tmp/fgos-work') or p.resolve().is_relative_to(Path.cwd().resolve()): raise RuntimeError('unsafe scratch directory')
for name in ['step10-native-inventory.bin','step10-sync627-D-both.json','step10-sync627-D-identity.json','step10-sync627-D-phase02.json','step10-sync627-D-summary.json','step10-sync627-target-ownership.json','step10-sync627-link-replay.json']:
    out=p/name
    if out.is_symlink() or out.exists() and out.stat().st_nlink!=1: raise RuntimeError('unsafe scratch output')
j=json.loads(Path('plans/260925-documentation-authority-unification/reports/phase-06/step10-sync627-reproduction.json').read_text())
for name,text in j['readOnlyScripts'].items():
    out=p/name
    if out.is_symlink() or out.exists() and out.stat().st_nlink!=1: raise RuntimeError('unsafe scratch file')
    out.write_text(text)
PY
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review627/inventory-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --max-old-space-size=4096 --max-semi-space-size=16 /tmp/fgos-work/review627/verify-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review627/ownership-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node /tmp/fgos-work/review627/audit-ownership-readonly.mjs
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 /tmp/fgos-work/review627/replay-readonly.py
```

The unchanged checker audits **all 12895 rows /92 shards**, including all whole-section and distinct-occurrence rules, **836** selected outputs and the native-dependent refresh. Expected tests: **490** pass. No author `--apply`, carry-forward, registry persistence or repository output occurs in these reviewer commands. Inventory replay reads the sole compact registry; its regenerated inventory and all D/ownership/link outputs stay under `/tmp/fgos-work/review627/`. Reader reproduction needs available scratch space and memory; do the heavy commands sequentially. Historical author mutation scripts in the provenance manifest are evidence only.

A36: every pending submitted claim receives ordinary verdict and digest/anchor/shard equality. Independently seed >=45/296 rationale deep sample plus >=45/298 conservative Weak-exact/Judgment population (one reviewer draw can satisfy both only if coverage proved). Every listed unequal-digest, partial/historical row, all52 whole-section headings, all8 own-occurrence footers, restored L10-2, and marked docs/tool/native corrections are deep. [Exact deep populations](step10-sync627-A36.json). Reviewer records seed/sample IDs; >3% deep rework escalates to whole set. No separate claim verdict on frozen/footer/accounting references when the pending claim is already submitted in rationales/decisions. Existing reviewed approvals remain; evidence/native tuples do not approve current truth or cutover.

## Entry frozen-001

```json
{
  "kind": "restored-frozen-rationale-reference",
  "entryId": "frozen-001",
  "file": "plans/260925-documentation-authority-unification/ledger/decisions/s10-closing-instructions.json",
  "collection": "registryGaps",
  "claimId": "claim_5c520fcb1a68ba27e2093341834258c7",
  "frozenRecord": {
    "claimId": "claim_5c520fcb1a68ba27e2093341834258c7",
    "sourceUnitDigest": "938342cd7dfcb965b91bb4ab13461c296dbda391d975bca9d1f5e296e9b75895",
    "targetOwner": null,
    "targetAnchor": null,
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-2 supersedes the earlier A34 source-to-self partial-carry acceptance with reclassify-out-of-platform-scope, pending independent review. The historical two-line unit claim_5c520fcb1a68ba27e2093341834258c7 has old digest 938342cd7dfcb965b91bb4ab13461c296dbda391d975bca9d1f5e296e9b75895. Both complete original lines are retained in the always-loaded AGENTS.md, outside platform documentation authority: (1) `fgos run` is the primary door for executing new work in the execution core. (2) For routing checks, `fgos dispatch decide` computes the execution mechanism and executor via `bind()` (`src/runner/execution/bind.mjs`). herdr is the default transport when present in the session/environment. The first retained native identity is claim_bfd24ffa5a43c26830bb9771c04de7f1 at AGENTS.md#unheaded-block-22 with digest b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8; the second is claim_2ae81c7bed935553943d6777b81e2114 at AGENTS.md#unheaded-block-24 with digest e4e33c148710cfb9775867b0160ed6e82d2e469d0f118ad9ba5ae33ce79c2484. Residual evidence plans/260925-documentation-authority-unification/reports/phase-06/root-instructions-partial-carry-residual.json has SHA256 d4bd139d397c007d0f633998319284bfc37073b27ed39f377cd677946fe00a0d. Both native identities are preserved; the claim_2ae81c7bed935553943d6777b81e2114 decision remains byte-for-byte unchanged in its existing shard. No platform instruction copy is created. Q5a and L10-3 retain all root doctrine outside platform authority. This reclassification is not source-to-self carry proof, truth certification or approval carry. Source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at HEAD 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "witnessCommit": "5035fed52",
    "reason": "L10-2 authored and independently reviewed; L10-29 forbids regeneration at unchanged binding.",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-22"
  },
  "existingApprovalPreserved": false,
  "mechanicalRequired": true,
  "deepRequired": true,
  "tags": [
    "L10-29/full-frozen-L10-2"
  ],
  "reviewScope": "Confirm frozen list and complete binding/rationale. Reviewed rows keep approval; pending L10-2 verdict is submitted once in rationales. L10-2 must equal original 5035fed52 rationale, full identities/digests/residual and superseded A34 note.",
  "currentContentCommit": "62751458b22b47e930dc33b8501d07798b91ace3",
  "authorSession": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16",
  "currentDecision": {
    "claimId": "claim_5c520fcb1a68ba27e2093341834258c7",
    "sourcePath": "AGENTS.md",
    "sourceAnchor": "unheaded-block-22",
    "sourceUnitDigest": "938342cd7dfcb965b91bb4ab13461c296dbda391d975bca9d1f5e296e9b75895",
    "disposition": "reclassify-out-of-platform-scope",
    "rationale": "L10-2 supersedes the earlier A34 source-to-self partial-carry acceptance with reclassify-out-of-platform-scope, pending independent review. The historical two-line unit claim_5c520fcb1a68ba27e2093341834258c7 has old digest 938342cd7dfcb965b91bb4ab13461c296dbda391d975bca9d1f5e296e9b75895. Both complete original lines are retained in the always-loaded AGENTS.md, outside platform documentation authority: (1) `fgos run` is the primary door for executing new work in the execution core. (2) For routing checks, `fgos dispatch decide` computes the execution mechanism and executor via `bind()` (`src/runner/execution/bind.mjs`). herdr is the default transport when present in the session/environment. The first retained native identity is claim_bfd24ffa5a43c26830bb9771c04de7f1 at AGENTS.md#unheaded-block-22 with digest b093c6fb2a5d0ad347222f5cd68b1b44614799ac24ed54b60a29134c5f7ddfb8; the second is claim_2ae81c7bed935553943d6777b81e2114 at AGENTS.md#unheaded-block-24 with digest e4e33c148710cfb9775867b0160ed6e82d2e469d0f118ad9ba5ae33ce79c2484. Residual evidence plans/260925-documentation-authority-unification/reports/phase-06/root-instructions-partial-carry-residual.json has SHA256 d4bd139d397c007d0f633998319284bfc37073b27ed39f377cd677946fe00a0d. Both native identities are preserved; the claim_2ae81c7bed935553943d6777b81e2114 decision remains byte-for-byte unchanged in its existing shard. No platform instruction copy is created. Q5a and L10-3 retain all root doctrine outside platform authority. This reclassification is not source-to-self carry proof, truth certification or approval carry. Source file SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f at HEAD 59b9b70876324e07135db53d2351f7db6a7e1746. L10-3 current-file repin at SYNC 59b9b7087: AGENTS.md SHA256 47f3a4e52f036d42838b372a8586535f6b3b152ce67d03ad871002981f658b1f; unchanged unit text but file binding re-decided pending.",
    "reviewStatus": "pending",
    "targetOwner": null,
    "targetAnchor": null,
    "authoredBy": "codex-session:unit-run-1792118148618-e4fd15ef@2026-10-16"
  }
}
```

