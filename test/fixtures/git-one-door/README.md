# Seeded false negatives for the one-door scan

Each directory is a tiny tree that `scripts/git-one-door-scan.mjs` scans as its own root.
Every one hides a Git spawn in a shape a literal `execFile('git', ['<write verb>', ...])`
search misses (Git spec §12: the nine shapes, plus five the data-flow resolution must keep
catching: a renamed Rust `Command`, a Rust shell `.args(["-c", ...])` script, git handed to a Rust
argv-running primitive through a struct field, git as a `timeout` launcher's command operand, the consumer-command marker set on a spawn of
`git` itself, a method handed on as a value under an object key, a binary returned by a method of a
factory's object, git as the first `push` of a Vec a local Rust function builds, and a command
substitution inside a quoted `echo` operand). Two trees hold what must not be a site:
`standalone-skill` (a skill whose SKILL.md declares `metadata.oneDoor: standalone`, next to one that
does not) and the `die "... (git clone ...)"` line of `shell-data-operand`. `test/git/one-door.test.mjs` requires the
scan to report each one. The files are never imported or run.
