# retrospective-doc-write-path — plan

Item: `tsk-3ts`. Decisions: `CONTEXT.md` (D1, D2, D3) — cited, never
reopened here.

## Mode gate

Flags counted against the standard list:

| Flag | Applies | Why |
|---|---|---|
| auth | no | |
| authorization | no | |
| data model | **yes** | the outcome record's `docPath` gains an enforced invariant it never had (D3) |
| audit/security | no | |
| external systems | no | |
| public contracts | **yes** | `fgos compound` is a CLI verb; adding a refusal path changes its contract for every caller |
| cross-platform | no | |
| existing covered behavior | **yes** | 10 test files reference `compound`; `test/cli/fgos.test.mjs` alone has 55 references |
| weak proof around the area | **yes** | zero tests cover document durability; the failure recurred three times undetected |
| multi-domain | **yes** | `compound` and the `retrospective` status are domain-agnostic per the parent feature's D5 — a refusal added here binds every domain, not just `coding` |

**Count: 5. Hard gate also tripped: data loss** — document loss is this
item's own subject matter, and a mis-set threshold in D3's fail-closed
check would block synthesis outright, a worse outcome than the bug.

**Mode: high-risk.**

Why nothing smaller honestly covers it: the change lands inside a verb
that every domain's retrospective passes through, with ten test files
depending on its current permissiveness. A `small` mode would carry no
obligation to prove the refusal's boundaries, and the boundary *is* the
risk — refusing too much silently stops all synthesis, refusing too little
reproduces the original bug.

## Approach

`fgos graph --json` places `tsk-3ts` on no critical path and in no
`topUnblock` entry — it has no deps and no dependents, so the graph
imposes no ordering constraint on it. Internal phase order below is
therefore driven by risk, not by graph position.

