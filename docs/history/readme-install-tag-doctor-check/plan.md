# plan.md — tsk-2t8: README's pinned install tag can silently go stale

Mode: small

1 flag counted (existing covered behavior — `DOCTOR_CHECKS` has an
exhaustive enumeration test in `test/setup/registrations.test.mjs`/
`checks.test.mjs` naming every check id, which a new check must update).
No CONTEXT.md: discovery verdict was clear.

## Approach

**Chosen path:** add a new doctor check, `readme-install-tag-exists`, that
parses `README.md`'s `## Install` section for the pinned tag in `npm
install -g github:vantt/forgent#vX.Y.Z` and confirms that tag is a real
local git tag (`git tag -l vX.Y.Z`). Registered the same way every other
check in `src/setup/registrations.mjs` is (`registerCheck`).

**Alternatives rejected:**
- *Cutting the `v0.1.0` tag as part of this item* — rejected. Tag-cutting
  is a locked decision (tsk-jtb D1/D2, `docs/history/tsk-jtb-pin-fgos-
  install-to-semver-release/CONTEXT.md`): "no automated release process by
  design... cutting a tag is always a deliberate, manual act." This item
  does not reopen that decision; it only makes the drift this decision's
  own follow-through created (no tag was ever actually cut) visible via a
  real check, instead of a plan.md action item to override a locked
  decision.
- *A CI-only check (GitHub Actions step)* — rejected in favor of a doctor
  check: a doctor check runs locally too (any dev/CI can run `fgos
  doctor`), is discoverable the same way every other install-health signal
  already is, and needs no new CI job. A CI step can call the same doctor
  check later if wanted; that is out of this item's scope (YAGNI).

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| New check regexes `README.md`'s install line | Light — a static parse of a file this repo controls | Unit test with a real README.md fixture (tag present/absent/malformed) |
| `DOCTOR_CHECKS` exhaustive-enumeration test | Light — mechanical, the test just needs the new id added | Existing `checks.test.mjs`/`registrations.test.mjs` test updated and rerun |

**Impact-analysis posture:** `degraded` (GitNexus present but 173 commits
stale, same posture recorded for tsk-2xj this session — see that item's
plan.md). Grep/Read used directly instead.

## Shape

Single phase:
1. `src/setup/registrations.mjs` — add `checkReadmeInstallTagExists(cwd)`
   + `registerCheck({ id: 'readme-install-tag-exists', ... })`.
2. `test/setup/readme-tag-check.test.mjs` — new test file: tag present and
   real (pass), tag present but not a real git tag (fail, today's actual
   state), no README.md / no pinned tag line found (pass — nothing to
   check, matching every other check's "absent = clean skip" convention
   already used by e.g. `dependencies-installed`/`changelog-unreleased-
   stale`).
3. Update whichever existing test enumerates `DOCTOR_CHECKS`' full id list
   (`test/setup/registrations.test.mjs` per this session's earlier file
   listing) to include the new id.

**Concrete cases to prove against:**
- Empty/boundary: no README.md at the checked cwd at all → skip, passed
  true (same convention as `changelog-unreleased-stale` when the file is
  absent).
- Existing behavior that must not regress: the exhaustive `DOCTOR_CHECKS`
  id-list test must still enumerate every id, now including the new one.
- The actual bug case: this repo's own `README.md` right now (`v0.1.0`
  pinned, no matching git tag) — the new check must report `passed: false`
  when run against this real repo state.

## Split decision

No split — one small, self-contained check addition.

## Outstanding questions

None
