#![allow(dead_code)]
mod support;
pub use support::{config_section, limits_contract, SeqIds};

use fgos_mailbox_core::Limits;

/// The limits as the contract states them.
pub fn spec_limits() -> Limits {
    serde_json::from_value(config_section(&limits_contract()))
        .expect("the contract fills every Limits field")
}

use fgos_mailbox_core::{
    Cli, MailboxState, RegisterRequest, Registered, StoredHead, Timestamp, WriterKey,
};

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

use fgos_mailbox_core::{Checkpoint, Claim, Generation, MessageId, Recipient, SendRequest};

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

/// A plain send without wake or reply hint, where both CLIs of the pair
/// take mail at their Stop.
pub fn plain<'a>(from: &str, to: &str, body: &'a str) -> SendRequest<'a> {
    SendRequest {
        from: key(from),
        to: Recipient::Name(to.to_string()),
        body,
        wake: false,
        reply_to: None,
        dead_keys: Default::default(),
        stop_drains: [cli("claude"), cli("codex")].into_iter().collect(),
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

use fgos_mailbox_core::{Refusal, SendOutcome};

impl Pair {
    pub fn try_send(&mut self, req: SendRequest, now: Timestamp) -> Result<SendOutcome, Refusal> {
        self.state.send(req, now, &self.limits, &mut self.ids)
    }

    /// Registers one more Codex head and returns its short name.
    pub fn add_head(&mut self, key_text: &str, now: Timestamp) -> String {
        register_new(
            &mut self.state,
            request(key_text, "codex", None, &format!("head-{key_text}")),
            now,
            &self.limits,
            &mut self.ids,
        )
    }

    /// The head of `key_text` takes its pending mail at a step checkpoint
    /// and finishes the claim: the frame was emitted.
    pub fn deliver(&mut self, key_text: &str, now: Timestamp) -> Claim {
        let generation = self.state.binding(&key(key_text)).unwrap().generation;
        let claim = self.state.claim(
            &key(key_text),
            generation,
            Checkpoint::Step,
            now,
            &self.limits,
            &mut self.ids,
        );
        if let Some(token) = &claim.token {
            self.state.finish(&key(key_text), generation, token, now);
        }
        claim
    }
}

impl Pair {
    /// A send with the sender's wake permission set.
    pub fn send_wake(&mut self, from: &str, to: &str, now: Timestamp) -> SendOutcome {
        let mut req = plain(from, to, "wake up");
        req.wake = true;
        self.try_send(req, now).unwrap()
    }
}

use fgos_mailbox_core::{ClaimedItem, ClaimedWhat, MailFrom};

/// Who sent a claimed message; a test that asks this of a notice fails.
pub fn mail_from(item: &ClaimedItem) -> &MailFrom {
    match &item.what {
        ClaimedWhat::Mail(from) => from,
        ClaimedWhat::Notice(_) => panic!("{item:?} is a notice, not mail"),
    }
}
