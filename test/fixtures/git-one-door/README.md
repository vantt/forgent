# Seeded false negatives for the one-door scan

Each directory is a tiny tree that `scripts/git-one-door-scan.mjs` scans as its own root.
Every one hides a Git spawn in a shape a literal `execFile('git', ['<write verb>', ...])`
search misses (Git spec §12: the nine shapes, plus five the data-flow resolution must keep
catching: a renamed Rust `Command`, a Rust shell `.args(["-c", ...])` script, git handed to a Rust
argv-running primitive through a struct field, git as a `timeout` launcher's command operand, and the consumer-command marker set on a spawn of
`git` itself). `test/git/one-door.test.mjs` requires the
scan to report each one. The files are never imported or run.
