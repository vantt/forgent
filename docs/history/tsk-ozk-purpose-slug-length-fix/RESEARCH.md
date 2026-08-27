# tsk-ozk — knowledge registry purposeSlug length + docs/knowledge/ prefix — RESEARCH

## Round 1 (2026-08-27)

**Asked:** tsk-ozk's own description claims (1) 247/332 classified topics
have a `purposeSlug` over 60 chars (up to 420), one of which (307 chars)
crashed a real `--apply` with `ENAMETOOLONG` at target 181/332, and (2) the
user wants a `docs/knowledge/<purposeSlug>/<role>.md` prefix instead of the
flat `docs/<purposeSlug>/<role>.md` layout locked at D-tsk28x-5. Goal:
ground both claims and find whether the mechanisms the scope line assumes
(`topic-rename`, `fgos decision --relation supersedes:<id>`) actually
exist, before deciding this item is `clear` for planning.

**Checked (repo search):**

- `rg -- "purposeSlug" src bin docs test --glob "*.{mjs,cjs,md}"` — 160
  hits across 13 files. Read the live ones directly.

**Finding 1 — root cause confirmed in code, no length bound exists
anywhere.** `scripts/knowledge-classifier.mjs:43-68` (`classifyDocFile`)
sets `purposeSlug = slugify(purposeTitle)` where `purposeTitle` is the raw
`meta.authoritative_for` string, or the first H1, or the file basename —
whichever is found first, verbatim, no truncation. `slugify`
(`scripts/knowledge-classifier.mjs:11-17`) only lowercases and collapses
non-alnum runs to `-`; it does not bound length. `assertSafeSlug`
(`src/state/knowledge-registry.mjs:44-56`, `SAFE_SLUG_RE`) is the only
validation `topic.register`/`topic.rename`/`topic.split` run on
`purposeSlug` — it checks path-safety (no `/`, no leading `.`) only, never
length. No `60`-char (or any numeric) length constant exists anywhere in
`scripts/knowledge-classifier.mjs`, `scripts/knowledge-migration.mjs`,
`src/state/knowledge-registry.mjs`, or
`docs/architect/knowledge-registry-redesign.md` (grepped, zero hits) — the
"60 chars" figure in tsk-ozk's own description is a proposed design bound,
not something already codified to reuse.

**Finding 2 — the "topic-rename" mechanism the scope line names already
exists and is fully wired.** `bin/fgos.mjs:1630-1634` (`topic rename`
subcommand) → `renameTopicStore` → `src/state/knowledge-registry.mjs`'s
`topic.rename` reducer case (line 264-280): takes `newPurposeSlug`,
re-validates it through the same `assertSafeSlug`, records
`topic.lineage.renamedFrom` for traceability, and updates
`topic.purposeSlug` in place. CLI shape: `fgos topic rename <topicId>
--new-purpose-slug <slug> [--new-purpose-title <title>]`. This is exactly
the verb tsk-ozk's scope line means by "via topic-rename or equivalent" —
nothing new needs to be built for the apply side.

**Finding 3 — "filesystem-safe uniqueness" is already enforced downstream,
not something this item's rename step has to reinvent.**
`assertCurrentPathUnique` (`src/state/knowledge-registry.mjs:150-156`) is
called at doc register/move time (`doc.register`, `doc.path-move`, lines
502/580/783) and rejects a non-retired `currentPath` collision. `purposeSlug`
itself is NOT required to be globally unique — `test/scripts/knowledge-
migration.test.mjs:265-267` shows two different topics legitimately sharing
one `purposeSlug` (`'shared'`) with different `role`s producing distinct
`currentPath`s. So a truncate-and-dedup rule for the 247 affected topics
only needs to avoid colliding `(purposeSlug, role)` pairs where they didn't
already collide pre-truncation — the registry's own assertion will catch a
real collision loudly (a thrown `KnowledgeValidationError`), not silently.

