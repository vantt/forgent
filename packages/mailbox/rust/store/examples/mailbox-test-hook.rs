//! Test-only hook entry of the mailbox (spec §14, V4 row). It is never
//! installed and is not a product door: the live suite
//! (`test/live/mailbox-claude.live.mjs`) points `claude -p --settings` at
//! it, and `tests/test_hook_entry.rs` runs it as a process. Every behaviour
//! lives in the library (`hook::shell`, `adapters::claude_head`, `verbs`);
//! this file only parses arguments, wires the real stdin, stdout, clock and
//! process table, appends log lines and exits. V5's host route wires the
//! same functions.
//!
//! ```text
//! mailbox-test-hook hook --cli claude|codex --event stop|post-tool-use --fgos-dir <dir> --project <name> --topology direct|one-shell-hop [--log <file>] [--fault panic-in-render]
//! mailbox-test-hook send --fgos-dir <dir> [--wake] [--reply-to <id>] --to <name> <body>
//! mailbox-test-hook inbox --fgos-dir <dir>
//! ```
//!
//! Each flag at most once. `hook` exits 0 on every path, a usage error
//! included (spec §6.1, §8 item 7: Claude Code reads exit 2 from a `Stop`
//! hook as "block the stop"): the cause goes to `--log` when that flag
//! parsed, else to stderr, never to stdout. `send` and `inbox` exit 2 on a
//! usage error, 0 when recorded or listed, 1 when refused or the record
//! failed. `--fgos-dir` must exist; nothing is created outside it.
#[path = "../tests/common/ancestry.rs"]
mod ancestry;
#[path = "../../core/tests/common/support.rs"]
mod support;

use fgos_identity::{resolve_current, Source, WriterId};
use fgos_mailbox::adapters::claude_head::find_head;
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::head::{Ancestry, NoHead, Topology};
use fgos_mailbox::hook::shell::{self, Resolved, ShellInput, WriteGate};
use fgos_mailbox::hook::{Adapter, HeadFacts, HookEvent, HookLimits};
use fgos_mailbox::record::{Record, Wait};
use fgos_mailbox::verbs;
use fgos_mailbox_core::{Limits, MessageId, SendRequest, Timestamp, WriterKey};
use std::collections::BTreeMap;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let code = match args.split_first() {
        Some((verb, rest)) if verb == "hook" => Some(match parse(rest, &[]) {
            Ok(flags) => hook(&flags),
            Err(cause) => usage_error(None, &cause),
        }),
        Some((verb, rest)) if verb == "send" => parse(rest, &["--wake"]).ok().map(|f| send(&f)),
        Some((verb, rest)) if verb == "inbox" => parse(rest, &[]).ok().map(|f| inbox(&f)),
        _ => None,
    };
    std::process::exit(code.unwrap_or_else(|| {
        let _ = writeln!(
            io::stderr(),
            "usage: see the module doc of mailbox-test-hook"
        );
        2
    }));
}

/// Flags and the free arguments.
struct Flags {
    named: BTreeMap<String, String>,
    free: Vec<String>,
}

impl Flags {
    fn get(&self, name: &str) -> Option<&str> {
        self.named.get(name).map(String::as_str)
    }
}

/// The flags of one verb; the cause on a repeated flag or a flag that
/// needs a value and has none.
fn parse(args: &[String], switches: &[&str]) -> Result<Flags, String> {
    let mut named = BTreeMap::new();
    let mut free = Vec::new();
    let mut it = args.iter();
    while let Some(arg) = it.next() {
        if !arg.starts_with("--") {
            free.push(arg.clone());
            continue;
        }
        let value = if switches.contains(&arg.as_str()) {
            String::new()
        } else {
            it.next()
                .ok_or_else(|| format!("{arg} needs a value"))?
                .clone()
        };
        if named.insert(arg.clone(), value).is_some() {
            return Err(format!("{arg} given twice"));
        }
    }
    Ok(Flags { named, free })
}

/// A `hook` usage error: the cause goes to `log`, or to stderr when there
/// is no log, never to stdout; the status is 0.
fn usage_error(log: Option<&Path>, cause: &str) -> i32 {
    let line = format!("usage-error {cause}");
    match log {
        Some(_) => append(log, &line),
        None => {
            let _ = writeln!(io::stderr(), "mailbox-test-hook: {line}");
        }
    }
    0
}

