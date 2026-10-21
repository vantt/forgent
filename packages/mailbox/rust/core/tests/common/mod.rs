#![allow(dead_code)]
use fgos_mailbox_core::Limits;
use serde_json::{Map, Value};

/// The limits contract, the only place the core's starting values live.
pub const LIMITS_CONTRACT: &str = include_str!("../../../../contracts/limits.v1.json");

pub fn limits_contract() -> Value {
    serde_json::from_str(LIMITS_CONTRACT).expect("the limits contract is valid JSON")
}

/// Folds the contract's dotted keys into the nested `mailbox` config section,
/// the shape a configuration reader hands to `Limits`.
pub fn config_section(contract: &Value) -> Value {
    let mut section = Map::new();
    for entry in contract["keys"]
        .as_array()
        .expect("contract has a keys list")
    {
        let key = entry["key"].as_str().expect("every key is a string");
        let path = key
            .strip_prefix("mailbox.")
            .expect("every key lives in the mailbox section");
        let mut node = &mut section;
        let mut parts = path.split('.').peekable();
        while let Some(part) = parts.next() {
            if parts.peek().is_none() {
                node.insert(part.to_string(), entry["default"].clone());
            } else {
                node = node
                    .entry(part.to_string())
                    .or_insert_with(|| Value::Object(Map::new()))
                    .as_object_mut()
                    .expect("a dotted prefix is an object");
            }
        }
    }
    Value::Object(section)
}

/// The limits as the contract states them.
pub fn spec_limits() -> Limits {
    serde_json::from_value(config_section(&limits_contract()))
        .expect("the contract fills every Limits field")
}

use fgos_mailbox_core::{
    Cli, IdSource, MailboxState, RegisterRequest, Registered, StoredHead, Timestamp, WriterKey,
};

/// A counter id source: 1, 2, 3 … A real implementation of the port.
#[derive(Debug, Default)]
pub struct SeqIds {
    last: u64,
}

impl IdSource for SeqIds {
    fn next_u64(&mut self) -> u64 {
        self.last += 1;
        self.last
    }
}

/// A point in time `secs` seconds after the epoch.
pub fn t(secs: u64) -> Timestamp {
    Timestamp::from_millis(secs * 1000)
}

pub fn key(text: &str) -> WriterKey {
    WriterKey::new(text).unwrap()
}

pub fn cli(text: &str) -> Cli {
    Cli::new(text).unwrap()
}

/// A registration in project `forgent` for the head `head`.
pub fn request(
    key_text: &str,
    cli_text: &str,
    own_suffix: Option<&str>,
    head: &str,
) -> RegisterRequest {
    RegisterRequest {
        key: key(key_text),
        cli: cli(cli_text),
        project: "forgent".to_string(),
        own_suffix: own_suffix.map(str::to_string),
        head: head.to_string(),
        handle: None,
    }
}

/// Registers a head that has no binding yet and returns its name.
pub fn register_new(
    state: &mut MailboxState,
    req: RegisterRequest,
    now: Timestamp,
    limits: &Limits,
    ids: &mut SeqIds,
) -> String {
    match state.register(req, None, now, limits, ids).unwrap() {
        Registered::Created { name, .. } => name.as_str().to_string(),
        other => panic!("expected a new binding, got {other:?}"),
    }
}

/// The store's judgement that the stored head is a different process.
pub fn other_head(liveness: fgos_mailbox_core::Liveness) -> Option<StoredHead> {
    Some(StoredHead {
        same_head: false,
        liveness,
    })
}

/// The store's judgement that the registering head is the stored one.
pub fn same_head() -> Option<StoredHead> {
    Some(StoredHead {
        same_head: true,
        liveness: fgos_mailbox_core::Liveness::Alive,
    })
}

use fgos_mailbox_core::{Checkpoint, Claim, Generation, MessageId, SendRequest};

/// Two heads of project `forgent`: `a` (Claude, `forgent-claude-2b`) and
/// `b` (Codex, `forgent-codex-9c`), both at generation 1.
pub struct Pair {
    pub state: MailboxState,
    pub limits: Limits,
    pub ids: SeqIds,
}

pub const A_NAME: &str = "forgent-claude-2b";
pub const B_NAME: &str = "forgent-codex-9c";

impl Pair {
    pub fn new(now: Timestamp) -> Self {
        let limits = spec_limits();
        let mut ids = SeqIds::default();
        let mut state = MailboxState::new();
        register_new(
            &mut state,
            request("a", "claude", Some("2b"), "head-a"),
            now,
            &limits,
            &mut ids,
        );
        register_new(
            &mut state,
            request("b", "codex", Some("9c"), "head-b"),
            now,
            &limits,
            &mut ids,
        );
        Self { state, limits, ids }
    }

    pub fn send(&mut self, from: &str, to: &str, body: &str, now: Timestamp) -> MessageId {
        self.state
            .send(plain(from, to, body), now, &self.limits, &mut self.ids)
            .unwrap()
            .id
    }

    pub fn claim(&mut self, key_text: &str, generation: Generation, now: Timestamp) -> Claim {
        self.state.claim(
            &key(key_text),
            generation,
            Checkpoint::Step,
            now,
            &self.limits,
            &mut self.ids,
        )
    }

    /// Replaces the head of `key_text` after its old head was judged dead.
    pub fn take_over(&mut self, key_text: &str, cli_text: &str, now: Timestamp) -> Generation {
        match self
            .state
            .register(
                request(key_text, cli_text, None, "a-new-head"),
                other_head(fgos_mailbox_core::Liveness::Dead),
                now,
                &self.limits,
                &mut self.ids,
            )
            .unwrap()
        {
            Registered::Replaced { generation, .. } => generation,
            other => panic!("expected a takeover, got {other:?}"),
        }
    }
}

/// A plain send without wake or reply hint.
pub fn plain(from: &str, to: &str, body: &str) -> SendRequest {
    SendRequest {
        from: key(from),
        to: to.to_string(),
        body: body.to_string(),
        wake: false,
        reply_to: None,
    }
}

impl Pair {
    pub fn sweep(&mut self, now: Timestamp) {
        self.state.sweep(now, &self.limits, &mut self.ids);
    }

    /// The first time strictly after `secs` seconds from `since`.
    pub fn after(since: Timestamp, secs: u64) -> Timestamp {
        Timestamp::from_millis(since.plus_secs(secs).as_millis() + 1)
    }
}
