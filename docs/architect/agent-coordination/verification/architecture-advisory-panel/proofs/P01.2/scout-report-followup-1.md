Role: Context Investigator (Phase 9 Turn 1 follow-up) | Cell: P01.2 | Requested: `codex-readonly`, tier `analytical` | Derived: provider `openai-codex`, model `gpt-5.5`
Dispatch: `codex exec -s read-only -C /home/vantt/projects/mdview` (direct, no bwrap)
Prompt: `proofs/P01.2/prompts/context-investigator-turn1-followup.md`
Raw run: `proofs/P01.2/runs/10-context-investigator-followup-raw.log`
Authorized by: `dispositions.md`'s Turn 1 authorization (narrow Phase 3 reopen)

---

**Question:** does the desktop shell still build and function against the
current daemon, or has it silently drifted since its last real change
(July 20)?

**I found compatible source-level interfaces, a stale desktop lockfile,
and an authentication integration gap. I could not establish successful
compilation or runtime correctness** (offline dependency resolution and
sandbox limits stopped a real `cargo check` short — no project files were
changed attempting it).

1. **Dependencies/compilation — inconclusive, not confirmed working.**
   Desktop's lockfile is stale (references `mdview-core 0.5.1` vs current
   `0.7.6`, `crates/mdview-desktop/Cargo.lock:2406`). A real `cargo check`
   attempt hit `exit 101` twice — first on a stale lockfile, then (after
   updating just that reference) on an unavailable offline dependency
   (`alloc-no-stdlib v2.0.4`). Neither attempt reached actual Rust
   compilation. This is a genuine, real gap the person's "nobody was
   watching" answer already told us was possible — the last time anyone
   proved this builds may be July 20.

2. **Called APIs remain source-compatible.** No removed/incompatible
   signature in the desktop's actual calls (`running_daemon`/`base_url`,
   `Config::load`, `apply_detach`). `DaemonInfo` gained a `version` field
   with `#[serde(default)]`, which doesn't break existing callers.

3. **No shell-specific protocol mismatch found in the Sept 3-5 changes**
   (background indexing, short-link redirects, in-place editing) — desktop
   just opens the daemon's URL in a WebView with no route parser or
   response decoder of its own to break.

4. **A concrete, real, current authentication gap.** Since August,
   accessing the daemon unauthenticated redirects to login. When desktop
   spawns a fresh daemon on first run, that daemon generates and **prints
   its first auth token to stdout** (`crates/mdview/src/server.rs:188`,
   `auth.rs:157`) — but the desktop shell **discards stdout/stderr entirely**
   (`crates/mdview-desktop/src/main.rs:119`) and has no mechanism to
   present that token to the user. The token is saved to config, but its
   one-time display is lost. **A first-time user launching the desktop
   shell today would hit a login wall with no way to get the credential
   needed to pass it**, unless they already have the daemon running with
   auth already configured some other way (e.g. via CLI first).

**Not checked:** actual window startup, login-cookie behavior, rendering,
editing, tray operation, or interaction with a running daemon — no binary
was installed or executed.

## Coordinator's note

This is a real, concrete, currently-live defect — not merely "unknown
health." It resolves part of the Turn 1 ambiguity in a specific direction:
the shell is not simply dormant-but-fine; at least one integration point
(first-run authentication) has genuinely broken since the shell's own last
change, caused by daemon-side auth work the shell was never updated to
handle. This is squarely inside "stay-thin-and-fix" territory once
re-specified (per dialogue/1-impact.md's own point that the old candidate
needed a real referent for "fix") — this IS one, concretely.
