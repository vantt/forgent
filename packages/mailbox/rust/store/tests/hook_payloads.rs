//! The payload suite of rung V3: the drain over each CLI's recorded hook
//! payloads (packages/mailbox/contracts/fixtures/hooks/<cli>/). Every input
//! is real: recorded payloads, the writer key derived through session
//! identity from the recorded environment, this test process's own
//! process record standing in for a live head, contract limits and the
//! shared id source. Only a CLI the adapters contract lists as tested is
//! drained; the rest must stay quiet.
mod common;

use common::{
    contracts_dir, files, fixture, hook_limits, limits, vector_input, vectors, SeqIds, ADAPTERS,
    ADAPTERS_CONTRACT,
};
use fgos_mailbox::adapters::TestedClis;
use fgos_mailbox::hook::{
    begin, finish, render_reply, Adapter, Begun, Claimed, HeadFacts, HookCall, HookEvent,
    HookLimits, QuietReason,
};
use fgos_mailbox_core::Cli;
use fgos_mailbox_core::{
    Generation, MailboxState, MessageId, MessageState, RegisterRefusal, RegisterRequest,
    SendRequest, Timestamp, WriterKey,
};
use fgos_process::facts::{identity_of, self_identity, Record};
use fgos_process::ProcId;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::process::{Child, Command};

const PROJECT: &str = "forgent";

fn t(secs: u64) -> Timestamp {
    Timestamp::from_millis(secs * 1000)
}

fn tested() -> Vec<Adapter> {
    ADAPTERS
        .into_iter()
        .filter(|a| TestedClis::embedded().contains(*a))
        .collect()
}

/// The tested CLIs whose Stop takes mail.
fn stop_draining() -> Vec<Adapter> {
    tested().into_iter().filter(|a| stop_delivers(*a)).collect()
}

fn stop_delivers(adapter: Adapter) -> bool {
    TestedClis::embedded()
        .facts(adapter)
        .is_some_and(|facts| facts.stop_delivers)
}

/// The quiet reason of a head's Stop with nothing to take.
fn quiet_stop(adapter: Adapter) -> QuietReason {
    if stop_delivers(adapter) {
        QuietReason::NothingEligible
    } else {
        QuietReason::StopChannelOff
    }
}

/// The writer key session identity derives from recorded id variables, if
/// any is set.
fn key_from(vars: &Value) -> Option<WriterKey> {
    let lookup = |name: &str| vars[name].as_str().map(String::from);
    let identity = fgos_identity::env_identity(&lookup, None)?;
    Some(WriterKey::new(identity.id.to_string()).unwrap())
}

/// The head's writer key: the one its tool processes derive, which is the
/// key `send` uses. Claude Code's hook sees the same variable; Codex's hook
/// sees none, so its shell must take the key from elsewhere (V5).
fn writer_of(adapter: Adapter) -> WriterKey {
    key_from(&fixture(adapter, files::ENV)["toolIdVars"])
        .expect("the recorded tool saw a session id")
}

fn own_record() -> Record {
    self_identity().unwrap().to_record()
}

/// A drain harness over one CLI: the snapshot, the bodies the store would
/// hold, and the head's facts.
struct Drain {
    adapter: Adapter,
    state: MailboxState,
    bodies: BTreeMap<MessageId, String>,
    ids: SeqIds,
    writer: WriterKey,
    head: HeadFacts,
    tested: TestedClis,
    /// The hook's limits as the loader yields them.
    hook_limits: HookLimits,
    /// The CLIs whose Stop drains, as `send` passes them to the core.
    stop_drains: BTreeSet<Cli>,
    now: u64,
}

impl Drain {
    fn new(adapter: Adapter) -> Self {
        Self {
            adapter,
            state: MailboxState::new(),
            bodies: BTreeMap::new(),
            ids: SeqIds::default(),
            writer: writer_of(adapter),
            head: HeadFacts {
                record: own_record(),
                own_suffix: Some("2b".to_string()),
                handle: None,
            },
            tested: TestedClis::embedded().clone(),
            hook_limits: hook_limits(),
            stop_drains: TestedClis::embedded().stop_drains(),
            now: 100,
        }
    }

    fn tick(&mut self) -> Timestamp {
        self.now += 1;
        t(self.now)
    }

