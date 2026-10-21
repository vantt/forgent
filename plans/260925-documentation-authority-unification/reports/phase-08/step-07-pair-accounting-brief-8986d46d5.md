# Pair accounting brief (through 8986d46d5)

Status: Lead brief for the next Doer turn (non-docs accounting).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. One mechanical task, non-docs. You only write files; the runner commits them; never run a git write, never run the fgos CLI, never touch the .fgos directory or read the secrets env file. Writable: only the two phase-06 reproduction manifests plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json and step10-sync4d-reproduction.json. python -B. Scratch /tmp/fgos-work/.

Pair accounting (L12-11), the same procedure the previous turn used in f213a92ec: run env -u CLAUDE_CODE_SESSION_ID python3 -B plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py, take check A's exact unaccounted commit/path pairs for each manifest (commits 5d589e814 through 8986d46d5 plus this brief) and append each as {commit, path, authority} to the exceptions array of BOTH manifests in the existing format (the exceptions live inside the embedded checks.mjs script string; read how f213a92ec appended them with read-only git show/diff). Authority for each pair: the owner-answers L12 entry its commit recorded (5d589e814 L12-98, 9f708a7eb and 36f195a64 Lead briefs, fdbde60fa L12-99, 8986d46d5 L12-100, this brief Lead brief) — use the same authority wording style as existing entries. Change no other byte. Rerun the reporter: zero unaccounted pairs other than those your own runner commit will create (the two manifest paths).

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
