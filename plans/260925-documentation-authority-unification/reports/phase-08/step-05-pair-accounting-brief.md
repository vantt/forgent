# Pair accounting brief (reproduction manifests)

Status: Lead brief for the next Doer turn (non-docs accounting).

You are the accounting Unit for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Read the phase-08 file Step 0 "Two-commit procedure (L12-11)" and reports/phase-08/progress.md (latest section). Since the last accounting commit ab3c971a4 came these commits (get the exact list with git log --oneline ab3c971a4..HEAD). Account every unaccounted pair the reporter lists at HEAD, whatever commit it comes from.

This turn runs under fgos run: you only write files; the runner commits them. Do NOT run any git write. Do not read .fgos/secrets.local.env, do not touch .fgos/. Never run the fgos CLI. Your ONLY writable files are plans/260925-documentation-authority-unification/reports/phase-06/step10-round5-reproduction.json and plans/260925-documentation-authority-unification/reports/phase-06/step10-sync4d-reproduction.json. Scratch only in /tmp/fgos-work/.

Task: at HEAD, run env -u CLAUDE_CODE_SESSION_ID python3 -B plans/260925-documentation-authority-unification/reports/phase-08/audit-report.py and take check A's exact unaccounted commit/path pairs for each manifest. Append each pair as {commit, path, authority} data to the exceptions array in BOTH manifests, following the format of the existing pairs exactly (authority text citing L12-11 and the commit that produced each pair). Change NO other byte (scripts, recipes, pins, allowlists). Then verify on the working tree that the only diff in each manifest is the appended exception data, and rerun the reporter: check A must report zero unaccounted pairs other than those that can only come from your own runner commit (which touches only allowlisted phase-06 paths, so expect none).

Your final message: FIRST line a conventional commit subject of at most 100 characters, no plan ids, phase or finding labels. Then a short Vietnamese summary (anh/em): pairs appended per manifest, diff check, reporter result.
