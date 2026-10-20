# Review a38 — Step 4 wave 2, part 21 (set step04-012, apps/fgos-gateway)

Pin: dc24ce645. Worktree detached at 05862286c, read-only. Nothing was run from the checker, probes, resolver or author scripts.
Method: loaded `step-04-wave2-p21.json` with python3 and printed per slot: edgeId, original lines, expression, disposition, target, anchor, timing, reason and blockedReason. Extracted all 12 sources at the pin with `git show dc24ce645:<path>` and read them. Grepped every source for doc-like references and compared the hits against the slots and the stepFiveExcluded lists. Existence of every cited path was checked with `git cat-file` at the pin.

## Per file

| File | Slots | Verdict |
| --- | --- | --- |
| apps/fgos-gateway/Cargo.toml | 5 preserve | ok |
| apps/fgos-gateway/build.rs | 1 preserve | ok |
| apps/fgos-gateway/src/cf_access.rs | 1 preserve | ok |
| apps/fgos-gateway/src/gateway.rs | 19 rows: 17 preserve, 2 parked; 11 Step 5 exclusions | ok |
| apps/fgos-gateway/src/mcp.rs | 6 preserve rows; 7 Step 5 exclusions | ok |
| web/src/App.tsx | 1 preserve | ok |
| web/src/api/client.ts | 1 preserve | ok |
| web/src/api/errors.ts | 1 patch | ok |
| web/src/api/poll.ts | 1 preserve | ok |
| web/src/api/types.ts | 1 preserve | ok |
| web/src/lib/network.ts | 4 rows: 2 parked, 2 preserve | ok |
| web/src/lib/status.ts | 1 preserve | ok |

Stratum: all 12 files are mandatory changed-record re-review (L12-60 sweep re-derived park reasons). Set step04-012: 12 reviewed, 0 rework (0%).

## Findings per slot group

### Preserve of `docs/history/**` (Cargo.toml 000015/16/17/18, build.rs 000019, cf_access.rs 000020, gateway.rs 000021/25/30/31/33/42/48, mcp.rs 000050/51/54, poll.ts 000064, status.ts 000069)

- Rule: L12-10, plus L12-29/38/60.
- `docs/history/**` is retained, so these references are not legacy roots.
- I confirmed that every cited file exists at the pin:
  - herdr-web-dashboard/{CONTEXT,plan}.md
  - herdr-web-dashboard-plan-realignment/CONTEXT.md
  - tsk-54y-gateway-cors-bind/plan.md
  - fgos-interface-daemon/CONTEXT.md
  - fgos-gateway-mcp-surface/CONTEXT.md
- Every one is a decision-pointer comment ("D9 of ...") or a history-convention example (`docs/history/<feature>/`). Preserve is correct.
- Wrapped citations (build.rs 6-7, Cargo.toml 48-49 and 53-54, gateway.rs 826-827, 1261-1262, mcp.rs 2-5 and 213-214) are all kept literal. The census records only the first physical segment for some of them. No present-tense claim about a retiring tree is hidden in these.

### Preserve of `docs/contracts/fgos-gateway-api-v1.yaml` (Cargo.toml 000014, gateway.rs 000022/24/27/28/29/36/38, mcp.rs 000052, client.ts 000062, types.ts 000065, network.ts 000068)

- Rule: L12-26(3), L12-60.
- `docs/contracts/` is a path that stays valid (owner-answers L12-21 flip notes; the file exists at the pin).
- Preserve is right. These are comments only; the runtime reader stays Step 5.

### Preserve of `docs/ui-spec/screens/S01-sign-in.md` (App.tsx 000061)

- `docs/ui-spec/` is retained, and the file exists at the pin.
- A `docs/platform/ui-spec/architecture/screens/S01-sign-in.md` mirror also exists, but owner-answers keep `docs/ui-spec/` valid, so preserve is correct.

### Parked (gateway.rs 000023 at L13 and 000026 at L131)