**Impact-analysis capability gate** (per `CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returns GitNexus `present`,
but the index sits at `251d0b5`, behind current HEAD — **degraded**. The
blast-radius proof point in phase 2 below is therefore kept but marked
weak: GitNexus's answer about `compound`'s callers must be cross-checked
with `rg` before being trusted, per `CLAUDE.md`'s own degraded rule.

### Chosen path

Close the invariant at the verb, and make the skill's step order make that
possible. Concretely: the document is written and committed at the main
checkout *first*; `fgos compound` then refuses to record a `--doc-path`
that is not committed there.

Alternatives rejected — recorded so they are not re-proposed:

- **Validate at the existing step 5 ("confirm the close") instead of at
  the verb.** Step 5 is skill prose, not an enforced door; the same class
  of gap is what let all 34 documents pass. Honoring D3's "impossible to
  violate rather than detected later" means the check belongs in the verb.
- **Keep step 3 → step 4 order and check asynchronously.** Under that
  order the tag necessarily precedes the file it names, so no check at tag
  time can ever be meaningful. D3 locks the inversion for this reason.
- **Rely on `checkRetrospectiveContent` at `cleanup → done`** (already
  fixed by `tsk-558` to call `fs.existsSync`). Kept as defence in depth,
  rejected as the primary guard: it fires seven days late and parks rather
  than repairs. Recorded in `CONTEXT.md`'s rejected-alternatives section.

### Risk map

| Component | Risk | What would prove it |
|---|---|---|
| `fgos compound`'s new refusal | **high** | test that it refuses an absent path, refuses a path present-but-uncommitted (untracked *and* staged-only), and accepts only a path committed at the main checkout's HEAD — verify clause (1) |
| `fgos-coding-compounding` step 3 ↔ 4 inversion | **medium** | test that a synthesis run whose cwd is inside a linked worktree lands its document at the main checkout — verify clause (2) |
| Existing `compound` callers and tests | **medium** | full `npm test` green; blast radius over `compound` cross-checked with `rg` (GitNexus degraded, see above) |
| Regrown document fidelity | low | verify clause (3): the file exists with content sourced from `tsk-5z2`'s own decision record and the shipped `lock-status` behaviour, quoted not paraphrased |

### Files likely touched

- `.claude/skills/fgos-coding-compounding/SKILL.md` **and**
  `.agents/skills/fgos-coding-compounding/SKILL.md` — both copies exist and are
  kept in sync; invert steps 3/4 and add main-checkout root resolution to
  the document-writing step (D1).
- `bin/fgos.mjs`, `compound` case (~line 1165–1182) — add the
  file-committed-at-main check (D3).
- `docs/how-to/check-main-checkout-lock-status-before-retrying.md` — new,
  regrown (D2).
- Tests: whichever file the three verify clauses fit — likely
  `test/cli/fgos.test.mjs` for the verb and a new e2e file for the
  worktree-cwd case.

## Shape

One honest piece, three phases. Not split into separate items: the
approved verify is a single statement covering all three decisions, and
phase 3 is content work small enough that a separate item would cost more
in ceremony than it saves.

**Phase 1 — the refusal, verb-side.** Add the committed-at-main check to
`compound`. Write the failing test first (absent / untracked /
staged-only / committed), then make it pass. This phase alone closes the
invariant; the rest is what makes it usable.

**Phase 2 — the step inversion, skill-side.** Invert `fgos-coding-compounding`
steps 3 and 4 in both skill copies, and give the write step the same root
resolution step 3 already carries. Cross-check `compound`'s callers with
`rg` before editing, per the degraded impact-analysis posture.

**Phase 3 — regrow the lost document.** Source it from `tsk-5z2`'s own
decision record, `docs/history/lock-status-visibility/` (`CONTEXT.md`
7.3K, `plan.md` 4.9K, both present on main), plus the shipped behaviour of
`fgos lock-status`. Write the how-to from that material, quoted not
paraphrased, and commit it at the main checkout — which is also the first
real exercise of D1's own rule.

`fgos doc-sources` is deliberately **not** the source here. It was run
against this path and returns capture metadata only
(`predicted`/`actual`/`docType`/`docPath`, `count: 1`, no prose), so
nothing can be regrown from it. `CONTEXT.md`'s D2 records the same
correction.

Also in scope, one line: correct the stale `docPath` for
`str89-case-study-executing` to
`docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md`.

### Cases worth proving against

Scaled to high-risk mode:

- **Boundary of the refusal** — absent, untracked, staged-but-uncommitted,
  committed. Only the last succeeds.
- **Existing behavior that must not regress** — `compound` called with no
  `--doc-type` still returns the early `{docType: null}` shape without
  touching the new check; the `retrospective`-status precondition still
  fires first.
- **Session standing in a worktree** — document lands at main, not in the
  worktree, and the subsequent `compound` call sees it.
- **Grow-vs-create** — a path already committed at main and being grown by
  a second item passes the check (18 of 155 paths are shared by 2–3
  items; the check must not treat "already exists" as a failure).
- **Partial failure** — the document is committed but `compound`
  subsequently fails: the document stays, no tag is recorded, and a retry
  succeeds. The reverse (tag without document) is what D3 makes
  impossible.

## Assumptions

Pinned rather than asked — none of these change scope, behavior, data
shape, or acceptance criteria (`fgos-coding-planning`'s own material test):

- The committed-at-main check reads git state at the main checkout root
  resolved the same way every other verb already resolves it
  (`git rev-parse --path-format=absolute --git-common-dir | xargs
  dirname`). No new resolution mechanism.
- "Committed" means present in the main checkout's `HEAD` tree, not merely
  staged. This is the reading the approved verify states explicitly.
- The regrown document's Diataxis quadrant stays `how-to`, as the existing
  `docPath` and its recorded `docType` already declare — confirmed by
  running `fgos doc-sources` against the path (`docType: "how-to"`).

## Proof surface

```
npm test green (full suite) + new test proving all three locked decisions:
(1) D3 fail-closed -- fgos compound <id> --doc-path <path> REFUSES both when
    the file is absent at the main checkout AND when it is present there but
    uncommitted (untracked or staged-only); it succeeds only when the file is
    committed at the main checkout's HEAD;
(2) D1 write location -- a synthesis run invoked with cwd inside a linked
    worktree lands its document at the main checkout, not the worktree;
(3) D2 regrow -- docs/how-to/check-main-checkout-lock-status-before-retrying.md
    exists on disk with content sourced from tsk-5z2's own decision record
    (docs/history/lock-status-visibility/) and the shipped lock-status behaviour.
```