    /// One of the head's own hook calls with the recorded payload `file`.
    /// The fixtures come from separate recording runs, each with its own
    /// session, so the payload's `session_id` is set to this head's writer
    /// key, as the head's own events carry it.
    fn hook(&mut self, event: HookEvent, file: &str) -> Begun {
        let mut payload = fixture(self.adapter, file);
        if payload.get("session_id").is_some() {
            payload["session_id"] = Value::from(self.writer.as_str());
        }
        let stdin = serde_json::to_vec(&payload).unwrap();
        self.hook_bytes(event, &stdin)
    }

    /// One hook call with exactly these bytes. Every call checks that the
    /// result's `state_changed` says whether the snapshot changed.
    fn hook_bytes(&mut self, event: HookEvent, stdin: &[u8]) -> Begun {
        let before = self.state.clone();
        let now = self.tick();
        let call = HookCall {
            adapter: self.adapter,
            event,
            stdin,
            writer: self.writer.clone(),
            project: PROJECT,
            head: self.head.clone(),
        };
        let begun = begin(
            &mut self.state,
            &call,
            now,
            &limits(),
            &self.hook_limits,
            &self.tested,
            &mut self.ids,
        );
        assert_eq!(
            begun.state_changed(),
            self.state != before,
            "state_changed is wrong for {begun:?}"
        );
        begun
    }

    fn name(&self) -> String {
        self.state.binding(&self.writer).unwrap().name.to_string()
    }

    /// Registers a peer head `key` (another process) that can send.
    fn add_peer(&mut self, key: &str) {
        let now = self.tick();
        self.state
            .register(
                RegisterRequest {
                    key: WriterKey::new(key).unwrap(),
                    cli: fgos_mailbox_core::Cli::new("codex").unwrap(),
                    project: PROJECT.to_string(),
                    own_suffix: None,
                    head: format!("peer-process-{key}"),
                    handle: None,
                },
                None,
                now,
                &limits(),
                &mut self.ids,
            )
            .unwrap();
    }

    /// A peer sends to the head; wake mail must take effect when the head's
    /// CLI takes mail at its Stop.
    fn send(&mut self, from: &str, body: &str, wake: bool) -> MessageId {
        let now = self.tick();
        let to = self.name();
        let outcome = self
            .state
            .send(
                SendRequest {
                    from: WriterKey::new(from).unwrap(),
                    to: fgos_mailbox_core::Recipient::Name(to),
                    body,
                    wake,
                    reply_to: None,
                    dead_keys: Default::default(),
                    stop_drains: self.stop_drains.clone(),
                },
                now,
                &limits(),
                &mut self.ids,
            )
            .unwrap();
        assert_eq!(
            outcome.effective_wake,
            wake && outcome.to_stop_drains,
            "the wake must take effect"
        );
        self.bodies.insert(outcome.id.clone(), body.to_string());
        outcome.id
    }

    /// The shell after a claim: render, write (here: return), finish.
    fn deliver(&mut self, claimed: &Claimed) -> String {
        let bodies = self.bodies.clone();
        let reply = render_reply(
            claimed,
            &|id| bodies.get(id).cloned(),
            &|_, _, _| None,
            &limits(),
        );
        let now = self.tick();
        finish(&mut self.state, claimed.ticket(), now);
        reply.stdout
    }

    fn stop_blocks(&self) -> u32 {
        self.state.binding(&self.writer).unwrap().stop_blocks
    }

    fn state_of(&self, id: &MessageId) -> MessageState {
        self.state.message(id).unwrap().state.clone()
    }

    /// The head is registered by its first hook, with nothing pending.
    fn registered(adapter: Adapter) -> Self {
        let mut drain = Self::new(adapter);
        let first = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        assert_eq!(first, quiet(QuietReason::NothingEligible));
        drain
    }
}

/// A quiet result with `reason`, whatever it did to the state (each call's
/// `state_changed` is checked by the harness).
#[derive(Debug)]
struct Quiet(QuietReason);

fn quiet(reason: QuietReason) -> Quiet {
    Quiet(reason)
}

impl PartialEq<Quiet> for Begun {
    fn eq(&self, other: &Quiet) -> bool {
        matches!(self, Begun::Quiet { reason, .. } if *reason == other.0)
    }
}

fn take(begun: Begun) -> Claimed {
    match begun {
        Begun::Claimed(claimed) => claimed,
        other => panic!("expected a claim, got {other:?}"),
    }
}

