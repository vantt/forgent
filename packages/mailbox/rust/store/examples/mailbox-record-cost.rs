//! What a record hold costs (spec §14 V2 row; compared with S0,
//! `plans/reports/research-261020-1612-mailbox-s0-hook-and-record-costs.md`).
//!
//! Run by hand, release-built, never in `cargo test`:
//!
//! ```text
//! cargo run --release -p fgos-mailbox --example mailbox-record-cost -- <parent-dir> [scenario|all]
//! ```
//!
//! It creates its own fresh `.fgos` directory under `<parent-dir>`, refuses a
//! parent that already holds a `.fgos`, and removes what it created when
//! done, so it never writes synthetic state into a live project. Each
//! scenario builds its population with core calls in one hold, then runs 3
//! warm-up and 50 measured holds through the real `Record` API. Before each
//! measured hold the population's snapshot is put back (untimed), so every
//! sample sees the same population. Every policy value comes from
//! `packages/mailbox/contracts/limits.v1.json`.

use fgos_mailbox::record::{Paths, Record, Reported, Step, Wait};
use fgos_mailbox_core::{
    Checkpoint, Cli, Generation, IdSource, Limits, MailboxState, RegisterRequest, SendRequest,
    Timestamp, WriterKey,
};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const WARMUP: usize = 3;
const RUNS: usize = 50;
const T0: Timestamp = Timestamp::from_millis(1_800_000_000_000);
/// Generous: a measured hold waits for the lock instead of failing.
const WAIT: Wait = Wait::Ms(30_000);
const BACKGROUND: &str = "--background-sender";

fn limits() -> Limits {
    fgos_mailbox::limits::load(None).unwrap().limits
}

fn key(text: &str) -> WriterKey {
    WriterKey::new(text).unwrap()
}

fn register(
    state: &mut MailboxState,
    writer: &str,
    head: String,
    now: Timestamp,
    ids: &mut dyn IdSource,
) -> String {
    let req = RegisterRequest {
        key: key(writer),
        cli: Cli::new("claude").unwrap(),
        project: "forgent".to_string(),
        own_suffix: None,
        head,
        handle: None,
    };
    match state.register(req, None, now, &limits(), ids).unwrap() {
        fgos_mailbox_core::Registered::Created { name, .. } => name.as_str().to_string(),
        other => panic!("{other:?}"),
    }
}

fn send_req<'a>(from: &str, to: &str, body: &'a str) -> SendRequest<'a> {
    SendRequest {
        from: key(from),
        to: to.to_string(),
        body,
        wake: false,
        reply_to: None,
        dead_keys: Default::default(),
        stop_drains: fgos_mailbox::adapters::TestedClis::embedded().stop_drains(),
        alias_refusal: None,
    }
}

fn deliver(
    state: &mut MailboxState,
    writer: &str,
    now: Timestamp,
    limits: &Limits,
    ids: &mut dyn IdSource,
) {
    let generation = state.binding(&key(writer)).unwrap().generation;
    let claim = state.claim(&key(writer), generation, Checkpoint::Step, now, limits, ids);
    if let Some(token) = claim.token {
        state.finish(&key(writer), generation, &token, now);
    }
}

/// One step: a window plus a second, so the budget and the loop guard of
/// the last window have fully passed.
fn window(limits: &Limits) -> u64 {
    limits.human.fallback_window_sec + 1
}

fn header_horizon(limits: &Limits) -> u64 {
    limits
        .loop_guard
        .window_sec
        .max(limits.record.ttl_sec)
        .max(limits.record.body_retention_sec)
}

/// A population: what was built, and the time its last operation used.
struct Population {
    end: Timestamp,
    /// A recipient with no mail, for the no-mail claim.
    quiet: String,
    /// A registered recipient, and the name a send uses for it.
    recipient: (String, String),
}

