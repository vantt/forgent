# Review: project-settable `launchConfinement` keys (CFG follow-up, T5 closing report section 10.6)

Reviewer: HARDEN (owner decision 76(f)). Date 2026-11-09. Read-only review; nothing implemented.
Sources read: `docs/platform/config/spec.md` (section 4 rule 4, `tighten`), `core/config-schema/runner.schema.yaml` (`launchConfinement`, `executorEntry`, `invocation`, `capabilityConfinement`), `packages/config/rust/src/snapshot.rs` (`lowers`, `lowered`, `rule_at`), `packages/yaml-doc/rust/src/merge.rs`, `src/runner/dispatch/config.mjs`, `src/runner/dispatch/confinement/{request,authority,policies,bypass-pairing}.mjs`, `src/runner/dispatch/herdr-round.mjs`, `src/setup/registrations.mjs`.
Merge behaviour is read from code (`merge.rs`: a mapping with no rule is `Deep`, anything else including an array is `Leaf`, so replaced whole). I could not run a merged read from a scratch project (no installed addon outside an activated project), so the project-over-global key-by-key result below is derived, not run.

## 1. Threat model

- **Who writes the project file:** anyone who lands a commit, or a cloned third-party repo's own `.fgos/config.*`. Spec section 4 already states this ("the project file is not trusted for machine keys") and R-3 of the T5 red-team is the same threat.
- **What is already guarded:**
  - A project cannot create or run an executor: `command`, `args`, `permissionMode`, `confinement.backend`, `privateHome`, `isolatedSession` are `global-only`, and a project's `invocations` list is refused whole.
  - Real enforcement is chosen by a capability's `confinement` (`tighten`, `config-confinement-lowered`) naming a policy from `runner.confinementPolicies` (`global-only`).
  - The invocation `override` key has no schema node, so it is refused as unknown. Code still reads `invocation.confinement.override` (`request.mjs:396,459`) but that path is unreachable from config, and `validateOverrideConfinementShape` only allows narrowing anyway.
  - No trust prompt exists for confinement keys (backlog `p-8da4b370` covers command digests only). Doctor rows `checkExecutorConfinement` and the herdr maturity row read the merged config, so they pass whatever layer supplied a value; they do not catch layer origin.
- **What the four keys really do.** I grepped every reader of `invocation.confinement.*` and of the executor entry's `confinement`:

| Key | Reader of the executor/invocation-level value | Effect |
|---|---|---|
| `contract` | `normalizeLegacyConfinement` (`policies.mjs`) only checks `== 'confinement-policy.v1'` to pass an object through | none on enforcement |
| `grants` | `authority.mjs:297` copies them into the attestation as "legacy" grants with a made-up target; the bwrap driver reads `policy.grants` (`bwrap.mjs:417`), never the invocation's | none on enforcement; adds entries to the attestation record |
| `networkFilter` | carried through `normalizeLegacyConfinement`; no reader outside `policies.mjs` policy validation | dead at this level; the real filter is `policy.networkFilter` from a `global-only` policy; bwrap supports only `networkEgress: allow` anyway (`bwrap.mjs:367`) |
| `controls` | (a) `checkBypassIsConfined` (`config.mjs:508`), doctor rows, `evaluateBypassPairing`: `controls.home/session/workspace` count as a second spelling of `privateHome/isolatedSession/ownWorktree`; (b) `herdr-round.mjs:131-160` `establishConfinement`: provisions a private home, isolated session and own-worktree guard from them; (c) `authority.mjs:258-289,328`: attestation coverage and the `host-ipc` "covered" claim | real, see below |

## 2. Verdicts

### `contract`: fine as is
No consumer decides anything from it beyond a literal string match. A wrong value only changes how the object is normalized (it falls to the `controls` branch) and cannot widen anything. Tightening it buys nothing.

### `grants`: fine as is, one note
Executor-level grants are not enforcement input (evidence above); policy grants live in `global-only` policies. The only effect is attestation noise: a project can add resource entries (with `target` set to the home dir or the resource name) to a refusal/prepare attestation. That is an audit-record integrity nit, not a widening. Closing it falls out of the `controls` change below if the owner wants the group uniform.

### `networkFilter`: fine as is
Dead at the executor/invocation level and unenforceable in the only driver (`allow` only). A policy-level filter is guarded by `confinementPolicies` being `global-only`. Revisit if a driver starts honouring an invocation-level filter; at that point it must be global-only or tighten-only before the reader lands.