/// The CLI's recorded accepted output with `text` in place of `{{TEXT}}`.
fn accepted(adapter: Adapter, file: &str, text: &str) -> Value {
    let mut value = fixture(adapter, file);
    fn fill(value: &mut Value, text: &str) {
        match value {
            Value::String(s) if s == "{{TEXT}}" => *s = text.to_string(),
            Value::Object(map) => map.values_mut().for_each(|v| fill(v, text)),
            _ => {}
        }
    }
    fill(&mut value, text);
    value
}

fn frames_of(claimed: &Claimed, bodies: &BTreeMap<MessageId, String>) -> String {
    claimed
        .items
        .iter()
        .map(|item| {
            fgos_mailbox_core::render(item, bodies.get(&item.id).map(String::as_str), &limits())
        })
        .collect::<Vec<_>>()
        .join("\n\n")
}

/// A child process the test owns; killed and reaped when dropped.
struct Sleeper(Child);

impl Sleeper {
    fn start() -> Self {
        Self(Command::new("sleep").arg("30").spawn().unwrap())
    }

    fn record(&self) -> Record {
        identity_of(ProcId(self.0.id())).unwrap().to_record()
    }

    fn end(mut self) {
        self.0.kill().unwrap();
        self.0.wait().unwrap();
    }
}

impl Drop for Sleeper {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[test]
fn a_recorded_post_tool_use_offers_pending_mail_in_the_shape_the_cli_injected() {
    assert!(!tested().is_empty(), "no CLI is tested");
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let id = drain.send("peer", "hello from a peer", false);

        let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        let frames = frames_of(&claimed, &drain.bodies);
        let stdout = drain.deliver(&claimed);

        let out: Value = serde_json::from_str(&stdout).unwrap();
        assert_eq!(
            out,
            accepted(adapter, files::ACCEPTED_POST_TOOL_USE, &frames)
        );
        assert!(frames.contains("| hello from a peer"));
        assert_eq!(
            drain.stop_blocks(),
            0,
            "only a Stop delivery counts as a Stop block"
        );
        assert!(matches!(drain.state_of(&id), MessageState::Offered { .. }));
    }
}

#[test]
fn a_recorded_stop_blocks_with_wake_mail_and_passes_without_it() {
    assert!(!stop_draining().is_empty(), "no CLI drains at Stop");
    for adapter in stop_draining() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        drain.send("peer", "wake up", true);

        let claimed = take(drain.hook(HookEvent::Stop, files::STOP));
        let frames = frames_of(&claimed, &drain.bodies);
        let stdout = drain.deliver(&claimed);
        let out: Value = serde_json::from_str(&stdout).unwrap();
        assert_eq!(out, accepted(adapter, files::ACCEPTED_STOP, &frames));
        assert_eq!(drain.stop_blocks(), 1);

        let plain = drain.send("peer", "read me later", false);
        assert_eq!(
            drain.hook(HookEvent::Stop, files::STOP_CONTINUED),
            quiet(QuietReason::NothingEligible)
        );
        assert_eq!(drain.state_of(&plain), MessageState::Recorded);
        assert_eq!(drain.stop_blocks(), 0, "a Stop that passes ends the run");
        // Again with the count already at zero: the drain still swept and
        // stamped the pending mail, and the harness checks it says so.
        let again = drain.hook(HookEvent::Stop, files::STOP_CONTINUED);
        assert_eq!(again, quiet(QuietReason::NothingEligible));
        assert!(again.state_changed());
        let next = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(next.items[0].id, plain);
    }
}

#[test]
fn inputs_that_cannot_be_a_head_event_are_quiet_and_change_nothing() {
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        drain.send("peer", "pending", false);
        let before = drain.state.clone();

        for vector in vectors(adapter, "parse") {
            let Some(reason) = vector["expect"]["unparsed"].as_str() else {
                continue;
            };
            let expected = match reason {
                "malformed" => QuietReason::Malformed,
                _ => QuietReason::EventMismatch,
            };
            let event = common::event(&vector["event"]);
            let begun = drain.hook_bytes(event, &vector_input(adapter, &vector));
            assert_eq!(begun, quiet(expected), "{}", vector["name"]);
            assert_eq!(drain.state, before, "{} changed the state", vector["name"]);
        }

        drain.head.record.start_time = None;
        let begun = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        assert_eq!(begun, quiet(QuietReason::HeadUnknown));
        assert_eq!(drain.state, before);
    }
}