**Finding 4 — the ENAMETOOLONG crash site is a real, already-observed
failure, consistent with the description.** `scripts/knowledge-
migration.mjs`'s apply path builds the on-disk target from `move.newPath`
(itself `docs/${purposeSlug}/${role}.md`, per
`docs/architect/knowledge-registry-redesign.md:97/166`) and writes it via a
real `mkdir`+file write — a 307-byte-plus path component exceeds the
common 255-byte filesystem segment limit, matching the description's
"ENAMETOOLONG ... at target 181/332" claim. Not independently re-run here
(would require reproducing tsk-5mh's actual --apply state), but the code
path that would produce this failure is real and unguarded (no length
check before the `mkdir`/write in `knowledge-migration.mjs`).

**Finding 5 — the docs/knowledge/ prefix question already has a working,
precedented recording mechanism; nothing new to build for part (2)
either.** `bin/fgos.mjs:2351-2372` + `src/state/store.mjs:1764-1796`
implement `fgos decision --relation none|supersedes:<id>|touches:<id>` as
a real, enforced flag (a decision whose text reads like a supersession is
REJECTED unless `--relation supersedes:<id>` is passed explicitly — line
2353-2357). This exact pattern is already used once for this same decision
family: `docs/history/compound-learn-artifact-registry/DISCUSSION.md:924-925`
records `D-tsk28x-13` superseding D-tsk28x-5's anti-duplication clause via
`fgos decision ... --relation supersedes:D-tsk28x-5`. D-tsk28x-5 itself
(`DISCUSSION.md:358`) is the locked clause tsk-ozk's part (2) wants to
partially supersede (the flat `docs/<purpose>/<role>.md` layout, not the
anti-duplication clause D-tsk28x-13 already touched) — so `fgos decision
--relation supersedes:D-tsk28x-5` for a *different* clause of the same
decision is the same, already-proven move, not a new pattern.

**Finding 6 — tsk-5mh (the downstream apply item this item unblocks) is
real and already wired as a dependent.** `fgos list --id tsk-5mh --json`:
`status: "awaiting-human"`, `stage: "executing"`, `deps: ["tsk-1uj",
"tsk-ozk"]` — tsk-5mh already declares tsk-ozk as a hard dependency, and is
currently parked (consistent with the description's account of a crashed
apply attempt plus the user's "too messy" layout feedback).

**Finding 7 — the description's own numbers are exact, verified directly
against the LIVE registry, not just plausible-sounding.** Ran `fgos list
--all --json --dir "$(git rev-parse --show-toplevel)"` and inspected
`data.topics` (332 entries, all `status: "active"` today — these are real
registered topics, not just an inventory report row): exactly **247**
active topics have `purposeSlug` over 60 UTF-8 bytes, max length **420**,
and a **307**-byte one is present in the set — matching the description's
"247 of 332 ... up to 420 ... one of these (307 chars)" claim digit for
digit. tsk-5mh's classify+register step has already run for real; this
item's job is fixing already-live registry data, not a future classifier
run.

**Verdict inputs gathered, no open gaps:** every mechanism tsk-ozk's scope
line assumes (`topic rename`, `fgos decision --relation supersedes:<id>`)
is real, already wired, and precedented; the root cause and crash site are
confirmed in code, not just plausible; the description's own 247/420/307
numbers are independently verified against live data, exact; the length
bound and truncation/dedup *algorithm* are correctly left to this item to
decide (that is planning's job, not a discovery blocker — the description
itself says "decide and apply", not "find out how"). No named library/
pattern/decision in the description turned out to be unresolvable from the
repo.

**Proposed verify (real, runnable, already exercised above — returns exit 1
today with count 247, will read 0/exit 0 once the fix is applied; uses only
the proven `fgos list --all --json` interface, not internal store
internals):**

```bash
fgos list --all --json --dir "$(git rev-parse --show-toplevel)" | node -e '
let s = ""; process.stdin.on("data", (d) => (s += d));
process.stdin.on("end", () => {
  const data = JSON.parse(s).data;
  const over = Object.values(data.topics)
    .filter((t) => t.status === "active" && Buffer.byteLength(t.purposeSlug, "utf8") > 60);
  console.log("active topics with purposeSlug over 60 bytes:", over.length);
  process.exit(over.length > 0 ? 1 : 0);
});'
```

## Round 2 — post-implementation gap discovered (2026-08-27)

**Asked:** after the `out-of-process` dispatched worker (provider `agy`,
model `gemini-3.6-flash-medium`) reported `[DONE]` with "Verified that 0
active topics exceed 60 bytes" and "Recorded the superseding decision",
does the CANONICAL main-checkout store (`/home/vantt/projects/forgentX/
.fgos`) actually reflect either change?

**Checked:** `fgos list --all --json --dir "/home/vantt/projects/forgentX"`
→ `data.topics` still showed **247** active topics over 60 bytes (same
count as before dispatch), and `fgos show tsk-ozk --json`'s `decisions`
array had no `supersedes:D-tsk28x-5` entry. Grepped
`/home/vantt/projects/forgentX/.fgos/events.jsonl` and every shard under
`/home/vantt/projects/forgentX/.fgos/events/*.jsonl` for `topic.rename` —
zero hits anywhere in the canonical store.

**Finding — the out-of-process worker's registry-state writes landed in a
disconnected, worktree-local `.fgos/` copy, not the canonical store.**
This item's own worktree (`.claude/worktrees/tsk-ozk-3JZPls`) was found to
carry a FULLY POPULATED local `.fgos/` (real `events.jsonl`, a per-writer
shard `events/460fde17-...-20260827T070034256Z.jsonl` containing the
worker's own 247 `topic.rename` events, `config.json`, etc.) — a distinct
inode from the main checkout's `.fgos` (confirmed via `stat -c '%i'` on
both paths), not a symlink. The worker's own helper script
(`apply-topic-renames.mjs`) resolved its store with a bare
`path.resolve('.fgos')` relative to whatever cwd the `agy` cli-spawn
provider actually used — that resolved to a real, populated `.fgos`
(the rename calls succeeded, not "topic not found," meaning the 332
original `topic.register` events WERE present there), but it was not the
one the rest of fgOS reads from. The worker's own git-tracked deliverables
(source diff in `scripts/knowledge-migration.mjs`/
`scripts/knowledge-classifier.mjs`/docs/tests, plus
`iron-law-evidence.md`'s real red/green transcript) landed correctly on
the shared branch `fgw/tsk-ozk` — only the EVENT-LOG state mutations
(`topic.rename` × 247, the `fgos decision` call) diverged. This is a real
gap in the out-of-process dispatch mechanism's worktree/`.fgos` isolation
for THIS provider (`agy`/cli-spawn), not a flaw in the worker's own
reasoning or in `apply-topic-renames.mjs`'s algorithm — filed for
awareness via `SendFeedback`, not fixed here (out of this item's own
scope).

**Recovery applied:** re-ran the exact same deterministic
`apply-topic-renames.mjs` algorithm (same inputs → same outputs, so the
computed mapping is identical) directly against the canonical store, this
time via 247 real `fgos topic rename <topicId> --new-purpose-slug
<computed> --dir /home/vantt/projects/forgentX` CLI calls (the sanctioned
one-door-write, not a raw event-log write) — see
`apply-real-renames.mjs` invocation in this session's own transcript
(script itself lives only in the scratchpad, not committed — the
COMMITTED `apply-topic-renames.mjs` already documents the identical
algorithm). Re-ran `fgos decision --id tsk-ozk ... --relation
supersedes:D-tsk28x-5` for real against the canonical store (`seq: 268`).
Re-verified: `fgos list --all --json --dir /home/vantt/projects/forgentX`
→ 0 active topics over 60 bytes; `fgos show tsk-ozk`'s decisions array now
carries the real supersession entry.

**Also found and fixed: the item's own `verify` command was itself
fragile.** It used `$(git rev-parse --show-toplevel)` (resolves to
whichever worktree it runs FROM, not reliably the main checkout) piped
through a bare `fgos` word (only resolves via this interactive session's
own shell-function alias — `fgos return`'s own spawned verify subprocess
does not have that alias loaded, so `fgos` there hit a stale global
install with an older schema missing `data.topics` entirely, producing a
`TypeError: Cannot convert undefined or null to object` on the first
`fgos return` retry). Fixed by rewriting `verify` to an absolute,
alias-free, substitution-free form: `node
/home/vantt/projects/forgentX/bin/fgos.mjs list --all --json --dir
/home/vantt/projects/forgentX | node -e '...'` — synced via `fgos edit
tsk-ozk --verify "..."`.
