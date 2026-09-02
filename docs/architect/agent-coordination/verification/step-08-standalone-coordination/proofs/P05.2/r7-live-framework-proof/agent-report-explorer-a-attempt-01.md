# Lateral-thinker exploration -- new separate markdown editor screen for mdview

Assignment: asgn_p05_2_r7_proof_driver_op_002 | Role: explorer | Persona: lateral-thinker

## Constraint compliance
Proposal is a distinct route (e.g. `/p/{project-id}/{path}/edit`), a separate component, never a toggle on the existing read-only view route. Does not fall into the "inline editing" trap the locked objective flags.

## Verdict: architecturally simple to fit, not simple to make safe

**Simple part**: mdview-core already isolates domain logic behind ports (`FileStore`, `Watcher`, `Clock`, `ProjectRepository`, PRD §7.4) with dependency direction enforced inward only. Adding `FileStore.write()` plus an `EditDocument` use-case is additive -- it doesn't break the Clean Architecture skeleton. The URL namespace (§7.2) has room for a sibling route without touching existing ones.

**The lateral move**: don't build a second "apply edit" pipeline. mdview already has a `Watcher` that detects external file changes and pushes them over `/ws` for live reload. Route the editor's save through the same `FileStore.write()` -> notify -> broadcast path, so the daemon's own write is indistinguishable from "someone edited this in vim" -- one event type, deduplicated by content hash/mtime, not by a fragile self-write flag. That's the simplification a straightforward implementation would likely miss (it would be tempted to special-case "my own write, don't reload").

## Single largest risk/blocker: unauthenticated write surface on a multi-client daemon

PRD §3.2 explicitly skips authentication "to keep things simple; security is the user's job at the network level" -- a safe bet *only* because every current capability is read-only (worst case today: unauthorized viewing, already accepted for private-network use). PRD §7.1 confirms the daemon is architected for multiple simultaneous clients (browser tabs, desktop webview) attached to one shared instance -- a deliberate feature (DRY render path), not an edge case.

Put those two facts together: a write-capable editor screen means any of those already-anticipated multiple clients, with zero auth, can silently overwrite another client's in-progress edits to the same `.md` file -- lost work, no conflict warning, no audit trail. That's a category change (read-only info exposure -> destructive overwrite of the user's real source files) that the PRD's no-auth reasoning was never evaluated against.

It also collides with §7.5's desktop "read-only invariant" (desktop must never write into user files/folders). A write-back editor forces either breaking that invariant for the desktop webview or explicitly disabling the edit screen on desktop -- a redefinition of that invariant, not just an extension of it.

**Secondary risk**: self-notify feedback loop -- the daemon's own write must not be mis-picked-up by the OS-level watcher and rebroadcast in a way that stomps the editor's in-progress buffer or double-processes the change. Solvable via content-hash/mtime dedup if designed into the port contract up front, easy to get wrong as a bolt-on.

## Flagged but out of scope for the architecture question
PRD §3.2 also lists "not an authoring tool or WYSIWYG editor" as an explicit product non-goal. Any editor screen contradicts that stated positioning regardless of route separation. This is a maintainer product-scope call, not a technical blocker -- surfaced here, not silently absorbed into the architecture verdict.

## Unresolved questions
- Is multi-client concurrent access to the *same file* actually expected in practice, or is "private network" read to mean single trusted user in practice? This changes how severe the no-auth write risk really is.
- Would the maintainer accept redefining the desktop "read-only invariant" (§7.5), or is desktop explicitly excluded from ever hosting the edit screen?