#[test]
fn a_subagent_event_takes_nothing_and_the_head_gets_the_mail_next() {
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let id = drain.send("peer", "for the head only", false);
        let before = drain.state.clone();

        // pi has no subagent tool, so it has no recorded subagent payload;
        // its synthesized `agent-` vectors carry the marker.
        let recorded = common::fixture_dir(adapter).join(files::POST_TOOL_USE_SUBAGENT);
        let mut subordinate: Vec<Vec<u8>> = if recorded.is_file() {
            vec![serde_json::to_vec(&fixture(adapter, files::POST_TOOL_USE_SUBAGENT)).unwrap()]
        } else {
            Vec::new()
        };
        for vector in vectors(adapter, "parse") {
            if vector["name"].as_str().unwrap().starts_with("agent-") {
                subordinate.push(vector_input(adapter, &vector));
            }
        }
        for stdin in &subordinate {
            let begun = drain.hook_bytes(HookEvent::PostToolUse, stdin);
            assert_eq!(begun, quiet(QuietReason::Subordinate));
            assert_eq!(drain.state, before);
        }

        let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(claimed.items.len(), 1);
        assert_eq!(claimed.items[0].id, id);
    }
}

#[test]
fn the_first_hook_registers_the_head_at_generation_one() {
    for adapter in tested() {
        let drain = Drain::registered(adapter);
        let binding = drain.state.binding(&drain.writer).unwrap();
        assert_eq!(binding.generation, Generation::FIRST);
        assert_eq!(
            binding.name.as_str(),
            format!("{PROJECT}-{}-2b", adapter.word())
        );
    }
}

#[test]
fn a_stored_dead_head_is_replaced_and_its_old_mail_never_offered() {
    for adapter in tested() {
        let mut drain = Drain::new(adapter);
        let dead = Sleeper::start();
        drain.head.record = dead.record();
        assert_eq!(
            drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE),
            quiet(QuietReason::NothingEligible)
        );
        drain.add_peer("peer");
        let old = drain.send("peer", "for the dead process", false);
        dead.end();

        drain.head.record = own_record();
        assert_eq!(
            drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE),
            quiet(QuietReason::NothingEligible)
        );
        let binding = drain.state.binding(&drain.writer).unwrap();
        assert_eq!(binding.generation, Generation::FIRST.next().unwrap());
        assert_eq!(drain.state_of(&old), MessageState::Recorded);
    }
}

#[test]
fn a_different_live_head_holding_the_key_is_not_drained_and_nothing_changes() {
    for adapter in tested() {
        let mut drain = Drain::new(adapter);
        let live = Sleeper::start();
        drain.head.record = live.record();
        drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        drain.add_peer("peer");
        drain.send("peer", "for the live holder", false);
        let before = drain.state.clone();

        drain.head.record = own_record();
        assert_eq!(
            drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE),
            quiet(QuietReason::Registration(RegisterRefusal::Conflict))
        );
        assert_eq!(drain.state, before);
        live.end();
    }
}

#[test]
fn a_same_head_hook_with_no_mail_changes_nothing() {
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        let before = drain.state.clone();
        for (event, file) in [
            (HookEvent::PostToolUse, files::POST_TOOL_USE),
            (HookEvent::Stop, files::STOP),
            (HookEvent::Stop, files::STOP_CONTINUED),
        ] {
            let expected = match event {
                HookEvent::Stop => quiet_stop(adapter),
                HookEvent::PostToolUse => QuietReason::NothingEligible,
            };
            assert_eq!(drain.hook(event, file), quiet(expected));
            assert_eq!(drain.state, before, "{file} wrote on the no-mail path");
        }
    }
}