/// The `hook` flags, checked.
struct HookArgs {
    adapter: Adapter,
    topology: Topology,
    event: HookEvent,
    fgos_dir: PathBuf,
    fault: bool,
}

fn hook_args(flags: &Flags) -> Result<HookArgs, String> {
    let adapter = match flags.get("--cli") {
        Some("claude") => Adapter::Claude,
        Some("codex") => Adapter::Codex,
        _ => return Err("--cli must be claude or codex".into()),
    };
    let topology = match flags.get("--topology") {
        Some("direct") => Topology::Direct,
        Some("one-shell-hop") => Topology::OneShellHop,
        _ => return Err("--topology must be direct or one-shell-hop".into()),
    };
    let event = flags
        .get("--event")
        .and_then(HookEvent::from_flag)
        .ok_or("--event must be stop or post-tool-use")?;
    let fgos_dir = flags
        .get("--fgos-dir")
        .map(PathBuf::from)
        .ok_or("--fgos-dir is missing")?;
    if flags.get("--project").is_none() {
        return Err("--project is missing".into());
    }
    let fault = match flags.get("--fault") {
        None => false,
        Some("panic-in-render") => true,
        Some(_) => return Err("--fault must be panic-in-render".into()),
    };
    Ok(HookArgs {
        adapter,
        topology,
        event,
        fgos_dir,
        fault,
    })
}

fn limits() -> (Limits, HookLimits) {
    let section = support::config_section(&support::limits_contract());
    (
        serde_json::from_value(section.clone()).expect("the embedded contract fills Limits"),
        serde_json::from_value(section).expect("the embedded contract fills HookLimits"),
    )
}

fn now() -> Timestamp {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64);
    Timestamp::from_millis(millis)
}

fn append(log: Option<&Path>, line: &str) {
    let Some(log) = log else { return };
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log)
    {
        let _ = writeln!(file, "{} {line}", now().as_millis());
    }
}

/// The caller's session id from session identity, accepted only when it
/// comes from a session variable (never a process id).
fn session_writer(fgos_dir: &Path) -> Option<WriterKey> {
    let identity = resolve_current(Some(fgos_dir));
    match (identity.id, identity.source) {
        (WriterId::Session(id), Source::Env | Source::Registry) => WriterKey::new(id).ok(),
        _ => None,
    }
}

/// A stdout that panics on its first write: the `--fault panic-in-render`
/// trigger, which exists only in this test binary.
struct PanicOnWrite;

