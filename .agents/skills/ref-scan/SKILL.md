---
name: ref-scan
description: >-
  Set up and run a project-local reference-learning area: extract notable
  features from reference sources (git repos, papers, living docs) into
  per-source indexes with incremental cursors, compare across sources, and
  track porting decisions. Use when the user asks to learn from / analyze /
  scan a reference project or document, set up reference learning in a
  project, run a delta scan since the last analysis, triage the intake queue,
  or check the learning area's consistency. Not for porting or implementing
  the features themselves.
metadata:
  version: "0.1"
  ecosystem: forgent
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: scripts/ref-scan.mjs automates init/delta/seal/check; without node the lifecycle still works manually.
    git:
      kind: command
      command: git
      missing_effect: degraded
      reason: git-repo sources need a local clone for delta computation.
---

# ref-scan

Learning pipeline over reference sources: **observe** (per-source index) →
**compare** (matrix) → **decide** (porting log), incremental by cursor so a
source is never re-analyzed from scratch. All state is markdown in the host
project; the script only automates the mechanical steps.

Helper (all commands below): `node <skill-dir>/scripts/ref-scan.mjs`

## Learning area layout (created by `init`)

```
docs/references/
  taxonomy.txt          # learning domains, machine-read (host-editable)
  intake.md             # capture queue — sources awaiting triage
  sources/<name>.md     # per-source feature index + cursor frontmatter
  comparison-matrix.md  # curated cross-source comparison
  porting-log.md        # single source of truth for adoption decisions
  deep-dives/<topic>.md # theme deep-dives across sources (on demand)
references/<name>/      # source copies (clones/PDFs) — gitignored via managed block
```

`init` is idempotent: it never overwrites existing files and only manages the
`# REF-SCAN:START/END` block in `.gitignore`, preserving every byte outside it.

## Lifecycle

```
Capture → Triage → Extract → Compare → Seal
```

1. **Capture** — user (or you, when research surfaces something notable)
   drops a row into `intake.md`. Ten seconds, no judgment.
2. **Triage** — HUMAN decides what is worth learning. On accept:
   `add <name> --type git-repo|paper|living-doc --url <u>`, clone/save the
   copy under `references/<name>/`, delete the intake row.
3. **Extract** — `delta <name>` tells you what to read (full scan on first
   run; commit range / version gap after). Follow
   `references/extract-rules.md` for entry format, update-vs-new rules, and
   the cost-tiering protocol (mechanical inventory → cheap subagents;
   classification and judgment → you).
4. **Compare** — new or changed features worth cross-referencing get a
   matrix row; porting-worthy ones get a `candidate` row in the porting log
   scored `R# E# F#` AT CREATION (rubric in extract-rules.md; rejects are
   recorded WITH a reason — never silently dropped). `rank` derives the
   priority view for the human — for both porting and deep-dive selection.
5. **Seal** — `seal <name> [--domains all|d1,d2] [--version <v>]` writes the
   cursor atomically. MANDATORY last step of every analysis session; an
   unsealed scan will be re-done from the old cursor next time.

Run `check [<name>]` after sealing: it verifies cursors resolve, Where paths
exist at HEAD, matrix anchors resolve, and lists domains needing backfill.

## Source types and cursors

| type | cursor | delta semantics |
|---|---|---|
| `git-repo` | `last_analyzed_commit` | `delta` pulls the clone and prints the commit range + changed files |
| `paper` | `extracted_date` | immutable — extract once, seal, never delta again |
| `living-doc` | `last_analyzed_version` + date | fetch the URL, compare changelog/version against the recorded cursor yourself, extract the gap, seal with `--version` |

Adding a domain to `taxonomy.txt` marks every sealed source as needing
**backfill**: scan the CURRENT snapshot for that domain only (never replay
history), then `seal <name> --domains <new-domain>`.

## Deep-dive mode

When the human names a theme to đào sâu ("how do the references solve X?"),
follow `references/deep-dive-protocol.md`: assemble from matrix + indexes
(free) → reuse existing inventory reports → targeted reads of cited `Where:`
files only — never re-scan a source. Output
`docs/references/deep-dives/<topic>.md`, Bottom Line first, and it MUST end
with a synthesis: a combined best-of design fitted to the host project, not
just a comparison.

## Headless mode

Never block on a question. Run delta → extract → compare for the given
source, apply only unambiguous updates, queue ambiguous classifications and
porting decisions under an `Outstanding Questions` section in your report,
and still seal (cursor moves; open questions are recorded, not lost). Output
structured markdown.

## Hard gates & red flags

- Everything under `references/` is READ-ONLY. Never edit, never commit it.
- Never seal without having updated the index for what the delta covered.
- Never hand-guess a cursor; `seal` computes it from the clone.
- Never rename an entry slug (matrix anchors break) — supersede with a new
  entry instead. Upstream-deleted features get a `Status:` marker, never
  silent deletion.
- Never trust a diff hunk alone — re-read the touched file at HEAD before
  updating an entry.
- Porting status lives ONLY in porting-log.md; triage and porting decisions
  belong to the human — propose `candidate` rows, never decide adoption.
- Do not build search infrastructure for the learning area; the grep recipe
  in extract-rules.md is the supported lookup path.

Extraction complete and sealed. Report what was learned (new/changed/removed
features, matrix updates, proposed candidates) in work language, then hand
the porting candidates to the human for triage.