#[test]
fn stop_blocks_at_most_the_configured_times_in_a_row_counting_only_finished_blocks() {
    let max = hook_limits().stop_block.max;
    for adapter in stop_draining() {
        let mut drain = Drain::registered(adapter);
        let mut senders = 0;
        let mut wake_from_a_new_sender = |drain: &mut Drain| {
            senders += 1;
            let peer = format!("peer-{senders}");
            drain.add_peer(&peer);
            drain.send(&peer, "wake up", true)
        };

        for done in 1..=max {
            wake_from_a_new_sender(&mut drain);
            let claimed = take(drain.hook(HookEvent::Stop, files::STOP_CONTINUED));
            drain.deliver(&claimed);
            assert_eq!(drain.stop_blocks(), done);
        }
        let held = wake_from_a_new_sender(&mut drain);
        assert_eq!(
            drain.hook(HookEvent::Stop, files::STOP_CONTINUED),
            quiet(QuietReason::StopBlockCap)
        );
        assert_eq!(drain.state_of(&held), MessageState::Recorded);
        assert_eq!(drain.stop_blocks(), 0);

        // Claimed but never finished: the shell's write failed.
        let unfinished = take(drain.hook(HookEvent::Stop, files::STOP_CONTINUED));
        assert_eq!(unfinished.items[0].id, held);
        assert_eq!(drain.stop_blocks(), 0, "only finished blocks count");

        // A count left over from an interrupted turn is reset by the turn's
        // first Stop.
        let mut drain = Drain::registered(adapter);
        for _ in 0..max {
            wake_from_a_new_sender(&mut drain);
            let claimed = take(drain.hook(HookEvent::Stop, files::STOP_CONTINUED));
            drain.deliver(&claimed);
        }
        wake_from_a_new_sender(&mut drain);
        let claimed = take(drain.hook(HookEvent::Stop, files::STOP));
        drain.deliver(&claimed);
        assert_eq!(drain.stop_blocks(), 1);
    }
}

#[test]
fn a_missing_body_is_framed_honestly_and_the_rest_of_the_claim_is_delivered() {
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let kept = drain.send("peer", "this one is readable", false);
        let lost = drain.send("peer", "this one is lost", false);
        drain.bodies.remove(&lost);

        let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(claimed.items.len(), 2);
        let stdout = drain.deliver(&claimed);

        assert!(stdout.contains("| this one is readable"));
        assert!(stdout.contains("The text of this message could not be read"));
        assert!(!stdout.contains("this one is lost"));
        for id in [kept, lost] {
            assert!(matches!(drain.state_of(&id), MessageState::Offered { .. }));
        }
    }
}

#[test]
fn the_writer_key_the_hook_derives_equals_the_one_its_tool_sees() {
    for adapter in tested() {
        let env = fixture(adapter, files::ENV);
        let from_tool = writer_of(adapter);
        let payload = fixture(adapter, files::POST_TOOL_USE);
        assert_eq!(payload["session_id"].as_str(), Some(from_tool.as_str()));
        match key_from(&env["hookIdVars"][files::POST_TOOL_USE]) {
            Some(from_hook) => assert_eq!(from_hook, from_tool, "{}", adapter.word()),
            // Recorded: the hook processes of Codex, and of pi's and omp's
            // extension, see no identity variable, so the hook cannot
            // derive the key from its environment.
            None => assert!(
                matches!(adapter, Adapter::Codex | Adapter::Pi | Adapter::Omp),
                "{}",
                adapter.word()
            ),
        }
    }
}

#[test]
fn the_codex_thread_becomes_the_binding_handle() {
    let drain = Drain::registered(Adapter::Codex);
    let binding = drain.state.binding(&drain.writer).unwrap();
    assert_eq!(binding.handle.as_deref(), Some(drain.writer.as_str()));
}

#[test]
fn a_payload_naming_another_session_changes_nothing_and_the_head_keeps_its_name() {
    for adapter in tested() {
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let id = drain.send("peer", "for the head only", false);
        let name = drain.name();
        let head_payload = {
            let mut payload = fixture(adapter, files::POST_TOOL_USE);
            payload["session_id"] = Value::from(drain.writer.as_str());
            serde_json::to_vec(&payload).unwrap()
        };
        let before = drain.state.clone();
        let real = drain.writer.clone();

        // Another writer key from the same head process, with the head's
        // own payload: the payload names the head's session, not this key.
        drain.writer = WriterKey::new("forged-key").unwrap();
        let begun = drain.hook_bytes(HookEvent::PostToolUse, &head_payload);

        assert_eq!(begun, quiet(QuietReason::WriterMismatch));
        assert_eq!(drain.state, before);
        drain.writer = real;
        assert_eq!(drain.name(), name);
        let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(claimed.items[0].id, id);
    }
}

#[test]
fn a_head_started_as_an_agent_is_registered_and_drained() {
    let mut drain = Drain::new(Adapter::Claude);
    assert_eq!(
        drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE_AGENT_HEAD),
        quiet(QuietReason::NothingEligible)
    );
    drain.add_peer("peer");
    let id = drain.send("peer", "for an agent head", true);
    let claimed = take(drain.hook(HookEvent::Stop, files::STOP_AGENT_HEAD));
    assert_eq!(claimed.items[0].id, id);
}

