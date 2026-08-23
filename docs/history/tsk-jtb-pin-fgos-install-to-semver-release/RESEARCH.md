# RESEARCH — tsk-jtb (pin fgOS install to a semver release)

## Round 1 — 2026-08-13

**Asked:** does this repo already have a convention/precedent for gating an
automated action (release, tag, publish) behind CI or human approval, so a
pin-release design has somewhere concrete to hook into? Not asking the
research helper to decide the tag-cut criteria itself (a product decision)
— only to gather the technical starting state so the exploring question can
be concrete instead of generic.

**Checked (repo search, direct read):**

- `.github/workflows/ci.yml` — the only workflow in the repo. Two jobs
  (`test` matrix OS, `herdr-plugin` cargo test), triggered only on
  `push: branches: [main]` and `pull_request: branches: [main]`. **No tag
  trigger of any kind** (`on.push.tags`, `on.release`, etc. — absent). No
  release/publish job exists anywhere in this file.
- `package.json` — `"private": true` (blocks any accidental `npm publish`,
  consistent with `docs/specs/distribution.md` RUL2: distribution is
  git-based install, never a public registry publish). `version: "0.1.0"`,
  no version-bump script, no `release`/`publish`/`tag` script in
  `scripts{}` (only `test`, `setup:hooks`, `cli`, two `check:*` scripts).
- `git tag` — exactly one tag, `pre-tsk-3ce`, unrelated to a release
  (confirms the item's own claim: no semver-tagged release has ever been
  cut on this repo).
- `README.md` `## Install` (lines 11-21) — exactly:
  ```
  npm install -g github:vantt/forgent
  ```
  No ref/tag/branch qualifier of any kind — confirms it always resolves to
  whatever commit is currently on `main`.

**Found:**

1. There is genuinely **no existing hook** to attach a "gate before tag"
   policy to — no tag-triggered workflow, no release job, no version-bump
   automation. A pin-release design starts from zero on the process side,
   not from adapting something half-built.
2. This is NOT purely a technical gap — the actual open questions are
   about who/when/how a tag gets cut, which is a **process/ownership
   decision** the repo owner has to make (there is no existing convention
   in this repo to infer it from, e.g. no CODEOWNERS-driven release
   process, no bot, no scheduled cadence anywhere in `.github/`).
3. `README.md`'s install line and `package.json`'s scripts are both small,
   well-isolated edit surfaces — confirms the item's own scope claim ("does
   not touch runtime logic in bin/ or src/") is accurate; no blast-radius
   surprise found.

**Open (genuine product/process decisions, not resolvable by repo scout):**

1. **Tag-cut criteria and gate** — bump on every merge to main? On a
   schedule? Manually, by the repo owner, when they judge a milestone
   stable? Does cutting a tag require anything beyond "CI is green on
   main" (e.g. a specific milestone closing, a manual sign-off)?
2. **Version-bump ownership** — who/what bumps `package.json`'s `version`
   field, and when relative to the tag (same commit as the tag, a
   dedicated release-prep commit, CI-automated)?
3. **Install command shape after this lands** — `README.md`'s `## Install`
   should point at a tag/semver range instead of bare `main`, but should
   the bare-`main` (bleeding-edge) install path still be documented
   alongside it for contributors/early-adopters who want it, or dropped
   entirely?
4. **CI's role** — should `ci.yml` gain a tag-triggered job that gates
   *cutting* a tag (e.g. refuses a tag on a commit CI hasn't run against),
   or is it enough that `main`'s own existing push-triggered CI already
   proves the commit being tagged?

**Verdict:** `unclear` — these four are real product/process decisions
with no existing repo convention to resolve them from evidence; they need
the repo owner's judgment at `exploring`, not a guess here.
