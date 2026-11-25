//! The head permission table: which `fgos` argv a head persona may run, ask the owner about, or never run.
//!
//! The table is data (`packages/session-host/contracts/head-permissions.v1.json`), compiled in and read only here.
//! The run supervisor resolves the caller's persona from its digest-protected envelope and asks [`decide`]; the
//! sandbox cannot change the answer. Personas inherit (`head < supervisor < secretary`; lead, planner and shaper are
//! `head` plus their own rows). The longest matching prefix wins, the strictest decision wins a tie, and an argv no
//! row matches is `ask`.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use serde_json::Value;

const TABLE: &str = include_str!("../../contracts/head-permissions.v1.json");

/// What a persona's rule says about an argv.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Decision {
    Allow,
    Ask,
    Deny,
}

impl Decision {
    pub fn as_str(self) -> &'static str {
        match self {
            Decision::Allow => "allow",
            Decision::Ask => "ask",
            Decision::Deny => "deny",
        }
    }
}

/// Who runs an allowed verb.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Policy {
    /// The run supervisor execs the host `fgos` with the argv (the forwarder).
    Forward,
    /// The policy branch of `fgos internal head-request`.
    Node,
    /// The run supervisor answers itself (`session bind session`, `session write`).
    Native,
}

/// One row of the table, as the persona sees it after inheritance.
#[derive(Debug, Clone, PartialEq)]
pub struct Rule {
    pub prefix: Vec<String>,
    pub decision: Decision,
    pub policy: Policy,
    /// A rotation successor may use this verb before it holds the role.
    pub read: bool,
    /// Argv the forwarder adds after the caller's own.
    pub append: Vec<String>,
    /// Flags the caller may not pass to this verb.
    pub refuse_flags: Vec<String>,
    /// A flag's allowed values; a flag not named is unrestricted.
    pub args: BTreeMap<String, Vec<String>>,
    /// A flag's largest whole-number value.
    pub limits: BTreeMap<String, u64>,
    /// The argv index of a session target (a role, handle or slot key) the forwarder checks.
    pub target_at: Option<usize>,
}

/// The cage size of a persona: project paths it may write, and whether it binds the mailbox or the peer sessions.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Cage {
    pub writes: Vec<String>,
    pub mailbox: bool,
    pub peers: bool,
}

/// The answer for one argv.
#[derive(Debug, Clone, PartialEq)]
pub struct Verdict {
    pub decision: Decision,
    /// The row that decided; `None` when no row matched (the default `ask`).
    pub rule: Option<Rule>,
}

struct Persona {
    cage: Cage,
    rules: Vec<Rule>,
}

struct Table {
    personas: BTreeMap<String, Persona>,
    refused_flags: Vec<String>,
    protected_config_paths: Vec<String>,
}

fn strings(value: &Value) -> Vec<String> {
    value
        .as_array()
        .map(|list| {
            list.iter()
                .filter_map(Value::as_str)
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

fn rule_of(row: &Value) -> Rule {
    let decision = match row["decision"].as_str() {
        Some("allow") => Decision::Allow,
        Some("deny") => Decision::Deny,
        _ => Decision::Ask,
    };
    let policy = match row["policy"].as_str() {
        Some("node") => Policy::Node,
        Some("native") => Policy::Native,
        _ => Policy::Forward,
    };
    Rule {
        prefix: row["prefix"]
            .as_str()
            .unwrap_or_default()
            .split(' ')
            .filter(|w| !w.is_empty())
            .map(String::from)
            .collect(),
        decision,
        policy,
        read: row["read"].as_bool().unwrap_or(false),
        append: strings(&row["append"]),
        refuse_flags: strings(&row["refuseFlags"]),
        args: row["args"]
            .as_object()
            .map(|flags| flags.iter().map(|(k, v)| (k.clone(), strings(v))).collect())
            .unwrap_or_default(),
        limits: row["limits"]
            .as_object()
            .map(|flags| {
                flags
                    .iter()
                    .filter_map(|(k, v)| Some((k.clone(), v.as_u64()?)))
                    .collect()
            })
            .unwrap_or_default(),
        target_at: row["targetAt"].as_u64().map(|at| at as usize),
    }
}

/// The compiled table. A table that does not parse is a build fault; the contract test keeps it parseable.
fn table() -> &'static Table {
    static LOADED: OnceLock<Table> = OnceLock::new();
    LOADED.get_or_init(|| {
        let doc: Value = serde_json::from_str(TABLE).expect("head-permissions.v1.json parses");
        let raw = doc["personas"].as_object().expect("personas is an object");
        let mut personas = BTreeMap::new();
        for name in raw.keys() {
            // Walk from the root ancestor down so a child's row replaces the inherited row of the same prefix.
            let mut chain = vec![name.as_str()];
            while let Some(parent) = raw[*chain.last().expect("non-empty")]["inherits"].as_str() {
                chain.push(parent);
            }
            let mut rules: Vec<Rule> = Vec::new();
            let mut cage = Cage {
                writes: vec![],
                mailbox: false,
                peers: false,
            };
            for level in chain.iter().rev() {
                let row = &raw[*level];
                for rule in row["rules"].as_array().into_iter().flatten().map(rule_of) {
                    rules.retain(|have| have.prefix != rule.prefix);
                    rules.push(rule);
                }
                cage = Cage {
                    writes: strings(&row["writes"]),
                    mailbox: row["mailbox"].as_bool().unwrap_or(false),
                    peers: row["peers"].as_bool().unwrap_or(false),
                };
            }
            personas.insert(name.clone(), Persona { cage, rules });
        }
        Table {
            personas,
            refused_flags: strings(&doc["refusedFlags"]),
            protected_config_paths: strings(&doc["protectedConfigPaths"]),
        }
    })
}

/// Whether `persona` is one the table names.
pub fn knows(persona: &str) -> bool {
    table().personas.contains_key(persona)
}

/// The persona every other one inherits: the rows all heads share. It is the base of the table, not a head a role can name.
const BASE: &str = "head";

/// The persona names a head can hold (the table's personas but its base).
pub fn personas() -> Vec<&'static str> {
    table()
        .personas
        .keys()
        .map(String::as_str)
        .filter(|name| *name != BASE)
        .collect()
}

/// The cage size of `persona`; `None` for a persona the table does not name (it holds nothing).
pub fn cage_of(persona: &str) -> Option<Cage> {
    table().personas.get(persona).map(|p| p.cage.clone())
}

/// The flags no persona may pass: they change the project root, the cwd or the environment of the call.
pub fn refused_flags() -> &'static [String] {
    &table().refused_flags
}