/// S0 H3 N=50: one address holding 50 settled headers.
fn s0_one(state: &mut MailboxState, ids: &mut dyn IdSource, l: &Limits) -> Population {
    let name = register(state, "recipient", "head-of-recipient".into(), T0, ids);
    register(state, "quiet", "head-of-quiet".into(), T0, ids);
    let share = l.queue.per_sender as usize;
    let mut now = T0;
    for w in 0..50usize.div_ceil(share) {
        now = T0.plus_secs(w as u64 * window(l));
        for _ in 0..share {
            state
                .send(send_req("cli-sender", &name, "m"), now, l, ids)
                .unwrap();
        }
        deliver(state, "recipient", now, l, ids);
    }
    Population {
        end: now,
        quiet: "quiet".into(),
        recipient: ("recipient".into(), name),
    }
}

/// S0 H3 second row: 100 addresses, 50 settled headers each.
fn s0_hundred(state: &mut MailboxState, ids: &mut dyn IdSource, l: &Limits) -> Population {
    let names: Vec<String> = (0..100)
        .map(|i| {
            register(
                state,
                &format!("r-{i:03}"),
                format!("head-of-r-{i:03}"),
                T0,
                ids,
            )
        })
        .collect();
    register(state, "quiet", "head-of-quiet".into(), T0, ids);
    let per_window = l.session.budget as usize;
    let total = 100 * 50;
    let mut now = T0;
    for w in 0..total / per_window {
        now = T0.plus_secs(w as u64 * window(l));
        for i in 0..per_window {
            let r = (w * per_window + i) % 100;
            state
                .send(send_req("cli-sender", &names[r], "m"), now, l, ids)
                .unwrap();
        }
        for i in 0..per_window {
            deliver(
                state,
                &format!("r-{:03}", (w * per_window + i) % 100),
                now,
                l,
                ids,
            );
        }
    }
    Population {
        end: now,
        quiet: "quiet".into(),
        recipient: ("r-000".into(), names[0].clone()),
    }
}

/// The ceiling test's steady state: the shared sender with no head at its
/// session budget for a whole header horizon (one day at the contract's
/// values), to two recipients.
fn steady_one(state: &mut MailboxState, ids: &mut dyn IdSource, l: &Limits) -> Population {
    let names = [
        register(
            state,
            "recipient-one",
            "head-of-recipient-one".into(),
            T0,
            ids,
        ),
        register(
            state,
            "recipient-two",
            "head-of-recipient-two".into(),
            T0,
            ids,
        ),
    ];
    register(state, "quiet", "head-of-quiet".into(), T0, ids);
    let windows = header_horizon(l).div_ceil(l.human.fallback_window_sec) + 2;
    let mut now = T0;
    for w in 0..windows {
        now = T0.plus_secs(w * window(l));
        for i in 0..l.session.budget as usize {
            state
                .send(send_req("cli-sender", &names[i % 2], "m"), now, l, ids)
                .unwrap();
        }
        deliver(state, "recipient-one", now, l, ids);
        deliver(state, "recipient-two", now, l, ids);
    }
    Population {
        end: now,
        quiet: "quiet".into(),
        recipient: ("recipient-one".into(), names[0].clone()),
    }
}

/// `steady_one` plus `heads` registered head generations, each at its
/// lifetime cap of headers.
fn steady_grid(
    heads: usize,
) -> impl Fn(&mut MailboxState, &mut dyn IdSource, &Limits) -> Population {
    move |state, ids, l| {
        let mut p = steady_one(state, ids, l);
        let names: Vec<String> = ["recipient-one", "recipient-two"]
            .iter()
            .map(|k| state.binding(&key(k)).unwrap().name.as_str().to_string())
            .collect();
        let budget = l.session.budget as usize;
        let windows = (l.session.lifetime_cap as usize).div_ceil(budget);
        for h in 0..heads {
            register(
                state,
                &format!("grid-{h:03}"),
                format!("head-of-grid-{h:03}"),
                p.end,
                ids,
            );
        }
        for w in 1..=windows {
            let now = p.end.plus_secs(w as u64 * window(l));
            for h in 0..heads {
                for i in 0..budget {
                    state
                        .send(
                            send_req(&format!("grid-{h:03}"), &names[i % 2], "m"),
                            now,
                            l,
                            ids,
                        )
                        .unwrap();
                }
                deliver(state, "recipient-one", now, l, ids);
                deliver(state, "recipient-two", now, l, ids);
            }
        }
        p.end = p.end.plus_secs(windows as u64 * window(l));
        p
    }
}

