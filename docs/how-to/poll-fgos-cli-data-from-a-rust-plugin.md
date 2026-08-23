# Poll fgOS CLI data from a Rust plugin

A recipe for wiring a compiled plugin binary to real fgOS state through the
CLI — grounded in `tsk-19y-2`, wiring the herdr dashboard's mock rows over
to live `fgos triage`/`fgos list` data.

## 1. Never spawn the `fgos` shell function

`fgos` in an interactive shell is a **function**, not a real executable on
`PATH`:

```bash
$ which fgos
fgos () {
	local root
	root=$(_fgos_repo_root)  || return 1
	node "$root/bin/fgos.mjs" "$@"
}
```

A compiled binary's subprocess spawn (`std::process::Command::new("fgos")`)
never sources `~/.bashrc`/`~/.zshrc`, so that function does not exist in a
plugin's child process — the spawn fails outright. Call what the function
itself calls instead: `node <repoRoot>/bin/fgos.mjs <args> --dir
<repoRoot>`, resolving `repoRoot` yourself (step 2).

## 2. Resolve the repo root the same way every fgOS skill does

The plugin binary's cwd is `HERDR_PLUGIN_ROOT` (nested inside the repo
checkout, not the checkout root itself), and per ADR0020 a linked
*worktree* never carries its own `.fgos/` — so the resolution has to land
on the real main checkout, not wherever the binary happens to be running
from:

```rust
pub fn repo_root() -> io::Result<PathBuf> {
    let output = Command::new("git")
        .args(["rev-parse", "--path-format=absolute", "--git-common-dir"])
        .output()?;
    let common_dir = String::from_utf8_lossy(&output.stdout).trim().to_string();
    Ok(Path::new(&common_dir).parent().unwrap().to_path_buf())
}
```

This is the exact `git rev-parse --path-format=absolute --git-common-dir`
resolution `fgos-routing`/`fgos-coding-implement` already use from shell — same
idea, just called from Rust via `git`'s own CLI rather than a shell
snippet.

## 3. Parse only the envelope shape you actually need

`fgos triage --json` and `fgos list --all --json` both wrap their payload
in `{contract, generated_at, data_hash, data: ...}`. `serde`'s default
(non-`deny_unknown_fields`) deserialization already ignores fields you
don't declare, so declare only what the UI actually renders:

```rust
#[derive(Deserialize)]
struct TriageEnvelope { data: Vec<TriageRow> }

#[derive(Deserialize)]
struct TriageRow {
    id: String,
    title: String,
    #[serde(rename = "goalTier")]
    goal_tier: Option<String>,
}
```

`fgos triage`'s `data` array is already sorted server-side (the backlog's
`rankImpact` order) — don't re-sort it in the plugin; just render the rows
in the order given. `fgos list --all --json`'s `data.work` is a map
(`{id: {...}}`), not an array — filter it to `status == "doing"` yourself
(that's the fgOS definition of "in-process task"; never read a
terminal-multiplexer's own agent/process status as that signal — a
previously-burned production lesson this plugin inherits, doesn't
re-decide).

## 4. Test parsing against fixture JSON, never a live CLI call

A unit test that shells out to a real `fgos` process is slow, flaky
outside a real fgOS checkout, and untestable in CI. Paste a real captured
JSON response as a `const &str` fixture and assert against that instead —
this is also the only way to pin an exact ordering assertion (e.g. "row 0
has `goalTier: mvp`, row 1 doesn't") without depending on live backlog
contents that change over time:

```rust
const TRIAGE_FIXTURE: &str = r#"{"data": [...]}"#;

#[test]
fn parse_triage_preserves_rank_impact_order() {
    let rows = parse_triage(TRIAGE_FIXTURE).expect("fixture should parse");
    assert_eq!(rows[0].goal_tier.as_deref(), Some("mvp"));
}
```

## 5. A poll failure must never blank an already-populated screen

A transient CLI hiccup (main checkout momentarily locked by another
session, a merge in progress) is expected in a multi-session repo, not
exceptional. Structure the refresh so a failed poll leaves the previous
rows in place and only updates a visible error line, rather than
replacing good data with an empty list:

```rust
pub fn refresh_from_fgos(&mut self, root: &Path) {
    match fgos::fetch_triage(root) {
        Ok(rows) => { self.work_items = rows.into_iter().map(...).collect(); }
        Err(err) => self.last_error = Some(err.to_string()),
    }
    // ...same pattern for fetch_doing
}
```

## 6. A single-threaded ratatui loop can still poll on an interval

No async runtime needed for a 5-second poll cadence — track the last poll
time next to the existing input-poll loop and refresh when the interval
elapses:

```rust
let mut last_poll = Instant::now();
loop {
    terminal.draw(|frame| draw(frame, app))?;
    if event::poll(Duration::from_millis(250))? { /* handle input */ }
    if last_poll.elapsed() >= Duration::from_secs(5) {
        app.refresh_from_fgos(&root);
        last_poll = Instant::now();
    }
}
```

The 250ms input-poll timeout already doubles as the loop's tick rate, so
no extra sleep or thread is needed to check the 5s interval.
