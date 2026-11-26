//! A head's opening: the one layout whose sections depend on which payloads are present.
//!
//! Sections, each a block, joined by a blank line: the persona, the session line, the task (only when a task is bound
//! and a first-step rule matched), the start ritual (its first line says whether a handoff exists; the rest is the
//! `head-start-ritual` rule), any other matching rule, the question a head continues, and the persona's `on_wake`.
//! The layout slots are rule ids: `head-start-ritual` and `head-first-step-<persona>`.

use crate::compose::{block, matches, Candidate};
use crate::persona::{persona_section, PersonaLookup};
use crate::ports::Ports;
use crate::request::{Payload, StartRequest};

const RITUAL: &str = "head-start-ritual";
const FIRST_STEP: &str = "head-first-step-";

fn required(block: crate::compose::Block) -> Candidate {
    Candidate {
        block,
        required: true,
    }
}

pub(crate) fn opening(request: &StartRequest, ports: &Ports<'_>) -> (Vec<Candidate>, Vec<String>) {
    let mut out = Vec::new();
    let mut matched = Vec::new();
    let persona = request.facts.get("persona").cloned().unwrap_or_default();
    let lookup = ports.personas.map(|p| p.lookup(&persona));
    if let Some(lookup) = &lookup {
        out.push(required(block(
            "persona",
            format!("persona:{persona}"),
            persona_section(&persona, lookup).join("\n"),
        )));
    }
    if let Some(name) = request.payloads.iter().find_map(|p| match p {
        Payload::Session { name } => Some(name.clone()),
        _ => None,
    }) {
        out.push(required(block(
            "session",
            "payload:session".into(),
            format!("You are the long-lived head session \"{name}\" (role head:{persona}-{name})."),
        )));
    }
    let rules: Vec<_> = ports
        .rules
        .rules()
        .iter()
        .filter(|r| matches(&r.when, &request.facts))
        .collect();
    let first_step = rules
        .iter()
        .find(|r| r.id == format!("{FIRST_STEP}{persona}"));
    let task = request.payloads.iter().find_map(|p| match p {
        Payload::Task { path, .. } => Some(path.clone()),
        _ => None,
    });
    if let (Some(path), Some(step)) = (&task, first_step) {
        matched.push(step.id.clone());
        let mut step_text = step.body.trim_end().to_owned();
        if let Some(domain) = request.facts.get("domain") {
            step_text = step_text.replace("domains/<domain>/", &format!("domains/{domain}/"));
        }
        out.push(required(block(
            "task",
            "payload:task".into(),
            format!("# Task\nYour task is {path}.\n{step_text}"),
        )));
    }
    let handoff = request.payloads.iter().find_map(|p| match p {
        Payload::Handoff { path, .. } => path.clone(),
        _ => None,
    });
    if let Some(ritual) = rules.iter().find(|r| r.id == RITUAL) {
        matched.push(ritual.id.clone());
        let first = match &handoff {
            Some(path) => format!("1. Read the latest handoff of this session first: {path}. It describes state as it was; verify it against the repo before acting."),
            None => "1. There is no earlier handoff for this session; start from the portfolio.".to_owned(),
        };
        out.push(required(block(
            RITUAL,
            format!("rule:{RITUAL}"),
            format!("# Start ritual\n{first}\n{}", ritual.body.trim_end()),
        )));
    }
    for rule in rules
        .iter()
        .filter(|r| r.id != RITUAL && !r.id.starts_with(FIRST_STEP))
    {
        matched.push(rule.id.clone());
        out.push(Candidate {
            block: block(&rule.id, format!("rule:{}", rule.id), rule.body.clone()),
            required: rule.kind == "law",
        });
    }
    for payload in &request.payloads {
        if let Payload::ForQuestion { .. } | Payload::Assignment { .. } = payload {
            out.push(required(block(
                payload.kind(),
                format!("payload:{}", payload.kind()),
                payload.text(),
            )));
        }
        if let Payload::Handoff {
            text: Some(text), ..
        } = payload
        {
            out.push(required(block(
                "handoff",
                "payload:handoff".into(),
                text.clone(),
            )));
        }
    }
    if let Some(PersonaLookup::Found(fields)) = &lookup {
        if !fields.on_wake.is_empty() {
            out.push(required(block(
                "on-wake",
                format!("persona:{persona}"),
                format!("# On wake\n{}", fields.on_wake),
            )));
        }
    }
    (out, matched)
}
