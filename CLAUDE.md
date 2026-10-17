# Project Rules

Every agent CLI used on this repository (Claude Code, Codex, omp, pi, agy)
reads one shared instruction file: AGENTS.md. Claude Code reads AGENTS.md on
its own only when no CLAUDE.md exists, so this file stays and does nothing but
import it. Put every rule in AGENTS.md, never here; a tool that writes its own
block into this file (for example `gitnexus analyze`) makes Claude read that
block twice. The bare import below must never be wrapped in backticks; that
disables it.

@AGENTS.md