/// The config key paths `config patch` may never touch through the window: a `*` segment is any one key, and an edit
/// above or below a listed path is refused alike.
pub fn protected_config_paths() -> &'static [String] {
    &table().protected_config_paths
}

/// Whether `word` is a long flag word (`--name`): the window reads the `--name=value` spelling too, which the host's own
/// grammar does not, so a refused or required flag cannot be named in a spelling the table does not see.
pub fn is_long_flag(word: &str) -> bool {
    word.strip_prefix('-')
        .is_some_and(|rest| rest.starts_with('-'))
}

/// Whether the argv word `word` spells the table word `want`: equal, or `want=value` for a long flag word. The one
/// place the window compares an argv word to a flag, for the rows here and the refusals of the forwarder.
pub fn spells(word: &str, want: &str) -> bool {
    word == want
        || (is_long_flag(want)
            && word
                .strip_prefix(want)
                .is_some_and(|rest| rest.starts_with('=')))
}

/// The positional words the host reads from `argv`: a `--flag` and the value after it (when that is not itself a
/// `--` word) are not positional, exactly as the host's own argument parser reads them. A verb word is decided on
/// what the host will run, wherever flags stand.
fn host_positionals(argv: &[String]) -> Vec<&str> {
    let mut words = Vec::new();
    let mut at = 0;
    while at < argv.len() {
        if argv[at].starts_with("--") {
            at += 1;
            if argv.get(at).is_some_and(|next| !next.starts_with("--")) {
                at += 1;
            }
        } else {
            words.push(argv[at].as_str());
            at += 1;
        }
    }
    words
}

fn matches(rule: &Rule, argv: &[String], positional: &[&str]) -> bool {
    if rule.prefix.is_empty() {
        return false;
    }
    let mut verb = 0;
    for want in &rule.prefix {
        if is_long_flag(want) {
            if !argv.iter().any(|w| spells(w, want)) {
                return false;
            }
        } else {
            if positional.get(verb) != Some(&want.as_str()) {
                return false;
            }
            verb += 1;
        }
    }
    true
}

/// The decision for `argv` (the verb words and flags without `fgos`) by `persona`; `None` for an unknown persona.
/// Verb words are the host's positional words. An argv whose winning row has a flag standing before its last verb
/// word is denied: the forwarder and the policy verbs read verb words and targets by argv position.
pub fn decide(persona: &str, argv: &[String]) -> Option<Verdict> {
    let rules = &table().personas.get(persona)?.rules;
    let positional = host_positionals(argv);
    let found: Vec<&Rule> = rules
        .iter()
        .filter(|rule| matches(rule, argv, &positional))
        .collect();
    let longest = found.iter().map(|rule| rule.prefix.len()).max();
    let winner = found
        .into_iter()
        .filter(|rule| Some(rule.prefix.len()) == longest)
        .max_by_key(|rule| rule.decision);
    Some(match winner {
        Some(rule) => {
            let verb_words = rule.prefix.iter().filter(|w| !is_long_flag(w)).count();
            let flag_first = argv.iter().take(verb_words).any(|w| w.starts_with("--"));
            Verdict {
                decision: if flag_first {
                    Decision::Deny
                } else {
                    rule.decision
                },
                rule: Some(rule.clone()),
            }
        }
        None => Verdict {
            decision: Decision::Ask,
            rule: None,
        },
    })
}

/// The verbs `persona` may run (rows decided `allow`), each as its words joined by a space. A projection of the
/// table for the launch envelope and for tools that list a persona's reach; it decides nothing.
pub fn allowed_verbs(persona: &str) -> Vec<String> {
    table()
        .personas
        .get(persona)
        .map(|p| {
            p.rules
                .iter()
                .filter(|rule| rule.decision == Decision::Allow)
                .map(|rule| rule.prefix.join(" "))
                .collect()
        })
        .unwrap_or_default()
}

/// The persona of a head role (`head:<persona>-<name>`): the longest table persona the role spells, since a persona
/// and a name may both hold hyphens. `None` for a role that is not a head role or names no persona of the table.
pub fn persona_of_role(role: &str) -> Option<&'static str> {
    let rest = role.strip_prefix("head:")?;
    table()
        .personas
        .keys()
        .filter(|persona| persona.as_str() != BASE)
        .filter(|persona| {
            rest.strip_prefix(persona.as_str())
                .is_some_and(|tail| tail.starts_with('-') && tail.len() > 1)
        })
        .max_by_key(|persona| persona.len())
        .map(String::as_str)
}