impl Write for PanicOnWrite {
    fn write(&mut self, _: &[u8]) -> io::Result<usize> {
        panic!("fault injected: panic-in-render")
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

fn hook(flags: &Flags) -> i32 {
    let log = flags.get("--log").map(PathBuf::from);
    let log = log.as_deref();
    let event_flag = flags.get("--event").unwrap_or("");
    append(
        log,
        &format!(
            "enter cli={} event={event_flag} pid={}",
            flags.get("--cli").unwrap_or(""),
            std::process::id()
        ),
    );
    let HookArgs {
        adapter,
        topology,
        event,
        fgos_dir,
        fault,
    } = match hook_args(flags) {
        Ok(args) => args,
        Err(cause) => return usage_error(log, &cause),
    };
    let project = flags.get("--project").unwrap_or_default();
    let started = Instant::now();
    shell::silence_panics();
    let (limits, hook_limits) = limits();
    let gate = WriteGate::new();
    let budget_log = log.map(Path::to_path_buf);
    shell::arm_budget(
        Duration::from_millis(hook_limits.hook.budget_ms),
        gate.clone(),
        move || append(budget_log.as_deref(), "budget-exit"),
    );

    let record = match Record::open(&fgos_dir) {
        Ok(record) => record,
        Err(error) => {
            append(log, &format!("outcome record-open={}", error.code()));
            return 0;
        }
    };

    let sessions =
        std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".claude/sessions"));
    let hook_call = hook_limits.hook.clone();
    let resolve = move |payload: &[u8], ancestry: &Ancestry| -> Result<Resolved, NoHead> {
        match adapter {
            Adapter::Claude => {
                let writer = session_writer(&fgos_dir).ok_or(NoHead::OtherSession)?;
                let sessions = sessions.as_deref().ok_or(NoHead::NoSessionFile)?;
                let head = find_head(sessions, ancestry, topology, &writer, &hook_call)?;
                Ok(Resolved { writer, head })
            }
            // Feasibility demo only, not a supported path (the Codex adapter
            // is built at V7): Codex's hook process sees no session variable,
            // so the writer is the payload's `session_id` (spec §7.3), and the
            // head is the process at the topology's head position, since
            // Codex keeps no session file. The drain's own writer check
            // still runs.
            Adapter::Codex => {
                let session = serde_json::from_slice::<serde_json::Value>(payload)
                    .ok()
                    .and_then(|v| v["session_id"].as_str().map(String::from))
                    .and_then(|id| WriterKey::new(id).ok())
                    .ok_or(NoHead::OtherSession)?;
                let record = topology
                    .head_of(ancestry)
                    .cloned()
                    .ok_or(NoHead::WrongTopology)?;
                Ok(Resolved {
                    writer: session,
                    head: HeadFacts {
                        record,
                        own_suffix: None,
                        handle: None,
                    },
                })
            }
            Adapter::Agy => Err(NoHead::WrongTopology),
        }
    };
    let read_ancestry = || ancestry::ancestry_of(std::process::id());
    let input = ShellInput {
        adapter,
        event,
        project,
        record: &record,
        limits: &limits,
        hook: &hook_limits,
        tested: TestedClis::embedded(),
        clock: &now,
        ancestry: &read_ancestry,
        topology,
        resolve: &resolve,
        gate,
    };
    let mut stdin = io::stdin().lock();
    let outcome = if fault {
        shell::run(input, &mut stdin, &mut PanicOnWrite)
    } else {
        shell::run(input, &mut stdin, &mut io::stdout().lock())
    };
    append(
        log,
        &format!(
            "outcome event={event_flag} elapsed_ms={} {outcome:?}",
            started.elapsed().as_millis()
        ),
    );
    0
}

fn open(flags: &Flags) -> Option<(Record, PathBuf)> {
    let fgos_dir = PathBuf::from(flags.get("--fgos-dir")?);
    let record = Record::open(&fgos_dir).ok()?;
    Some((record, fgos_dir))
}

/// The caller's identity: attribution only (spec §5.1). A caller with no
/// session variable is named by its process, as session identity says.
fn caller(fgos_dir: &Path) -> Option<WriterKey> {
    WriterKey::new(resolve_current(Some(fgos_dir)).id.to_string()).ok()
}

fn send(flags: &Flags) -> i32 {
    let ([body], Some(to)) = (flags.free.as_slice(), flags.get("--to")) else {
        return 2;
    };
    let Some((record, fgos_dir)) = open(flags) else {
        return 1;
    };
    let Some(from) = caller(&fgos_dir) else {
        return 1;
    };
    let (limits, hook_limits) = limits();
    let req = SendRequest {
        from,
        to: to.to_string(),
        body,
        wake: flags.get("--wake").is_some(),
        reply_to: flags.get("--reply-to").map(MessageId::from_text),
        dead_keys: Default::default(),
    };
    let answer = verbs::send(
        &record,
        req,
        Wait::Ms(hook_limits.hook.lock_wait_ms),
        now(),
        &limits,
    );
    let _ = writeln!(io::stdout().lock(), "{}", answer.text);
    if answer.recorded {
        0
    } else {
        1
    }
}

fn inbox(flags: &Flags) -> i32 {
    if !flags.free.is_empty() {
        return 2;
    }
    let Some((record, fgos_dir)) = open(flags) else {
        return 1;
    };
    let Some(key) = caller(&fgos_dir) else {
        return 1;
    };
    let (limits, hook_limits) = limits();
    match verbs::inbox(
        &record,
        &key,
        Wait::Ms(hook_limits.hook.lock_wait_ms),
        now(),
        &limits,
    ) {
        Ok(text) => {
            let _ = writeln!(io::stdout().lock(), "{text}");
            0
        }
        Err(code) => {
            let _ = writeln!(io::stdout().lock(), "{code}");
            1
        }
    }
}