/// `steady_one` plus 100 bindings of exited processes, each named by one
/// header it sent, so none is prunable.
fn dead_bindings(state: &mut MailboxState, ids: &mut dyn IdSource, l: &Limits) -> Population {
    let p = steady_one(state, ids, l);
    let to = p.recipient.1.clone();
    let now = p.end;
    for (i, head) in dead_heads(100).into_iter().enumerate() {
        let writer = format!("dead-{i:03}");
        register(state, &writer, head, now, ids);
        state
            .send(send_req(&writer, &to, "m"), now, l, ids)
            .unwrap();
        deliver(state, "recipient-one", now, l, ids);
    }
    p
}

/// Head texts of `n` real processes that have exited.
fn dead_heads(n: usize) -> Vec<String> {
    (0..n)
        .map(|_| {
            let mut child = Command::new("sleep")
                .arg("600")
                .stdin(Stdio::null())
                .spawn()
                .unwrap();
            let record = fgos_process::facts::identity_of(fgos_process::ProcId(child.id()))
                .unwrap()
                .to_record();
            child.kill().unwrap();
            child.wait().unwrap();
            fgos_mailbox::head::head_text(&record)
        })
        .collect()
}

/// Wall times of one hold, split at the steps it reached.
#[derive(Default, Clone)]
struct Sample {
    total: f64,
    /// Milliseconds from the call to each step reached, in order.
    steps: Vec<(Step, f64)>,
}

fn ms(d: Duration) -> f64 {
    d.as_secs_f64() * 1000.0
}

/// Runs `op` with an observer that stamps each step.
fn timed(op: impl FnOnce(&mut dyn FnMut(Step) -> std::io::Result<()>)) -> Sample {
    let start = Instant::now();
    let mut steps = Vec::new();
    op(&mut |step| {
        steps.push((step, ms(start.elapsed())));
        Ok(())
    });
    Sample {
        total: ms(start.elapsed()),
        steps,
    }
}

/// Nearest-rank percentile, as S0 reported them.
fn pct(sorted: &[f64], p: f64) -> f64 {
    let rank = ((p * sorted.len() as f64).ceil() as usize).max(1);
    sorted[rank - 1]
}

struct Bench {
    root: PathBuf,
    record: Record,
    limits: Limits,
    baseline: Vec<u8>,
    pop: Population,
}

impl Bench {
    fn new(
        parent: &Path,
        scenario: &str,
        build: &dyn Fn(&mut MailboxState, &mut dyn IdSource, &Limits) -> Population,
        limits: Limits,
    ) -> Self {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = parent.join(format!(
            "mailbox-record-cost-{scenario}-{}-{nanos}",
            std::process::id()
        ));
        std::fs::create_dir(&root).unwrap();
        std::fs::create_dir(root.join("fgos")).unwrap();
        let record = Record::open(root.join("fgos")).unwrap();
        let pop = record
            .hold(WAIT, T0, &limits, |state, ids| {
                Reported::changing(build(state, ids, &limits))
            })
            .unwrap()
            .value
            .value;
        let baseline = std::fs::read(record.paths().snapshot()).unwrap();
        Self {
            root,
            record,
            limits,
            baseline,
            pop,
        }
    }

    fn paths(&self) -> &Paths {
        self.record.paths()
    }

    /// Puts the population's snapshot back and removes bodies a measured
    /// send left; untimed.
    fn restore(&self) {
        std::fs::write(self.paths().snapshot(), &self.baseline).unwrap();
        for entry in std::fs::read_dir(self.paths().bodies_dir()).unwrap() {
            std::fs::remove_file(entry.unwrap().path()).unwrap();
        }
    }

