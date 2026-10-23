# Phase 23: Docs closeout

Depends on 22. Suggested executor: haiku for the text, sonnet for the final gates. Docs impact only where behaviour, setup, contracts or decisions changed (documentation rule). Read each file before editing; verify every claim against source, tests or live state; verify links.

## Files it may touch

`docs/platform/config/spec.md` (header "Implementation status": Node door, readers and writers moved, migration and doctor done; section 12 and 13 facts as built; section 16 gates G6 closed by D, G5 done; one history line for Slice C: facade, JSON-text marshalling and prototype-free objects, `init`, machine view, `bin` cache, fail-closed hook rule, legacy fallback of `gateBypass`), `docs/platform/yaml-document/spec.md` (section 12 done, status), `docs/platform/component-boundary.md` (Config and YAML rows), `docs/specs/seat-binding.md` (history line: the representation clause of D-ADR0072 is superseded, `$comment` ladder replaced by `@fgos:doc`, spec section 7 requires it; check phase 00 whether D already wrote it), `docs/specs/runner.md` (sentences naming `.fgos/config.json` as the runner config source and `ensureRunnerConfigForDir`), `docs/specs/distribution.md` (row 7 doctor-check list: rows added by D and retired here, `config-awareness`, `shared-config-defaults`, the `bin` cache path; row 5b if it names the global file's role), `docs/specs/reading-map.md`, `docs/backlog.md` (p-99951b9e, p-a189ff31 progress; close items this slice finished; open items for what it found: Ideas I2 to I7 only if the owner chose them, `findExecutableOnPath` duplicates, the legacy gate-bypass file), `CHANGELOG.md` (`## [Unreleased]`: reads of config never write; first run creates nothing; `fgos setup` writes a header-only file; config is YAML read by Rust; accounts and token in `~/.fgos/private`; `config-format-legacy-json` is a failure; a bare checkout needs the staged addon for YAML and config reads; doctor rows removed and added; focused `node --test` needs `npm test` staging), board `plan.md` row CFG and `log.md`, every `.md` phase 00 listed that tells an agent to read `.fgos/config.json` and now misleads (change the sentence to `fgos config show`/`explain`, nothing more).

## Steps

1. Merge `origin/main`; make the edits; `rg -n "readSharedConfig|ensureRunnerConfigForDir|js-yaml|src/config/shared-config-file" docs core --glob '*.md'` shows only history text.
2. Final gates, sequential with `free -g` first and the exit code read on the next statement: `cargo test --workspace --jobs 4`, then `npm test`, then the gateway and dashboard suites.
3. Budget count in the closeout line: Rust source added (ceiling 700) and removed; Node added, removed and net excluding the vendored file (target at most -400) per phase; test lines added and retired; cold-start numbers from phase 08 against phase 22's live ones; effort used against 131h. Report any ceiling touched and what the owner decided.
4. Board: row CFG to "Slice C landed, machines activated: ...", log line, unblock MP-C (accounts to the file) and note the remaining open items (I2 global conversion, Windows G4).

## Owning proof

`cargo test --workspace --jobs 4` and `npm test` green, sequential; text re-read against code.

## Risk / rollback

Docs only; revert the commit.