- Park is correct (phase9-carry).
- The source comments claim `docs/specs/distribution.md` row 5b says the global config file is "not created by anything except fgos setup", and that the gateway therefore never provisions the token.
- Row 5b exists in the candidate `docs/platform/packaging-distribution/spec.md:527` and in `history/distribution-baseline.md`.
- The live doctor contract has a `gateway-token-configured` check, and its fix provisions a token (the proof logs show "fix provisions a real one"). That contradicts the comment's "never self-provisioned" gloss.
- Redirecting only the path would leave a false description. Parking is right.

### Parked (network.ts 000067, both physical segments)

- Park is correct (description-rewrite).
- The comment says R5 (`docs/specs/herdr-web-dashboard.md`) establishes that "reachable on network" has no dedicated contract field.
- R5 in the old spec (line 217) and in the candidate spec (line 239) says the default bind reaches beyond loopback and gives the port.
- Neither version says anything about a missing contract field or a baseUrl-only signal. The citation carries a claim R5 does not make, so a plain redirect would be a false adjacent description.

### Patch (errors.ts 000063, docs/specs/herdr-web-dashboard.md:259-260 to docs/platform/herdr-web-dashboard/spec.md#edge-cases-settled, Phase 9)

- Target exists. Heading `## Edge Cases Settled` is at line 267 of the target, so the anchor `edge-cases-settled` resolves.
- Old lines 259-260 in `docs/specs/herdr-web-dashboard.md` are the "gateway is unreachable ... never presents stale data as current" bullet.
- The same bullet is at lines 280-281 of the target.
- The quoted comment text in `errors.ts` lines 4-5 matches that bullet verbatim, so the description stays true.
- The diff changes only comment line 3. Behavior is unchanged: it is a `//` line outside any string or code, and the import on line 1 and the rest are untouched.
- The new locator form `path#anchor` follows the convention for replacing numeric line locators.
- Hunk header `@@ -1,6 +1,6 @@` is consistent with the context lines shown.

### Step 5 exclusions

All are runtime code or strings, not maintained prose comments, so exclusion is correct. The remaining spans, mcp.rs 528/545/562 and 530/547/564, are `create_dir_all`/`join` in tests.

- gateway.rs 878: error format string.
- gateway.rs 895: error message string.
- gateway.rs 1187: `state.root.join("docs/contracts/...")`.
- gateway.rs 1740-1741: test setup.
- gateway.rs 2314-2357: test code and fixtures.
- mcp.rs 127: `root.join("docs/contracts/...")`.

Duplicate `edgeId: None` entries for gateway.rs 2314, 2320, 2335 and 2357 mirror the numbered edges; they are harmless.

### Missed-reference sweep

I grepped all 12 files for `docs/`, `.md`, specs, architect, plans, history, contracts and distribution. Every hit is covered by a slot or an exclusion, or is a bare filename (CONTEXT.md, plan.md, RESEARCH.md, `/work/{id}/docs` route text), which is not an edge. The `Cargo.toml` dependency path `../../packages/distribution/rust` is a code path, not a doc reference.

### Comment-only check

The single patch is a comment-line edit, so there is no behavior change. All other records have an empty diff.

## Record-text notes (not rework)

- Several parked reasons repeat the prefix "A51, L12-30/31/32/58/60:" twice. It is cosmetic.
- The `blockedReason` and `dependency` fields carry the same long text as `reason`, rather than a distinct short blocker. This is also cosmetic.

## Lead-judgment questions

- None blocking. One optional observation: gateway.rs lines 13 and 131 are parked on a row-5b claim that the doctor fix contradicts. If Phase 9 carries "not created by anything except fgos setup", the comment's "never provisions" wording still needs a rewrite. That is already implied by the park.

## Counts

- Set step04-012: 12 reviewed, 0 rework (0%), which is under the 3% threshold, so no expansion is needed.
- Patch slots: 1 reviewed, 0 defects. Parked: 4 rows reviewed, 0 defects. Preserve: all reviewed, 0 defects.

Status: DONE
Summary: All 12 apps/fgos-gateway files (41 slots) are ok. The single patch resolves to a real heading and quote, and it is a comment-only change.