    fn headers(&self) -> usize {
        let state: MailboxState = serde_json::from_slice(&self.baseline).unwrap();
        state.messages().count()
    }

    /// The time of measured operation `i`: after the population, one step
    /// apart, so the budget never refuses.
    fn now(&self, i: usize) -> Timestamp {
        self.pop
            .end
            .plus_secs((i as u64 + 1) * window(&self.limits))
    }

    fn measure(&self, label: &str, mut op: impl FnMut(&Self, Timestamp) -> Sample) {
        let mut samples = Vec::new();
        for i in 0..WARMUP + RUNS {
            self.restore();
            let s = op(self, self.now(i));
            if i >= WARMUP {
                samples.push(s);
            }
        }
        report(label, &samples, self.baseline.len(), self.headers());
    }

    fn send(&self, now: Timestamp) -> Sample {
        timed(|obs| {
            self.record
                .send_observed(
                    send_req("cli-sender", &self.pop.recipient.1, "m"),
                    WAIT,
                    now,
                    &self.limits,
                    obs,
                )
                .unwrap();
        })
    }

    fn no_mail_claim(&self, now: Timestamp) -> Sample {
        let quiet = key(&self.pop.quiet);
        timed(|obs| {
            let held = self
                .record
                .hold_observed(WAIT, now, &self.limits, obs, |state, ids| {
                    state.claim(
                        &quiet,
                        Generation::FIRST,
                        Checkpoint::Stop,
                        now,
                        &self.limits,
                        ids,
                    )
                })
                .unwrap();
            assert!(!held.wrote, "a no-mail claim wrote");
        })
    }

    /// One message pending (sent untimed), then the drain's two holds.
    fn claim_finish(&self, now: Timestamp) -> Sample {
        self.record
            .send(
                send_req("cli-sender", &self.pop.recipient.1, "m"),
                WAIT,
                now,
                &self.limits,
            )
            .unwrap()
            .value
            .unwrap();
        let recipient = key(&self.pop.recipient.0);
        let generation = Generation::FIRST;
        let claim = timed(|obs| {
            let held = self
                .record
                .hold_observed(WAIT, now, &self.limits, obs, |state, ids| {
                    state.claim(
                        &recipient,
                        generation,
                        Checkpoint::Step,
                        now,
                        &self.limits,
                        ids,
                    )
                })
                .unwrap();
            let token = held.value.token.unwrap();
            self.record
                .hold(WAIT, now, &self.limits, |state, _| {
                    state.finish(&recipient, generation, &token, now)
                })
                .unwrap();
        });
        Sample {
            total: claim.total,
            steps: Vec::new(),
        }
    }

    fn registering(&self, now: Timestamp) -> Sample {
        timed(|obs| {
            self.record
                .hold_observed(WAIT, now, &self.limits, obs, |state, ids| {
                    Reported::changing(register(
                        state,
                        "newcomer",
                        "head-of-newcomer".into(),
                        now,
                        ids,
                    ))
                })
                .unwrap();
        })
    }
}