#[test]
fn the_state_changed_flag_says_when_the_snapshot_must_be_written() {
    for adapter in tested() {
        let mut drain = Drain::new(adapter);
        let first = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        assert!(first.state_changed(), "the first hook registers the head");
        let again = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        assert_eq!(again, quiet(QuietReason::NothingEligible));
        assert!(
            !again.state_changed(),
            "a registered head with no mail writes nothing"
        );
    }
}

#[test]
fn a_cli_missing_from_the_tested_list_is_quiet_and_changes_nothing() {
    for adapter in tested() {
        let text = std::fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
        let mut contract: Value = serde_json::from_str(&text).unwrap();
        contract["testedAgainst"]
            .as_array_mut()
            .unwrap()
            .retain(|entry| entry["cli"] != adapter.word());
        contract["hookFacts"]
            .as_object_mut()
            .unwrap()
            .remove(adapter.word());
        let mut drain = Drain::new(adapter);
        drain.tested = TestedClis::from_contract(&contract.to_string()).unwrap();
        for (event, file) in [
            (HookEvent::PostToolUse, files::POST_TOOL_USE),
            (HookEvent::Stop, files::STOP),
        ] {
            assert_eq!(drain.hook(event, file), quiet(QuietReason::Untested));
            assert_eq!(drain.state, MailboxState::new());
        }
    }
}

/// The text of a `PostToolUse` reply, in the shape the CLI injects: the
/// `additionalContext` of Claude Code and Codex, the `inject` of the pi/omp
/// extension.
fn context_of(stdout: &str) -> String {
    let out: Value = serde_json::from_str(stdout).unwrap();
    out["hookSpecificOutput"]["additionalContext"]
        .as_str()
        .or_else(|| out["inject"].as_str())
        .unwrap()
        .to_string()
}

fn step_bound(adapter: Adapter) -> u64 {
    TestedClis::embedded()
        .facts(adapter)
        .and_then(|facts| facts.post_tool_use_max_bytes)
        .expect("every drained CLI has a measured step bound")
}

#[test]
fn a_step_drain_takes_what_fits_its_cli_bound_and_ends_with_the_pointer_for_the_rest() {
    for adapter in tested() {
        let bound = step_bound(adapter);
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        // Its worst case alone is far over any bound: 5 + 2 bytes a body byte.
        let big_body = "x".repeat(bound as usize);
        let big = drain.send("peer", &big_body, false);
        let small = drain.send("peer", "small and later", false);

        let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(
            claimed
                .items
                .iter()
                .map(|i| i.id.clone())
                .collect::<Vec<_>>(),
            vec![small.clone()]
        );
        assert_eq!(claimed.too_large, 1);
        let stdout = drain.deliver(&claimed);

        let context = context_of(&stdout);
        assert!(
            context.len() as u64 <= bound,
            "{adapter:?}: {} > {bound}",
            context.len()
        );
        assert!(context.contains("| small and later"));
        assert!(
            context.ends_with(&fgos_mailbox_core::too_large_pointer(1)),
            "{adapter:?}: the reply ends with the pointer line"
        );
        assert!(matches!(
            drain.state_of(&small),
            MessageState::Offered { .. }
        ));
        assert_eq!(drain.state_of(&big), MessageState::Recorded);
    }
}

#[test]
fn a_step_drain_with_only_too_large_mail_prints_the_pointer_alone_and_finishes_nothing() {
    for adapter in tested() {
        let bound = step_bound(adapter);
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let big = drain.send("peer", &"x".repeat(bound as usize), false);

        let begun = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        let Begun::Pointer(pointer) = begun else {
            panic!("{adapter:?}: expected the pointer alone, got {begun:?}");
        };
        assert_eq!(pointer.count, 1);
        let stdout = pointer.reply().stdout;
        assert_eq!(
            serde_json::from_str::<Value>(&stdout).unwrap(),
            accepted(
                adapter,
                files::ACCEPTED_POST_TOOL_USE,
                &fgos_mailbox_core::too_large_pointer(1)
            )
        );
        let header = drain.state.message(&big).unwrap();
        assert_eq!(header.state, MessageState::Recorded);
        assert_eq!(header.offers, 0);
    }
}

#[test]
fn a_too_large_wake_message_is_still_taken_by_a_stop_drain() {
    for adapter in stop_draining() {
        let bound = step_bound(adapter);
        let mut drain = Drain::registered(adapter);
        drain.add_peer("peer");
        let big = drain.send("peer", &"x".repeat(bound as usize), true);

        let claimed = take(drain.hook(HookEvent::Stop, files::STOP));
        assert_eq!(
            claimed
                .items
                .iter()
                .map(|i| i.id.clone())
                .collect::<Vec<_>>(),
            vec![big]
        );
        assert_eq!(claimed.too_large, 0);
    }
}