### `controls`: needs a rule, and it is not a tighten merge
This is the only key with a real effect, and it is the loophole in the half-B rule. `privateHome`, `isolatedSession` and `backend` were made `global-only` so a project cannot loosen them, but `controls.home|session|workspace` is an equivalent spelling that every reader accepts and that stayed project-settable. With default `Deep` merge, a project key lands key by key on top of the global entry. Concrete effects:

1. A global executor written in controls form (no shipped or local config uses it today; I found none in `core/`, `.fgos/config.json`, `~/.fgos/config.*`) can be weakened by a project setting `controls.home: host` or `controls.workspace: shared`. On a herdr executor that silently drops the private home or the own-worktree guard (`establishConfinement`). On a bypass executor it makes the load refuse (loud, a denial of service, not a widening).
2. The reverse direction: a global `permissionMode: bypass` executor that omits the pairing flags is refused at load today; a project can add `controls` to satisfy the check. On a herdr executor that causes real provisioning (harmless), on a bwrap executor only the declaration is checked, so the pairing passes without the policy supplying the isolation. This needs a global misconfiguration to exist first, so I rate it low.
3. Attestation: `controls.session: isolated` plus a verified bwrap makes the `host-ipc` channel report `covered` (`authority.mjs:328-338`), so a project can inflate an audit claim.

The cleanest fix is `x-fgos-scope: global-only` on `launchConfinement.controls`, not `x-fgos-merge: tighten`:
- `tighten` replaces the whole object and `lowers()` knows only `mode`, `policy`, `allowInvocationOverride` and `strict`. Extending it to rank seven axes per `CONTROL_ORDER` is roughly 25-30 lines of Rust plus fixtures, and it would also need to say what happens to a `controls` the lower layer never set.
- There is a direct precedent that matches the intent: the sibling flags are `global-only`, and spec section 4 rule 4 says "a committed project file can neither name a program nor loosen a confinement it cannot lower through `tighten`". `controls` is the same facts as those flags.
- Cost of `global-only`: a project loses the ability to declare extra `controls` on an executor. Nothing in this repo or the docs relies on that (the how-to only shows `controls` inside a policy, which is already `global-only`).

### Related key found while reading: `ownWorktree` (needs an owner question)
`launchConfinement.ownWorktree` is not annotated `global-only`, although `privateHome` and `isolatedSession` are. A project can set `ownWorktree: false` over a global `true` (flags are leaves, project wins). Effect: the `own-worktree-unavailable` guard and the herdr own-worktree requirement stop applying for a non-bypass executor; for a bypass executor the load refuses. It is the same loosen-by-project path as `controls.workspace`. I did not find a recorded reason in the spec for leaving it out of the half-B list (`git log -S` on the key was not exhausted); treat it as an owner question, not a defect, since the decision-64 key list may have been deliberate.

## 3. Smallest rule that fits the existing conventions (sketch, not implemented)

Reuse the scope annotation already used by the siblings; no new mechanism (design principle 1).

- `core/config-schema/runner.schema.yaml`, `$defs.launchConfinement.properties.controls`: add `x-fgos-scope: global-only` (1 line, same form as `backend`). If the owner answers yes on `ownWorktree`, 1 more line there.
- `docs/platform/config/spec.md` section 4 rule 4: add `confinement.controls` (and `ownWorktree` if chosen) to the enumerated global-only keys (1-2 lines); a decision-history line (3 lines).
- Fixture: one case in the shared `packages/config/contracts/fixtures/scope.v1.json` that a project `executors.<id>.confinement.controls` is refused with the scope code, modelled on the existing `privateHome` case (about 10-15 lines). Per design principle 8 the Rust golden test owns the behaviour; no Node copy.
- Total: about 20-25 lines, no Rust logic change, no caller migration (no config uses it). `contract`, `grants` and `networkFilter` may be added to the same node for uniformity ("executor confinement is machine-owned", 3 more lines), but they need no fix; leaving them is also acceptable.

Doctor: no new row needed; a refused project key already shows in `fgos config check`.

## 4. Open questions for the owner

1. Should `ownWorktree` join the global-only list (same loosen path as `controls.workspace`)? Recommendation: yes, unless decision 64 left it out on purpose.
2. Make only `controls` global-only (minimal), or the whole executor `confinement` group except nothing (uniform, drops the attestation-noise nit)? Recommendation: `controls` plus `ownWorktree` now; the other three have no effect to guard.

## 5. Evidence limits
- The deep-merge outcome and the herdr provisioning effect were read from code, not run. A scratch merged read needs an activated project; the golden fixture added with the fix will prove it.
- No `git log -S` pass for prior art on `controls` scope beyond the closing report and spec history lines; the spec's 2026-11-06 history entry lists only `backend`, `privateHome`, `isolatedSession`.
