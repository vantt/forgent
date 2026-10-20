# Seeded false negatives for the one-door scan

Each directory is a tiny tree that `scripts/git-one-door-scan.mjs` scans as its own root.
Every one hides a Git spawn in a shape a literal `execFile('git', ['<write verb>', ...])`
search misses (Git spec §12, the nine shapes). `test/git/one-door.test.mjs` requires the
scan to report each one. The files are never imported or run.