impl Drop for Bench {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

fn load() -> String {
    std::fs::read_to_string("/proc/loadavg")
        .map(|l| l.split_whitespace().take(3).collect::<Vec<_>>().join(" "))
        .unwrap_or_default()
}

/// One table row: totals, then each step's share (p50 of the time spent
/// between the previous step, or the call, and it), then the time after
/// the last step (the rest of the hold and the lock's release).
fn report(label: &str, samples: &[Sample], bytes: usize, headers: usize) {
    let mut totals: Vec<f64> = samples.iter().map(|s| s.total).collect();
    totals.sort_by(f64::total_cmp);
    let mut parts: Vec<(String, Vec<f64>)> = Vec::new();
    for s in samples {
        let mut last = 0.0;
        for (i, (step, at)) in s.steps.iter().enumerate() {
            let name = format!("{step:?}");
            if parts.len() <= i {
                parts.push((name.clone(), Vec::new()));
            }
            parts[i].1.push(at - last);
            last = *at;
        }
        let i = s.steps.len();
        if !s.steps.is_empty() {
            if parts.len() <= i {
                parts.push(("after".into(), Vec::new()));
            }
            parts[i].1.push(s.total - last);
        }
    }
    let split: Vec<String> = parts
        .into_iter()
        .map(|(name, mut v)| {
            v.sort_by(f64::total_cmp);
            format!("{name} {:.2}", pct(&v, 0.5))
        })
        .collect();
    println!(
        "| {label} | {headers} | {bytes} | {:.2} | {:.2} | {:.2} | {} | {} |",
        pct(&totals, 0.5),
        pct(&totals, 0.95),
        totals[totals.len() - 1],
        split.join(", "),
        load()
    );
}

fn background_sender(fgos_dir: &Path) -> ! {
    let record = Record::open(fgos_dir).unwrap();
    let limits = limits();
    let to = std::env::args().nth(3).unwrap();
    let mut i = 0u64;
    loop {
        let now = T0.plus_secs(i);
        let _ = record.send(send_req("cli-background", &to, "m"), WAIT, now, &limits);
        i += 1;
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.get(2).map(String::as_str) == Some(BACKGROUND) {
        background_sender(Path::new(&args[1]));
    }
    let parent = PathBuf::from(args.get(1).expect("usage: <parent-dir> [scenario|all]"));
    assert!(
        !parent.join(".fgos").exists(),
        "{} holds a .fgos; give a parent outside any project",
        parent.display()
    );
    let which = args.get(2).cloned().unwrap_or_else(|| "all".into());
    let run = |name: &str| which == "all" || which == name;
    println!("| scenario and hold | headers | snapshot bytes | p50 ms | p95 ms | max ms | p50 per step (ms) | load |");
    println!("|---|---|---|---|---|---|---|---|");
    if run("s0-one") {
        let b = Bench::new(&parent, "s0-one", &s0_one, limits());
        b.measure("s0-one send", Bench::send);
        b.measure("s0-one no-mail claim", Bench::no_mail_claim);
    }
    if run("s0-hundred") {
        let b = Bench::new(&parent, "s0-hundred", &s0_hundred, limits());
        b.measure("s0-hundred send", Bench::send);
        b.measure("s0-hundred no-mail claim", Bench::no_mail_claim);
    }
    if run("steady-one") {
        let b = Bench::new(&parent, "steady-one", &steady_one, limits());
        b.measure("steady-one send", Bench::send);
        b.measure("steady-one no-mail claim", Bench::no_mail_claim);
        b.measure("steady-one claim+finish", Bench::claim_finish);
    }
    if run("steady-grid") {
        for heads in [1, 10, 100] {
            let b = Bench::new(&parent, "steady-grid", &steady_grid(heads), limits());
            b.measure(
                &format!("steady-grid {heads} heads no-mail claim"),
                Bench::no_mail_claim,
            );
        }
    }
    if run("dead-bindings") {
        let b = Bench::new(&parent, "dead-bindings", &dead_bindings, limits());
        b.measure("dead-bindings registering", Bench::registering);
        b.measure("dead-bindings claim+finish", Bench::claim_finish);
        b.measure("dead-bindings send", Bench::send);
    }
    if run("contended") {
        let b = Bench::new(&parent, "contended", &s0_one, limits());
        let mut other = Command::new(std::env::current_exe().unwrap())
            .arg(b.paths().fgos_dir())
            .arg(BACKGROUND)
            .arg(&b.pop.recipient.1)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .spawn()
            .unwrap();
        // The background sender's writes change the snapshot, so this row
        // measures against a growing record and does not restore it.
        let mut samples = Vec::new();
        for i in 0..WARMUP + RUNS {
            let s = b.no_mail_claim(b.now(i));
            if i >= WARMUP {
                samples.push(s);
            }
        }
        other.kill().unwrap();
        other.wait().unwrap();
        report(
            "contended no-mail claim (Locked = acquire)",
            &samples,
            b.baseline.len(),
            b.headers(),
        );
    }
}