#[test]
fn a_cli_without_a_measured_step_bound_drains_nothing_at_post_tool_use_and_keeps_its_mail() {
    for adapter in tested() {
        let text = std::fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
        let mut contract: Value = serde_json::from_str(&text).unwrap();
        contract["hookFacts"][adapter.word()]["postToolUseContextMaxBytes"] = Value::Null;
        contract["hookFacts"][adapter.word()]["channels"]["postToolUse"]["deliver"] =
            Value::from(false);
        let mut drain = Drain::new(adapter);
        drain.tested = TestedClis::from_contract(&contract.to_string()).unwrap();
        let first = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
        assert_eq!(first, quiet(QuietReason::NoStepBound));
        assert!(
            first.state_changed(),
            "the first hook still registers the head"
        );
        drain.add_peer("peer");
        let id = drain.send("peer", "waits for stop", false);

        assert_eq!(
            drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE),
            quiet(QuietReason::NoStepBound)
        );
        assert_eq!(drain.state_of(&id), MessageState::Recorded);
    }
}

#[test]
fn a_codex_stop_with_eligible_wake_mail_claims_nothing_and_is_quiet_stop_channel_off() {
    let mut drain = Drain::registered(Adapter::Codex);
    drain.add_peer("peer");
    // Recorded while Codex's Stop still drained, so it carries an
    // effective wake and would be eligible at a Stop.
    drain.stop_drains.insert(Cli::new("codex").unwrap());
    let id = drain.send("peer", "wake up", true);
    let before = drain.state.clone();

    for file in [files::STOP, files::STOP_CONTINUED] {
        let begun = drain.hook(HookEvent::Stop, file);
        assert_eq!(begun, quiet(QuietReason::StopChannelOff), "{file}");
        assert!(!begun.state_changed(), "{file}");
        assert_eq!(drain.state, before, "{file} touched the record");
    }
    assert_eq!(drain.state_of(&id), MessageState::Recorded);
    let next = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    assert_eq!(next.items[0].id, id, "the next tool call takes it");
}

#[test]
fn a_first_codex_stop_registers_the_head_and_claims_nothing() {
    let mut drain = Drain::new(Adapter::Codex);
    let begun = drain.hook(HookEvent::Stop, files::STOP);
    assert_eq!(begun, quiet(QuietReason::StopChannelOff));
    assert!(begun.state_changed(), "the Stop registered the head");
    let binding = drain.state.binding(&drain.writer).unwrap();
    assert_eq!(binding.generation, Generation::FIRST);
    assert_eq!(binding.stop_blocks, 0);
}

#[test]
fn a_codex_binding_that_already_holds_stop_blocks_answers_stop_channel_off_and_keeps_its_count() {
    let max = hook_limits().stop_block.max;
    let mut drain = Drain::registered(Adapter::Codex);
    // Counted while Codex's Stop still drained.
    let generation = drain.state.binding(&drain.writer).unwrap().generation;
    for _ in 0..max {
        drain.state.note_stop(&drain.writer, generation, true);
    }
    let before = drain.state.clone();
    for file in [files::STOP, files::STOP_CONTINUED] {
        assert_eq!(
            drain.hook(HookEvent::Stop, file),
            quiet(QuietReason::StopChannelOff),
            "{file}"
        );
    }
    assert_eq!(drain.stop_blocks(), max, "neither reset nor capped");
    assert_eq!(drain.state, before);
}

