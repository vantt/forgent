# Step 3 pilot round 4 - review g03 (docs/specs/runner.md)

Worktree c7b3564b1, author pin ae141550c, record `step-03-records/batch-041.jsonl` (file `docs/specs/runner.md`, 3452 lines).

## Verdict

`docs/specs/runner.md` (batch-041): **ok**.

Record has 131 edges: 10 patch, 24 parked, 97 preserve. 18 are author-added: the 17 from round 3 plus the new `author-r4-docs-specs-runner-L1729C2`.

## Round-3 defects

- **D1 (missed `specs/runner.md:26`, L1729 col 2): fixed.**
  - The added edge `author-r4-docs-specs-runner-L1729C2` is preserved, spans line 1729 col 2-20, and its normalized reference is `docs/specs/runner.md:26`.
  - Verified at the pin: L1729 reads "trích tại `session.mjs:1-6` và `specs/runner.md:26`". It sits under the `## Lịch sử quyết định retired` heading (L1642) in the 0020 decision body (L1719+).
  - The reason quotes the L1644 framing sentence verbatim. It says the self-reference is stale and that `docs/specs/runner.md` exists at the pin and retires at Phase 9.
  - Its non-executable successor targets exist at the pin: `docs/platform/runner/spec.md` and `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The edge has no target and no diff hunk, which is correct for a preserve.
  - My own scan of the whole source for `(specs|architect)/<name>.md(:line)?` partial-root forms finds only this occurrence. L26 of the source is not the claim the 0020 text cites, which confirms the coordinate is stale and preserve is right.
- **D2 (`maps-j-08232` anchor): fixed.**
  - The edge now patches to `confinement-authority-v1.md#62-nơi-đặt-policy`.
  - Source L1100 col 590 says `docs/specs/confinement-authority.md` "already said a direct executor call must carry a capability anchor and never infer the minimum from `executor.for`".
  - Target L146-149 holds that claim: "Gọi trực tiếp executor ID phải cung cấp capability anchor ... không suy minimum từ executor.for". Those lines sit inside `### 6.2 Nơi đặt policy` (L131-296), so the nearest heading is correct. No narrower H4 holds them: 6.2.1 begins at L297.
  - The adjacent description stays true. It makes a general "already said" claim, which the target backs. The `v1.md` header says "Added in candidate". That is a status nuance, not a false claim, and the patch asserts no shipped-status wording.

## Regions read

- The two outcome edges with passage context (L1100 and L1719-1732).
- The retired-decision framing at L1642-1646.
- The anchor target region at L125-152, plus the whole heading outline of the confinement doc.
- The partial-root scan across the whole source.
- Edge counts and flags.
- I did not re-read the other 129 text-only edge changes, which L12-32 delegates to the checker. Round-3 semantic acceptance carries over for them because no disposition, target or anchor changed (changes json lists only these two outcome ids for this file).

## New defects

None.

## Lead-judgment questions

None new. The round-3 cosmetic items remain as before: hit-group assessment wording, and the 08258 "illustrative" label versus real examples. Per L12-32(5) the enum categories now replace the prose requirement for assessments.

## Denominator and numerator

| Set | Files reviewed (g03) | Rework |
|---|---|---|
| batch-041 (runner.md) | 1 | 0 |

Edge-level outcome defects: 0 of 2 outcome-changed edges.

Status: DONE
Summary: `docs/specs/runner.md` is ok. The L1729 self-reference is now a correct preserve, and 08232 anchors to the 6.2 heading that holds the claim at L146-149. Nothing new was found.