#[test]
fn a_frame_shows_the_handle_derived_at_render_from_the_senders_key_cli_and_stored_head() {
    let mut drain = Drain::registered(Adapter::Claude);
    // A peer whose binding stores a real head process of its own.
    let now = drain.tick();
    let peer = Sleeper::start();
    let peer_head = peer.record();
    drain
        .state
        .register(
            RegisterRequest {
                key: WriterKey::new("peer").unwrap(),
                cli: fgos_mailbox_core::Cli::new("codex").unwrap(),
                project: PROJECT.to_string(),
                own_suffix: None,
                head: fgos_mailbox::head::head_text(&peer_head),
                handle: None,
            },
            None,
            now,
            &limits(),
            &mut drain.ids,
        )
        .unwrap();
    drain.send("peer", "hello", false);
    let claimed = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    // The derivation gets the head the binding stores, as Identity's door takes it.
    let handle_of = |key: &WriterKey, cli: &Cli, head: Option<&Record>| {
        assert_eq!(
            head,
            Some(&peer_head),
            "the sender's stored head reaches the derivation"
        );
        Some(format!("{}-{}@fg-test", cli.as_str(), key.as_str()))
    };

    let reply = render_reply(&claimed, &|_| None, &handle_of, &limits());

    let context = context_of(&reply.stdout);
    assert!(
        context.contains(" handle=\"codex-peer@fg-test\" "),
        "{context}"
    );
    let snapshot = serde_json::to_string(&drain.state).unwrap();
    assert!(!snapshot.contains("@fg-test"), "the handle is never stored");
}

fn pointer_of(begun: Begun) -> fgos_mailbox::hook::PointerOnly {
    match begun {
        Begun::Pointer(pointer) => pointer,
        other => panic!("expected the pointer line alone, got {other:?}"),
    }
}

#[test]
fn a_repeating_pointer_stamps_the_last_drain_once_per_new_mail_and_writes_nothing_on_later_calls() {
    // Mail too large for the step: the pointer is all the drain prints.
    let too_large = "x".repeat(step_bound(Adapter::Codex) as usize);
    let (mut drain, body) = (Drain::registered(Adapter::Codex), too_large);
    drain.add_peer("peer");
    drain.send("peer", &body, false);

    let first = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
    assert!(first.state_changed(), "the first pointer stamps the drain");
    let stamp = drain.state.binding(&drain.writer).unwrap().last_drain_at;
    assert!(stamp.is_some());
    for _ in 0..3 {
        let again = pointer_of(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
        assert_eq!(again.count, 1);
        assert!(
            !Begun::Pointer(again).state_changed(),
            "a repeated pointer writes nothing"
        );
    }

    drain.send("peer", &body, false);
    let after_new = pointer_of(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    assert_eq!(after_new.count, 2);
    assert!(
        Begun::Pointer(after_new).state_changed(),
        "new mail is stamped once"
    );
    assert!(drain.state.binding(&drain.writer).unwrap().last_drain_at > stamp);
    assert!(!drain
        .hook(HookEvent::PostToolUse, files::POST_TOOL_USE)
        .state_changed());
}

#[test]
fn a_claim_left_in_flight_beside_too_large_mail_is_offered_again_once_its_deadline_passed() {
    let bound = step_bound(Adapter::Codex);
    let mut drain = Drain::registered(Adapter::Codex);
    drain.add_peer("peer");
    drain.send("peer", &"x".repeat(bound as usize), false);
    let small = drain.send("peer", "small", false);
    // Claimed, but its write failed, so it was never finished.
    let first = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    assert_eq!(
        first.items.iter().map(|i| i.id.clone()).collect::<Vec<_>>(),
        vec![small.clone()]
    );
    assert!(matches!(
        drain.state_of(&small),
        MessageState::InFlight { .. }
    ));

    drain.now += limits().in_flight_ttl_sec + 1;
    let again = take(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    assert_eq!(
        again
            .items
            .iter()
            .map(|i| (i.id.clone(), i.attempt))
            .collect::<Vec<_>>(),
        vec![(small, 2)]
    );
    assert_eq!(again.too_large, 1);
}

#[test]
fn a_pointer_call_past_a_messages_record_ttl_refuses_it_writes_once_and_then_changes_nothing() {
    let too_large = "x".repeat(step_bound(Adapter::Codex) as usize);
    let (mut drain, body) = (Drain::registered(Adapter::Codex), too_large);
    drain.add_peer("peer");
    let id = drain.send("peer", &body, false);
    let first = pointer_of(drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE));
    assert!(Begun::Pointer(first).state_changed());

    // Ignored past the record TTL: the next pointer call runs the sweep.
    drain.now += limits().record.ttl_sec + 1;
    let late = drain.hook(HookEvent::PostToolUse, files::POST_TOOL_USE);
    assert!(late.state_changed(), "the due refusal is written");
    assert!(matches!(
        drain.state_of(&id),
        MessageState::Refused {
            reason: fgos_mailbox_core::RefusalReason::RecordTtl,
            ..
        }
    ));
    assert!(!drain
        .hook(HookEvent::PostToolUse, files::POST_TOOL_USE)
        .state_changed());
}
